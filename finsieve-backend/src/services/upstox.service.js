/**
 * Upstox Broker Service
 * Handles OAuth2 auth, REST quotes, and WebSocket real-time ticks
 * for NSE Equity, BSE Equity, and MCX Commodities.
 *
 * Docs: https://upstox.com/developer/api-documentation/
 *
 * SETUP (one-time per user):
 *  1. Create app at https://developer.upstox.com/
 *  2. Set redirect_uri to http://localhost:3000/api/v1/broker/upstox/callback
 *  3. Add UPSTOX_CLIENT_ID, UPSTOX_CLIENT_SECRET, UPSTOX_REDIRECT_URI to .env
 *  4. User visits GET /api/v1/broker/upstox/auth  → redirected to Upstox login
 *  5. After login, Upstox calls /callback with ?code=...
 *  6. We exchange code → access_token (stored in memory / DB)
 *
 * Instrument keys format:
 *   NSE equity:    NSE_EQ|<instrument_token>   e.g. NSE_EQ|2885  (RELIANCE)
 *   BSE equity:    BSE_EQ|<instrument_token>   e.g. BSE_EQ|500325
 *   MCX commodity: MCX_FO|<instrument_token>   e.g. MCX_FO|430596 (GOLD)
 *   NSE Index:     NSE_INDEX|Nifty 50
 *   BSE Index:     BSE_INDEX|SENSEX
 */

import axios from "axios";
import WebSocket from "ws";
import protobuf from "protobufjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = "https://api.upstox.com/v2";
const WS_URL = "wss://api.upstox.com/v2/feed/market-data-feed";

// ─── Instrument token map for common symbols ─────────────────────────────────
// Fetch full CSV from: https://assets.upstox.com/market-quote/instruments/exchange/NSE.csv.gz
// Keys are user-facing symbols, values are Upstox instrument_keys
export const UPSTOX_INSTRUMENTS = {
  // NSE Equity (top stocks)
  RELIANCE:   "NSE_EQ|INE002A01018",
  TCS:        "NSE_EQ|INE467B01029",
  HDFCBANK:   "NSE_EQ|INE040A01034",
  INFY:       "NSE_EQ|INE009A01021",
  ICICIBANK:  "NSE_EQ|INE090A01021",
  WIPRO:      "NSE_EQ|INE075A01022",
  LT:         "NSE_EQ|INE018A01030",
  BAJFINANCE: "NSE_EQ|INE296A01024",
  SBIN:       "NSE_EQ|INE062A01020",
  HINDUNILVR: "NSE_EQ|INE030A01027",
  // NSE Indices
  "NIFTY 50":   "NSE_INDEX|Nifty 50",
  "NIFTY BANK": "NSE_INDEX|Nifty Bank",
  "NIFTY IT":   "NSE_INDEX|Nifty IT",
  // MCX Commodities (active front-month – token changes each expiry, update periodically)
  GOLD:   "MCX_FO|MCX:GOLD25APRFUT",
  SILVER: "MCX_FO|MCX:SILVER25MAYFUT",
  CRUDE:  "MCX_FO|MCX:CRUDEOIL25APRFUT",
  COPPER: "MCX_FO|MCX:COPPER25APRFUT",
  // BSE Equity
  "RELIANCE-BSE": "BSE_EQ|INE002A01018",
};

class UpstoxService {
  constructor() {
    this.accessToken = null;   // Set after OAuth callback
    this.ws = null;
    this.subscribers = new Map(); // instrument_key → Set of callbacks
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnects = 10;
    this.protobufRoot = null;
    this._loadingProto = false;
  }

  // ─── OAuth2 ─────────────────────────────────────────────────────────────────

  /** Step 1: Build Upstox authorization URL to redirect user */
  getAuthUrl() {
    const params = new URLSearchParams({
      response_type: "code",
      client_id:     process.env.UPSTOX_CLIENT_ID,
      redirect_uri:  process.env.UPSTOX_REDIRECT_URI,
    });
    return `https://api.upstox.com/v2/login/authorization/dialog?${params}`;
  }

