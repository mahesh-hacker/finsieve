/**
 * NSE India Indices WebSocket Service
 * Connects to NSE real-time index stream for Nifty 50.
 * Stream: wss://streamer.nseindia.com/streams/indices/high/nifty50?index=nifty 50
 * On each message, parses price/change (JSON or UTF-8 text) and updates global_indices
 * so app Nifty 50 price matches NSE. If NSE sends binary/LZO packets, only JSON
 * messages are parsed; REST polling still keeps indices updated.
 */

import WebSocket from "ws";
import { query } from "../config/database.js";

const NIFTY50_WS_URL =
  "wss://streamer.nseindia.com/streams/indices/high/nifty50?index=nifty%2050";

class NSEIndicesWebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelayMs = 5000;
    this.reconnectTimer = null;
    this.lastUpdate = null;
    this.isMarketOpen = null; // set by scheduler or market hours check
  }

  /**
   * Parse numeric value from stream (may be string with commas)
   */
  parseNum(val) {
    if (val == null) return NaN;
    if (typeof val === "number" && !isNaN(val)) return val;
    const s = String(val).replace(/,/g, "").trim();
    const n = parseFloat(s);
    return isNaN(n) ? NaN : n;
  }

  /**
   * Extract Nifty 50 price and change from WebSocket message.
   * Handles JSON with common field names: last, ltp, close, value; percChange, percentChange, pChange.
   */
  parseNifty50Message(data) {
    try {
      const obj = typeof data === "string" ? JSON.parse(data) : data;
      const current_value = this.parseNum(
        obj.last ?? obj.ltp ?? obj.close ?? obj.currentValue ?? obj.value ?? obj.price,
      );
      if (isNaN(current_value) || current_value <= 0) return null;

      const change_percent = this.parseNum(
        obj.percChange ?? obj.percentChange ?? obj.pChange ?? obj.changePercent,
      );
      const previous_close = this.parseNum(
        obj.previousClose ?? obj.prevClose ?? obj.previous_close,
      );
      const change = this.parseNum(obj.variation ?? obj.change ?? obj.netChange);
      const open_value = this.parseNum(obj.open);
      const high_value = this.parseNum(obj.high);
      const low_value = this.parseNum(obj.low);

      const prevClose = !isNaN(previous_close) ? previous_close : null;
      const pct = !isNaN(change_percent)
        ? change_percent
        : prevClose
          ? ((current_value - prevClose) / prevClose) * 100
          : 0;
      const changeAbs = !isNaN(change)
        ? change
        : prevClose
          ? current_value - prevClose
          : 0;

      return {
        symbol: "NIFTY",
        name: "NIFTY 50",
        current_value,
        change: changeAbs,
        change_percent: pct,
        previous_close: prevClose,
        open: !isNaN(open_value) ? open_value : null,
        high: !isNaN(high_value) ? high_value : null,
        low: !isNaN(low_value) ? low_value : null,
      };
    } catch {
      return null;
    }
  }

  /**
   * Update NIFTY 50 row in global_indices from WebSocket tick
   */
  async updateNifty50InDb(payload) {
    if (!payload || payload.symbol !== "NIFTY") return;
    try {
      await query(
        `INSERT INTO global_indices (name, symbol, current_value, change, change_percent, previous_close, open, high, low, country, last_updated)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'India', CURRENT_TIMESTAMP)
         ON CONFLICT (symbol) DO UPDATE SET
           current_value = EXCLUDED.current_value,
           change = EXCLUDED.change,
           change_percent = EXCLUDED.change_percent,
           previous_close = EXCLUDED.previous_close,
           open = EXCLUDED.open,
           high = EXCLUDED.high,
           low = EXCLUDED.low,
           last_updated = EXCLUDED.last_updated`,
        [
          payload.name,
          payload.symbol,
          payload.current_value,
          payload.change,
          payload.change_percent,
          payload.previous_close,
          payload.open,
          payload.high,
          payload.low,
        ],
      );
      this.lastUpdate = new Date();
    } catch (err) {
      console.error("❌ NSE WebSocket: DB update failed", err.message);
    }
  }

  /**
   * Handle incoming WebSocket message (text or binary)
   */
  onMessage(data) {
    let parsed = null;
    if (typeof data === "string") {
      parsed = this.parseNifty50Message(data);
    } else if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
      try {
        const str = data.toString("utf8");
        parsed = this.parseNifty50Message(str);
      } catch {
        // Binary protocol (e.g. LZO) would need separate handling per NSE spec
      }
    }
    if (parsed) this.updateNifty50InDb(parsed);
  }

  /**
   * Connect to NSE indices WebSocket (Nifty 50 stream)
   */
  connect(options = {}) {
    const { cookies = "", onlyWhenMarketOpen = true } = options;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    const url = NIFTY50_WS_URL;
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.nseindia.com/",
      Origin: "https://www.nseindia.com",
    };
    if (cookies) headers.Cookie = cookies;

    try {
      this.ws = new WebSocket(url, {
        headers,
        handshakeTimeout: 15000,
      });

      this.ws.on("open", () => {
        this.reconnectAttempts = 0;
        console.log("✅ NSE Nifty 50 WebSocket connected");
      });

      this.ws.on("message", (data) => {
        this.onMessage(data);
      });

      this.ws.on("close", (code, reason) => {
        this.ws = null;
        console.log("NSE Nifty 50 WebSocket closed", code, reason?.toString());
        if (onlyWhenMarketOpen && this.isMarketOpen === false) return;
        this.scheduleReconnect(options);
      });

      this.ws.on("error", (err) => {
        console.error("NSE Nifty 50 WebSocket error:", err.message);
      });
    } catch (err) {
      console.error("NSE WebSocket connect failed:", err.message);
      this.scheduleReconnect(options);
    }
  }

  scheduleReconnect(options) {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("NSE WebSocket: max reconnect attempts reached");
      return;
    }
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(options);
    }, this.reconnectDelayMs);
  }

  /**
   * Disconnect and stop reconnects
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log("NSE Nifty 50 WebSocket disconnected");
  }

  /**
   * Set market-open flag (e.g. from scheduler) so we only reconnect during market hours
   */
  setMarketOpen(open) {
    this.isMarketOpen = open;
  }

  getLastUpdate() {
    return this.lastUpdate;
  }

  isConnected() {
    return this.ws != null && this.ws.readyState === WebSocket.OPEN;
  }
}

const nseIndicesWebSocketService = new NSEIndicesWebSocketService();
export default nseIndicesWebSocketService;
