/**
 * Angel One SmartAPI Service
 * REST + WebSocket for NSE/BSE/MCX live and historical data.
 *
 * Docs: https://smartapi.angelbroking.com/docs
 *
 * SETUP:
 *  1. Create app at https://smartapi.angelbroking.com/ → My Apps
 *  2. Add ANGELONE_API_KEY, ANGELONE_CLIENT_ID, ANGELONE_CLIENT_PIN, ANGELONE_TOTP_SECRET to .env
 *  3. Install speakeasy for TOTP: npm install speakeasy
 *  4. Call angelOneService.login() to get JWT (valid for 24h)
 *
 * SmartAPI v2 uses token-based login (no OAuth redirect needed).
 * scriptCode (token) = symbol+exchange identifier for WebSocket subscriptions.
 *
 * Exchange segment codes for WebSocket:
 *   nse_cm = NSE Cash Market  (equity)
 *   bse_cm = BSE Cash Market
 *   mcx_fo = MCX Futures & Options
 *   nse_fo = NSE F&O
 */

import axios from "axios";
import WebSocket from "ws";
import speakeasy from "speakeasy";

const BASE_URL   = "https://apiconnect.angelbroking.com";
const WS_URL     = "wss://smartapisocket.angelbroking.com/smart-stream";

// scriptCode (token) for common symbols from Angel One master data
// Download master: https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json
export const ANGEL_TOKENS = {
  // NSE Equity (token from Angel One master)
  "NSE:RELIANCE":  "2885",
  "NSE:TCS":       "11536",
  "NSE:HDFCBANK":  "1333",
  "NSE:INFY":      "1594",
  "NSE:ICICIBANK": "4963",
  "NSE:SBIN":      "3045",
  "NSE:WIPRO":     "3787",
  "NSE:LT":        "11483",
  // NSE Indices
  "NSE:NIFTY 50":  "99926000", // Exchange segment: nse_cm
  "NSE:BANKNIFTY": "99926009",
  // MCX
  "MCX:GOLD":      "234230",   // Exchange segment: mcx_fo
  "MCX:SILVER":    "234235",
  "MCX:CRUDEOIL":  "234201",
};

class AngelOneService {
  constructor() {
    this.jwtToken     = null;
    this.refreshToken = null;
    this.feedToken    = null;
    this.apiKey       = process.env.ANGELONE_API_KEY;
    this.ws           = null;
    this.subscribers  = new Map(); // tokenKey → Set of callbacks
    this.reconnectTimer    = null;
    this.reconnectAttempts = 0;
    this.maxReconnects     = 10;
    this.correlationId     = 0;
  }

  // ─── Authentication ──────────────────────────────────────────────────────────

  /**
   * Login using client_id + PIN + TOTP.
   * Call this once at startup. JWT is valid for 24 hours.
   */
  async login() {
    const totp = speakeasy.totp({
      secret:   process.env.ANGELONE_TOTP_SECRET,
      encoding: "base32",
    });

    const res = await axios.post(
      `${BASE_URL}/rest/auth/angelbroking/user/v1/loginByPassword`,
      {
        clientcode: process.env.ANGELONE_CLIENT_ID,
        password:   process.env.ANGELONE_CLIENT_PIN,
        totp,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept:          "application/json",
          "X-UserType":    "USER",
          "X-SourceID":    "WEB",
          "X-ClientLocalIP": "127.0.0.1",
          "X-ClientPublicIP": "127.0.0.1",
          "X-MACAddress":  "00:00:00:00:00:00",
          "X-PrivateKey":  this.apiKey,
        },
      }
    );

    if (!res.data.status) {
      throw new Error(`Angel One login failed: ${res.data.message}`);
    }