  /** Step 2: Exchange authorization code for access_token */
  async exchangeCode(code) {
    try {
      const res = await axios.post(
        "https://api.upstox.com/v2/login/authorization/token",
        new URLSearchParams({
          code,
          client_id:     process.env.UPSTOX_CLIENT_ID,
          client_secret: process.env.UPSTOX_CLIENT_SECRET,
          redirect_uri:  process.env.UPSTOX_REDIRECT_URI,
          grant_type:    "authorization_code",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" } }
      );
      this.accessToken = res.data.access_token;
      console.log("✅ Upstox: Access token obtained");
      return this.accessToken;
    } catch (err) {
      console.error("❌ Upstox token exchange failed:", err.response?.data || err.message);
      throw err;
    }
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  get _authHeaders() {
    if (!this.accessToken) throw new Error("Upstox: No access token. Complete OAuth flow first.");
    return { Authorization: `Bearer ${this.accessToken}`, Accept: "application/json" };
  }

  // ─── REST API ────────────────────────────────────────────────────────────────

  /**
   * Get full market quote (LTP, OHLC, volume, bid/ask depth)
   * @param {string[]} instrumentKeys - e.g. ["NSE_EQ|INE002A01018", "NSE_INDEX|Nifty 50"]
   */
  async getMarketQuote(instrumentKeys) {
    const res = await axios.get(`${BASE_URL}/market-quote/quotes`, {
      headers: this._authHeaders,
      params:  { instrument_key: instrumentKeys.join(",") },
    });
    return res.data.data; // { "NSE_EQ|INE002A01018": { ohlc, ltp, volume, ... }, ... }
  }

  /**
   * Get LTP only (faster, less data)
   * @param {string[]} instrumentKeys
   */
  async getLTP(instrumentKeys) {
    const res = await axios.get(`${BASE_URL}/market-quote/ltp`, {
      headers: this._authHeaders,
      params:  { instrument_key: instrumentKeys.join(",") },
    });
    return res.data.data;
  }

  /**
   * Get OHLC quote
   * @param {string[]} instrumentKeys
   * @param {"1d"|"I1"|"I30"} interval - interval for intraday OHLC
   */
  async getOHLC(instrumentKeys, interval = "1d") {
    const res = await axios.get(`${BASE_URL}/market-quote/ohlc`, {
      headers: this._authHeaders,
      params:  { instrument_key: instrumentKeys.join(","), interval },
    });
    return res.data.data;
  }

  /**
   * Get historical candle data for charting
   * @param {string} instrumentKey - e.g. "NSE_EQ|INE002A01018"
   * @param {"1minute"|"30minute"|"day"|"week"|"month"} interval
   * @param {string} toDate  - "YYYY-MM-DD"
   * @param {string} fromDate - "YYYY-MM-DD"
   * @returns {Array<{timestamp, open, high, low, close, volume}>}
   */
  async getHistoricalCandles(instrumentKey, interval, toDate, fromDate) {
    // Upstox v2 historical API:
    // GET /v2/historical-candle/{instrumentKey}/{interval}/{toDate}/{fromDate}
    const encodedKey = encodeURIComponent(instrumentKey);
    const url = `${BASE_URL}/historical-candle/${encodedKey}/${interval}/${toDate}/${fromDate}`;
    const res = await axios.get(url, { headers: this._authHeaders });

    const candles = res.data?.data?.candles ?? [];
    // Format: [timestamp, open, high, low, close, volume, oi]
    return candles.map(([ts, o, h, l, c, v]) => ({
      time:   Math.floor(new Date(ts).getTime() / 1000), // Unix seconds for Lightweight Charts
      open:   o,
      high:   h,
      low:    l,
      close:  c,
      volume: v,
    }));
  }

  /**
   * Get intraday candle data
   * @param {string} instrumentKey
   * @param {"1minute"|"30minute"} interval
   */
  async getIntradayCandles(instrumentKey, interval = "1minute") {
    const encodedKey = encodeURIComponent(instrumentKey);
    const url = `${BASE_URL}/historical-candle/intraday/${encodedKey}/${interval}`;
    const res = await axios.get(url, { headers: this._authHeaders });

    const candles = res.data?.data?.candles ?? [];
    return candles.map(([ts, o, h, l, c, v]) => ({
      time:   Math.floor(new Date(ts).getTime() / 1000),
      open:   o,
      high:   h,
      low:    l,
      close:  c,
      volume: v,
    }));
  }

  /**
   * Search instruments by name/symbol
   * @param {string} query - e.g. "RELIANCE"
   * @param {string} exchange - "NSE_EQ" | "BSE_EQ" | "MCX_FO"
   */
  async searchInstruments(query, exchange = "") {
    const res = await axios.get(`${BASE_URL}/market-quote/search`, {
      headers: this._authHeaders,
      params:  { query, exchange },
    });
    return res.data.data ?? [];
  }

  // ─── Protobuf decoder ────────────────────────────────────────────────────────

  async _loadProto() {
    if (this.protobufRoot) return;
    if (this._loadingProto) return;
    this._loadingProto = true;
    try {
      // Upstox v2 WebSocket uses protobuf binary encoding.
      // Proto schema: https://github.com/upstox/upstox-python/blob/master/upstox_client/feeder/MarketDataFeed.proto
      // We embed the minimal schema needed here.
      const protoContent = `
syntax = "proto3";
package com.upstox.marketdatafeeder.rpc.proto;

message FeedResponse {
  Type type = 1;
  map<string, Feed> feeds = 2;
}

enum Type {
  initial_feed = 0;
  live_feed = 1;
}

message Feed {
  oneof FeedUnion {
    FullFeed ff = 1;
    LtpFeed lf = 2;
  }
}

message FullFeed {
  MarketFullFeed marketFF = 1;
}

message LtpFeed {
  MarketLtpFeed marketLtpFeed = 1;
}

message MarketFullFeed {
  LTPC ltpc = 1;
  MarketLevel marketLevel = 2;
  OI oi = 3;
  float tbq = 4;
  float tsq = 5;
  float vtt = 6;
  float atp = 7;
  float lc = 8;
  float uc = 9;
  float yh = 10;
  float yl = 11;
  uint64 vol = 12;
  OHLC ohlc = 13;
}

message MarketLtpFeed {
  LTPC ltpc = 1;
}

message LTPC {
  float ltp = 1;
  uint64 ltt = 2;
  float lc  = 3;
  float cp  = 4;
}

message OHLC {
  float open  = 1;
  float high  = 2;
  float low   = 3;
  float close = 4;
}

message OI {
  float dayOI  = 1;
  float prevDayOI = 2;
}

message MarketLevel {
  repeated Quote bidAskQuote = 1;
}

message Quote {
  float bidQ = 1;
  float askQ = 2;
  float bidP = 3;
  float askP = 4;
}
`;
      this.protobufRoot = protobuf.parse(protoContent).root;
      console.log("✅ Upstox: Protobuf schema loaded");
    } catch (err) {
      console.error("❌ Upstox: Failed to load protobuf schema:", err.message);
      this.protobufRoot = null;
    } finally {
      this._loadingProto = false;
    }
  }

  _decodeProto(buffer) {
    try {
      if (!this.protobufRoot) return null;
      const FeedResponse = this.protobufRoot.lookupType(
        "com.upstox.marketdatafeeder.rpc.proto.FeedResponse"
      );
      return FeedResponse.decode(buffer);
    } catch {
      return null;
    }
  }

  // ─── WebSocket ───────────────────────────────────────────────────────────────

  /**
   * Connect to Upstox market data WebSocket.
   * Subscribers registered via subscribe() receive tick callbacks.
   */
  async connect() {
    if (!this.accessToken) {
      console.warn("⚠️  Upstox: No access token, cannot open WebSocket");
      return;
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    await this._loadProto();

    this.ws = new WebSocket(WS_URL, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      handshakeTimeout: 15000,
    });

    this.ws.binaryType = "arraybuffer";

    this.ws.on("open", () => {
      this.reconnectAttempts = 0;
      console.log("✅ Upstox: WebSocket connected");
      // Re-subscribe all active instrument keys
      const keys = [...this.subscribers.keys()];
      if (keys.length > 0) this._sendSubscription(keys);
    });

    this.ws.on("message", (data) => {
      this._handleMessage(data);
    });

    this.ws.on("close", (code, reason) => {
      console.warn(`⚠️  Upstox: WebSocket closed [${code}] ${reason}`);
      this.ws = null;
      this._scheduleReconnect();
    });

    this.ws.on("error", (err) => {
      console.error("❌ Upstox: WebSocket error:", err.message);
    });
  }

  _sendSubscription(instrumentKeys, mode = "full") {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const msg = JSON.stringify({
      guid:    Date.now().toString(),
      method:  "sub",
      data_type: mode, // "full" | "quote" | "ltp"
      data:    { instrumentKeys },
    });
    this.ws.send(msg);
  }

  _handleMessage(rawData) {
    let decoded = null;

    if (rawData instanceof ArrayBuffer || Buffer.isBuffer(rawData)) {
      const buf = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData);
      decoded = this._decodeProto(buf);
    } else if (typeof rawData === "string") {
      try { decoded = JSON.parse(rawData); } catch { return; }
    }

    if (!decoded?.feeds) return;

    for (const [key, feedData] of Object.entries(decoded.feeds)) {
      const callbacks = this.subscribers.get(key);
      if (!callbacks || callbacks.size === 0) continue;

      const tick = this._normalizeFeed(key, feedData);
      if (!tick) continue;

      callbacks.forEach(cb => {
        try { cb(tick); } catch (e) { console.error("Upstox tick callback error:", e); }
      });
    }
  }

  _normalizeFeed(instrumentKey, feed) {
    try {
      const ff = feed?.ff?.marketFF;
      const lf = feed?.lf?.marketLtpFeed;
      const src = ff ?? lf;
      if (!src) return null;

      const ltpc = src.ltpc ?? {};
      return {
        instrumentKey,
        ltp:           ltpc.ltp ?? 0,
        lastTradedTime: ltpc.ltt ? new Date(Number(ltpc.ltt)) : new Date(),
        change:        ltpc.ltp && ltpc.cp ? ltpc.ltp - ltpc.cp : 0,
        changePercent: ltpc.cp && ltpc.ltp ? ((ltpc.ltp - ltpc.cp) / ltpc.cp) * 100 : 0,
        previousClose: ltpc.cp ?? 0,
        ohlc: ff ? {
          open:  ff.ohlc?.open  ?? 0,
          high:  ff.ohlc?.high  ?? 0,
          low:   ff.ohlc?.low   ?? 0,
          close: ff.ohlc?.close ?? 0,
        } : undefined,
        volume:    ff?.vol   ?? ff?.vtt ?? 0,
        avgPrice:  ff?.atp   ?? 0,
        oi:        ff?.oi?.dayOI ?? 0,
        upperCircuit: ff?.uc ?? 0,
        lowerCircuit: ff?.lc ?? 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Subscribe to real-time ticks for an instrument
   * @param {string} instrumentKey - e.g. "NSE_EQ|INE002A01018"
   * @param {Function} callback     - called with normalized tick object
   * @returns {Function} unsubscribe function
   */
  subscribe(instrumentKey, callback) {
    if (!this.subscribers.has(instrumentKey)) {
      this.subscribers.set(instrumentKey, new Set());
    }
    this.subscribers.get(instrumentKey).add(callback);

    // Subscribe on WebSocket if open
    if (this.ws?.readyState === WebSocket.OPEN) {
      this._sendSubscription([instrumentKey]);
    } else {
      // Connect first if not connected
      this.connect();
    }

    return () => this.unsubscribe(instrumentKey, callback);
  }

  unsubscribe(instrumentKey, callback) {
    const cbs = this.subscribers.get(instrumentKey);
    if (!cbs) return;
    cbs.delete(callback);
    if (cbs.size === 0) {
      this.subscribers.delete(instrumentKey);
      // Send unsubscribe message
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          guid: Date.now().toString(), method: "unsub",
          data: { instrumentKeys: [instrumentKey] },
        }));
      }
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnects) {
      console.error("❌ Upstox: Max reconnect attempts reached");
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    console.log(`⏳ Upstox: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
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

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export default new UpstoxService();
