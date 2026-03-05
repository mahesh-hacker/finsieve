/**
 * Zerodha Kite Connect Service
 * Handles OAuth2, REST (quotes, historical), WebSocket live ticks.
 *
 * Docs: https://kite.trade/docs/connect/v3/
 *
 * SETUP:
 *  1. Register app at https://developers.kite.trade/
 *  2. Set redirect_uri = http://localhost:3000/api/v1/broker/zerodha/callback
 *  3. Add ZERODHA_API_KEY, ZERODHA_API_SECRET to .env
 *  4. User visits GET /api/v1/broker/zerodha/auth → redirected to Kite login
 *  5. Callback receives request_token → exchange for access_token
 *
 * Instrument tokens: Download from https://api.kite.trade/instruments
 * Common tokens:
 *   RELIANCE  NSE  738561
 *   NIFTY 50  NSE  256265
 *   SENSEX    BSE  265
 *   GOLD      MCX  58424833  (front-month, changes each expiry)
 *   SILVER    MCX  58498305
 *   CRUDEOIL  MCX  57862407
 */

import axios from "axios";
import crypto from "crypto";
import WebSocket from "ws";

const BASE_URL = "https://api.kite.trade";
const LOGIN_URL = "https://kite.zerodha.com/connect/login";
const WS_URL    = "wss://ws.kite.trade";

// Common Kite instrument tokens (exchange:tradingsymbol → token)
export const KITE_TOKENS = {
  // NSE Equity
  "NSE:RELIANCE":  738561,
  "NSE:TCS":       2953217,
  "NSE:HDFCBANK":  341249,
  "NSE:INFY":      408065,
  "NSE:ICICIBANK": 1270529,
  "NSE:SBIN":      779521,
  "NSE:WIPRO":     969473,
  "NSE:LT":        2939649,
  "NSE:BAJFINANCE":4267265,
  // NSE Indices
  "NSE:NIFTY 50":  256265,
  "NSE:NIFTY BANK":260105,
  // MCX Commodities (front-month – update periodically from /instruments/MCX)
  "MCX:GOLD":      58424833,
  "MCX:SILVER":    58498305,
  "MCX:CRUDEOIL":  57862407,
  "MCX:COPPER":    58434567,
  // BSE
  "BSE:SENSEX":    265,
  "BSE:RELIANCE":  500325,
};

// Kite tick binary packet structure (mode constants)
const TICK_MODES = { LTP: "ltp", QUOTE: "quote", FULL: "full" };

class ZerodhaService {
  constructor() {
    this.accessToken = null;
    this.apiKey      = process.env.ZERODHA_API_KEY;
    this.ws          = null;
    this.subscribers = new Map(); // instrumentToken (number) → Set of callbacks
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnects = 10;
    this.pingInterval  = null;
  }

  // ─── OAuth ────────────────────────────────────────────────────────────────────

  getAuthUrl() {
    return `${LOGIN_URL}?api_key=${this.apiKey}&v=3`;
  }