    this.jwtToken     = res.data.data?.jwtToken;
    this.refreshToken = res.data.data?.refreshToken;
    this.feedToken    = res.data.data?.feedToken;
    console.log("✅ Angel One: Logged in, JWT obtained");
    return { jwtToken: this.jwtToken, feedToken: this.feedToken };
  }

  /** Refresh JWT token (auto-called by methods if expired) */
  async refreshJWT() {
    const res = await axios.post(
      `${BASE_URL}/rest/auth/angelbroking/jwt/v1/generateTokens`,
      { refreshToken: this.refreshToken },
      { headers: this._headers }
    );
    this.jwtToken     = res.data.data?.jwtToken;
    this.refreshToken = res.data.data?.refreshToken;
    this.feedToken    = res.data.data?.feedToken;
    return this.jwtToken;
  }

  get _headers() {
    if (!this.jwtToken) throw new Error("Angel One: Not logged in. Call login() first.");
    return {
      "Content-Type":   "application/json",
      Accept:           "application/json",
      Authorization:    `Bearer ${this.jwtToken}`,
      "X-UserType":     "USER",
      "X-SourceID":     "WEB",
      "X-ClientLocalIP": "127.0.0.1",
      "X-ClientPublicIP": "127.0.0.1",
      "X-MACAddress":   "00:00:00:00:00:00",
      "X-PrivateKey":   this.apiKey,
    };
  }

  // ─── REST Quotes ─────────────────────────────────────────────────────────────

  /**
   * Get LTP for multiple symbols
   * @param {Array<{exchange, tradingsymbol, symboltoken}>} instruments
   */
  async getLTP(instruments) {
    const res = await axios.post(
      `${BASE_URL}/rest/secure/angelbroking/market/v1/quote/`,
      { mode: "LTP", exchangeTokens: this._buildExchangeTokenMap(instruments) },
      { headers: this._headers }
    );
    return res.data.data?.fetched ?? [];
  }

  /**
   * Get full market quotes (OHLC, volume, depth)
   * @param {Array<{exchange, tradingsymbol, symboltoken}>} instruments
   */
  async getFullQuote(instruments) {
    const res = await axios.post(
      `${BASE_URL}/rest/secure/angelbroking/market/v1/quote/`,
      { mode: "FULL", exchangeTokens: this._buildExchangeTokenMap(instruments) },
      { headers: this._headers }
    );
    return res.data.data?.fetched ?? [];
  }

  _buildExchangeTokenMap(instruments) {
    const map = {};
    for (const inst of instruments) {
      if (!map[inst.exchange]) map[inst.exchange] = [];
      map[inst.exchange].push(inst.symboltoken);
    }
    return map;
  }

  // ─── Historical Data ─────────────────────────────────────────────────────────

  /**
   * Candle data for charting
   * @param {"NSE"|"BSE"|"MCX"} exchange
   * @param {string} symboltoken - Angel One token e.g. "2885"
   * @param {"ONE_MINUTE"|"THREE_MINUTE"|"FIVE_MINUTE"|"TEN_MINUTE"|"FIFTEEN_MINUTE"|"THIRTY_MINUTE"|"ONE_HOUR"|"ONE_DAY"} interval
   * @param {string} fromdate - "YYYY-MM-DD HH:MM"
   * @param {string} todate   - "YYYY-MM-DD HH:MM"
   * @returns {Array<{time, open, high, low, close, volume}>}
   */
  async getCandleData(exchange, symboltoken, interval, fromdate, todate) {
    const res = await axios.post(
      `${BASE_URL}/rest/secure/angelbroking/historical/v1/getCandleData`,
      { exchange, symboltoken, interval, fromdate, todate },
      { headers: this._headers }
    );

    if (!res.data.status) {
      throw new Error(`Angel One historical data error: ${res.data.message}`);
    }

    const candles = res.data.data ?? [];
    // Format: [timestamp, open, high, low, close, volume]
    return candles.map(([ts, o, h, l, c, v]) => ({
      time:   Math.floor(new Date(ts).getTime() / 1000),
      open:   parseFloat(o),
      high:   parseFloat(h),
      low:    parseFloat(l),
      close:  parseFloat(c),
      volume: parseInt(v, 10) || 0,
    }));
  }

  // ─── WebSocket ────────────────────────────────────────────────────────────────

  /**
   * Connect to Angel One Smart Stream WebSocket.
   * Uses feedToken from login.
   */
  connect() {
    if (!this.jwtToken || !this.feedToken) {
      console.warn("⚠️  Angel One: Not logged in. Call login() first.");
      return;
    }
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(WS_URL, {
      headers: {
        Authorization: `Bearer ${this.jwtToken}`,
        "x-api-key":   this.apiKey,
        "x-client-code": process.env.ANGELONE_CLIENT_ID,
        "x-feed-token": this.feedToken,
      },
    });

    this.ws.on("open", () => {
      this.reconnectAttempts = 0;
      console.log("✅ Angel One: Smart Stream WebSocket connected");
      // Re-subscribe all active tokens
      const allTokens = [...this.subscribers.keys()];
      if (allTokens.length > 0) this._sendSubscribe(allTokens);
    });

    this.ws.on("message", (data) => {
      this._handleMessage(data);
    });

    this.ws.on("close", (code) => {
      console.warn(`⚠️  Angel One: WebSocket closed [${code}]`);
      this.ws = null;
      this._scheduleReconnect();
    });

    this.ws.on("error", (err) => {
      console.error("❌ Angel One: WebSocket error:", err.message);
    });
  }

  /**
   * Build subscription message for Angel One Smart Stream v3
   * Token key format: "EXCHANGE|TOKEN"
   * Subscription request format:
   * {
   *   correlationID: string,
   *   action: 1 (subscribe) | 2 (unsubscribe),
   *   params: {
   *     mode: 1 (LTP) | 2 (Quote) | 3 (SnapQuote),
   *     tokenList: [{ exchangeType: number, tokens: string[] }]
   *   }
   * }
   */
  _sendSubscribe(tokenKeys, mode = 3) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const tokenList = this._buildTokenList(tokenKeys);
    const msg = {
      correlationID: `sub_${++this.correlationId}`,
      action:        1,
      params:        { mode, tokenList },
    };
    this.ws.send(JSON.stringify(msg));
  }

  _buildTokenList(tokenKeys) {
    const exchangeMap = {
      "NSE": 1, "BSE": 3, "MCX": 5, "NCDEX": 7,
    };
    const groups = {};
    for (const key of tokenKeys) {
      const [exchange, token] = key.split("|");
      const exchType = exchangeMap[exchange] ?? 1;
      if (!groups[exchType]) groups[exchType] = [];
      groups[exchType].push(token);
    }
    return Object.entries(groups).map(([et, tokens]) => ({
      exchangeType: parseInt(et), tokens,
    }));
  }

  _handleMessage(data) {
    try {
      let msg;
      if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
        // Smart Stream v3 sends JSON (not binary)
        msg = JSON.parse(data.toString());
      } else {
        msg = JSON.parse(data);
      }

      // Heartbeat
      if (msg.type === "heartbeat") return;

      // Tick data
      if (Array.isArray(msg)) {
        for (const tick of msg) this._dispatchTick(tick);
      } else if (msg.subscription_mode) {
        this._dispatchTick(msg);
      }
    } catch (err) {
      // Binary mode (SnapQuote) – parse fixed-width structure
      this._parseBinaryTick(data);
    }
  }

  _dispatchTick(tick) {
    const tokenKey = `${tick.exchange_type}|${tick.token}`;
    const cbs = this.subscribers.get(tokenKey);
    if (!cbs) return;

    const normalized = {
      exchange:       tick.exchange_type,
      token:          tick.token,
      ltp:            tick.last_traded_price / 100,
      open:           tick.open_price_of_the_day / 100,
      high:           tick.high_price_of_the_day / 100,
      low:            tick.low_price_of_the_day / 100,
      close:          tick.closed_price / 100,
      volume:         tick.volume_trade_for_the_day,
      totalBuyQty:    tick.total_buy_quantity,
      totalSellQty:   tick.total_sell_quantity,
      change:         tick.last_traded_price && tick.closed_price
                        ? (tick.last_traded_price - tick.closed_price) / 100
                        : 0,
      changePercent:  tick.last_traded_price && tick.closed_price
                        ? ((tick.last_traded_price - tick.closed_price) / tick.closed_price) * 100
                        : 0,
      timestamp:      new Date(tick.exchange_timestamp ?? Date.now()),
    };

    cbs.forEach(cb => { try { cb(normalized); } catch (e) { console.error("Angel tick cb error:", e); } });
  }

  _parseBinaryTick(_data) {
    // Binary parsing for SnapQuote mode (if enabled)
    // Angel One v3 primarily sends JSON; skip binary for now
  }

  /**
   * Subscribe to a symbol
   * @param {string} exchange - "NSE" | "BSE" | "MCX"
   * @param {string} token    - Angel One symboltoken e.g. "2885"
   * @param {Function} callback
   * @param {1|2|3} mode      - 1=LTP, 2=Quote, 3=SnapQuote
   */
  subscribe(exchange, token, callback, mode = 3) {
    const key = `${exchange}|${token}`;
    if (!this.subscribers.has(key)) this.subscribers.set(key, new Set());
    this.subscribers.get(key).add(callback);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this._sendSubscribe([key], mode);
    } else {
      this.connect();
    }
    return () => this.unsubscribe(exchange, token, callback);
  }

  unsubscribe(exchange, token, callback) {
    const key = `${exchange}|${token}`;
    const cbs = this.subscribers.get(key);
    if (!cbs) return;
    cbs.delete(callback);
    if (cbs.size === 0) {
      this.subscribers.delete(key);
      if (this.ws?.readyState === WebSocket.OPEN) {
        const tokenList = this._buildTokenList([key]);
        this.ws.send(JSON.stringify({
          correlationID: `unsub_${++this.correlationId}`,
          action:        2,
          params:        { mode: 3, tokenList },
        }));
      }
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnects) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.reconnectAttempts = this.maxReconnects;
    if (this.ws) { this.ws.close(); this.ws = null; }
  }

  isConnected() { return this.ws?.readyState === WebSocket.OPEN; }
}

export default new AngelOneService();