  /** Exchange request_token (from callback) for access_token */
  async exchangeToken(requestToken) {
    const checksum = crypto
      .createHash("sha256")
      .update(`${this.apiKey}${requestToken}${process.env.ZERODHA_API_SECRET}`)
      .digest("hex");

    const res = await axios.post(
      `${BASE_URL}/session/token`,
      new URLSearchParams({ api_key: this.apiKey, request_token: requestToken, checksum }),
      { headers: { "X-Kite-Version": "3", "Content-Type": "application/x-www-form-urlencoded" } }
    );
    this.accessToken = res.data.data?.access_token;
    console.log("✅ Zerodha: Access token obtained");
    return this.accessToken;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  get _headers() {
    if (!this.accessToken) throw new Error("Zerodha: No access token");
    return {
      "X-Kite-Version": "3",
      Authorization:    `token ${this.apiKey}:${this.accessToken}`,
    };
  }

  // ─── REST Quotes ─────────────────────────────────────────────────────────────

  /**
   * Full market quote (LTP, OHLC, volume, depth)
   * @param {string[]} instruments - e.g. ["NSE:RELIANCE", "MCX:GOLD"]
   */
  async getQuote(instruments) {
    const res = await axios.get(`${BASE_URL}/quote`, {
      headers: this._headers,
      params: { i: instruments },
    });
    return res.data.data; // { "NSE:RELIANCE": { last_price, ohlc, volume, depth, ... } }
  }

  /** LTP only – lightweight */
  async getLTP(instruments) {
    const res = await axios.get(`${BASE_URL}/quote/ltp`, {
      headers: this._headers,
      params: { i: instruments },
    });
    return res.data.data;
  }

  /** OHLC */
  async getOHLC(instruments) {
    const res = await axios.get(`${BASE_URL}/quote/ohlc`, {
      headers: this._headers,
      params: { i: instruments },
    });
    return res.data.data;
  }

  // ─── Historical Data ─────────────────────────────────────────────────────────

  /**
   * Historical candle data for charts
   * @param {number} instrumentToken - e.g. 738561
   * @param {"minute"|"3minute"|"5minute"|"10minute"|"15minute"|"30minute"|"60minute"|"day"|"week"|"month"} interval
   * @param {string} fromDate  - "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"
   * @param {string} toDate    - "YYYY-MM-DD"
   * @param {boolean} continuous - true for continuous futures data
   * @returns {Array<{time, open, high, low, close, volume}>}
   */
  async getHistoricalData(instrumentToken, interval, fromDate, toDate, continuous = false) {
    const url = `${BASE_URL}/instruments/historical/${instrumentToken}/${interval}`;
    const res = await axios.get(url, {
      headers: this._headers,
      params: { from: fromDate, to: toDate, continuous: continuous ? 1 : 0 },
    });
    const candles = res.data?.data?.candles ?? [];
    // Format: [date, open, high, low, close, volume, oi]
    return candles.map(([ts, o, h, l, c, v]) => ({
      time:   Math.floor(new Date(ts).getTime() / 1000),
      open:   o, high: h, low: l, close: c, volume: v,
    }));
  }

  // ─── Instrument Search ────────────────────────────────────────────────────────

  /** Fetch full NSE/BSE/MCX instrument list (cached CSV) */
  async getInstruments(exchange = "NSE") {
    const res = await axios.get(`${BASE_URL}/instruments/${exchange}`, {
      headers: this._headers,
    });
    // Returns CSV; parse first 200 lines as quick sample
    const lines = res.data.split("\n").slice(0, 200);
    const headers = lines[0].split(",");
    return lines.slice(1).map(line => {
      const vals = line.split(",");
      return headers.reduce((obj, h, i) => { obj[h.trim()] = vals[i]?.trim(); return obj; }, {});
    });
  }

  // ─── WebSocket Binary Decoder ─────────────────────────────────────────────────

  /** Parse Kite binary tick packet */
  _parseTicks(buffer) {
    const ticks = [];
    const view = new DataView(buffer);
    let pos = 0;

    const numPackets = view.getInt16(pos); pos += 2;
    for (let i = 0; i < numPackets; i++) {
      if (pos + 2 > buffer.byteLength) break;
      const packetLen = view.getInt16(pos); pos += 2;
      if (pos + packetLen > buffer.byteLength) break;

      const token    = view.getInt32(pos);
      const segment  = token & 0xFF;
      const divisor  = (segment === 3 || segment === 4) ? 100 : (segment === 9 ? 10000000 : 100);
      const isTradable = segment !== 9; // 9 = indices (non-tradable)

      const tick = { instrumentToken: token, tradable: isTradable };

      if (packetLen === 8) {
        // LTP mode
        tick.mode = "ltp";
        tick.lastPrice = view.getInt32(pos + 4) / divisor;
      } else if (packetLen === 28) {
        // Quote mode
        tick.mode = "quote";
        tick.lastPrice = view.getInt32(pos + 4) / divisor;
        tick.lastTradedQuantity = view.getInt32(pos + 8);
        tick.averageTradePrice  = view.getInt32(pos + 12) / divisor;
        tick.volumeTraded       = view.getInt32(pos + 16);
        tick.totalBuyQuantity   = view.getInt32(pos + 20);
        tick.totalSellQuantity  = view.getInt32(pos + 24);
        tick.ohlc = {
          open:  view.getInt32(pos + 28) / divisor,
          high:  view.getInt32(pos + 32) / divisor,
          low:   view.getInt32(pos + 36) / divisor,
          close: view.getInt32(pos + 40) / divisor,
        };
        tick.change = tick.ohlc.close
          ? ((tick.lastPrice - tick.ohlc.close) / tick.ohlc.close) * 100
          : 0;
      } else if (packetLen >= 44) {
        // Full mode (with market depth)
        tick.mode = "full";
        tick.lastPrice          = view.getInt32(pos + 4) / divisor;
        tick.lastTradedQuantity = view.getInt32(pos + 8);
        tick.averageTradePrice  = view.getInt32(pos + 12) / divisor;
        tick.volumeTraded       = view.getInt32(pos + 16);
        tick.totalBuyQuantity   = view.getInt32(pos + 20);
        tick.totalSellQuantity  = view.getInt32(pos + 24);
        tick.ohlc = {
          open:  view.getInt32(pos + 28) / divisor,
          high:  view.getInt32(pos + 32) / divisor,
          low:   view.getInt32(pos + 36) / divisor,
          close: view.getInt32(pos + 40) / divisor,
        };
        tick.change = tick.ohlc.close
          ? ((tick.lastPrice - tick.ohlc.close) / tick.ohlc.close) * 100
          : 0;
        tick.changeAbsolute = tick.lastPrice - tick.ohlc.close;
        // Market depth (5 levels each side) starts at offset 64
        if (packetLen >= 184) {
          tick.depth = { buy: [], sell: [] };
          for (let d = 0; d < 5; d++) {
            const offset = pos + 64 + d * 12;
            tick.depth.buy.push({
              quantity: view.getInt32(offset),
              price:    view.getInt32(offset + 4) / divisor,
              orders:   view.getInt16(offset + 8),
            });
          }
          for (let d = 0; d < 5; d++) {
            const offset = pos + 64 + 60 + d * 12;
            tick.depth.sell.push({
              quantity: view.getInt32(offset),
              price:    view.getInt32(offset + 4) / divisor,
              orders:   view.getInt16(offset + 8),
            });
          }
        }
      }

      ticks.push(tick);
      pos += packetLen;
    }
    return ticks;
  }

  // ─── WebSocket ────────────────────────────────────────────────────────────────

  connect() {
    if (!this.accessToken) { console.warn("⚠️  Zerodha: No access token"); return; }
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const url = `${WS_URL}?api_key=${this.apiKey}&access_token=${this.accessToken}`;
    this.ws = new WebSocket(url);
    this.ws.binaryType = "arraybuffer";

    this.ws.on("open", () => {
      this.reconnectAttempts = 0;
      console.log("✅ Zerodha: WebSocket connected");
      // Re-subscribe all active tokens
      const tokens = [...this.subscribers.keys()];
      if (tokens.length > 0) this._sendSubscribe(tokens);
      // Kite requires heartbeat ping every 3s
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) this.ws.ping();
      }, 3000);
    });

    this.ws.on("message", (data) => {
      if (typeof data === "string") {
        // Text messages: {"type":"order_update",...} or {"type":"message",...}
        try {
          const msg = JSON.parse(data);
          if (msg.type === "order_update") {
            // Emit order updates – handled by broadcaster
          }
        } catch { /* ignore */ }
        return;
      }
      // Binary = tick data
      const buf = Buffer.isBuffer(data) ? data.buffer : data;
      const view = new DataView(buf instanceof ArrayBuffer ? buf : buf.buffer);
      if (view.byteLength < 2) return;

      const ticks = this._parseTicks(buf instanceof ArrayBuffer ? buf : buf.buffer);
      for (const tick of ticks) {
        const cbs = this.subscribers.get(tick.instrumentToken);
        if (!cbs) continue;
        cbs.forEach(cb => { try { cb(tick); } catch (e) { console.error("Zerodha tick cb error:", e); } });
      }
    });

    this.ws.on("close", (code) => {
      console.warn(`⚠️  Zerodha: WebSocket closed [${code}]`);
      if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null; }
      this.ws = null;
      this._scheduleReconnect();
    });

    this.ws.on("error", (err) => {
      console.error("❌ Zerodha: WebSocket error:", err.message);
    });
  }

  _sendSubscribe(tokens, mode = "full") {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ a: "subscribe", v: tokens }));
    this.ws.send(JSON.stringify({ a: "mode", v: [mode, tokens] }));
  }

  subscribe(instrumentToken, callback, mode = "full") {
    if (!this.subscribers.has(instrumentToken)) {
      this.subscribers.set(instrumentToken, new Set());
    }
    this.subscribers.get(instrumentToken).add(callback);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this._sendSubscribe([instrumentToken], mode);
    } else {
      this.connect();
    }
    return () => this.unsubscribe(instrumentToken, callback);
  }

  unsubscribe(instrumentToken, callback) {
    const cbs = this.subscribers.get(instrumentToken);
    if (!cbs) return;
    cbs.delete(callback);
    if (cbs.size === 0) {
      this.subscribers.delete(instrumentToken);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ a: "unsubscribe", v: [instrumentToken] }));
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
    if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null; }
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.reconnectAttempts = this.maxReconnects;
    if (this.ws) { this.ws.close(); this.ws = null; }
  }

  isConnected() { return this.ws?.readyState === WebSocket.OPEN; }
}

export default new ZerodhaService();
