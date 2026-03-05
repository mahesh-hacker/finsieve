/**
 * Market Data Broadcaster
 *
 * Architecture:
 *   Broker WS (Upstox / Zerodha / AngelOne)
 *       │
 *       ▼
 *   marketDataBroadcaster   ← Node.js in-process hub
 *       │
 *       ▼
 *   Frontend clients via WebSocket (ws://localhost:3000/ws/market)
 *
 * Frontend connects once and sends subscription messages:
 *   { action: "subscribe",   symbols: ["NSE:RELIANCE", "MCX:GOLD"] }
 *   { action: "unsubscribe", symbols: ["NSE:RELIANCE"] }
 *
 * Broadcaster sends tick updates:
 *   { type: "tick", symbol: "NSE:RELIANCE", data: { ltp, change, changePercent, ohlc, volume, ... } }
 *   { type: "status", broker: "upstox", connected: true }
 *
 * Broker selection priority: Upstox (MCX+NSE) → Zerodha (fallback NSE/BSE) → AngelOne (fallback)
 */

import { WebSocketServer } from "ws";
import upstoxService,  { UPSTOX_INSTRUMENTS }  from "./upstox.service.js";
import zerodhaService, { KITE_TOKENS }         from "./zerodha.service.js";
import angelOneService, { ANGEL_TOKENS }        from "./angelone.service.js";

// ─── Symbol → Broker instrument mapping ─────────────────────────────────────
// Priority: Upstox for MCX, NSE equities, indices; Zerodha as fallback
const SYMBOL_BROKER_MAP = {
  // NSE Equities → Upstox
  "NSE:RELIANCE":   { broker: "upstox",   key: UPSTOX_INSTRUMENTS.RELIANCE  },
  "NSE:TCS":        { broker: "upstox",   key: UPSTOX_INSTRUMENTS.TCS       },
  "NSE:HDFCBANK":   { broker: "upstox",   key: UPSTOX_INSTRUMENTS.HDFCBANK  },
  "NSE:INFY":       { broker: "upstox",   key: UPSTOX_INSTRUMENTS.INFY      },
  "NSE:ICICIBANK":  { broker: "upstox",   key: UPSTOX_INSTRUMENTS.ICICIBANK },
  "NSE:WIPRO":      { broker: "upstox",   key: UPSTOX_INSTRUMENTS.WIPRO     },
  "NSE:LT":         { broker: "upstox",   key: UPSTOX_INSTRUMENTS.LT        },
  "NSE:BAJFINANCE": { broker: "upstox",   key: UPSTOX_INSTRUMENTS.BAJFINANCE },
  "NSE:SBIN":       { broker: "upstox",   key: UPSTOX_INSTRUMENTS.SBIN      },
  "NSE:HINDUNILVR": { broker: "upstox",   key: UPSTOX_INSTRUMENTS.HINDUNILVR },
  // NSE Indices → Upstox
  "NSE:NIFTY50":    { broker: "upstox",   key: UPSTOX_INSTRUMENTS["NIFTY 50"]   },
  "NSE:BANKNIFTY":  { broker: "upstox",   key: UPSTOX_INSTRUMENTS["NIFTY BANK"] },
  "NSE:NIFTYIT":    { broker: "upstox",   key: UPSTOX_INSTRUMENTS["NIFTY IT"]   },
  // MCX Commodities → Upstox (primary for MCX)
  "MCX:GOLD":       { broker: "upstox",   key: UPSTOX_INSTRUMENTS.GOLD   },
  "MCX:SILVER":     { broker: "upstox",   key: UPSTOX_INSTRUMENTS.SILVER },
  "MCX:CRUDE":      { broker: "upstox",   key: UPSTOX_INSTRUMENTS.CRUDE  },
  "MCX:COPPER":     { broker: "upstox",   key: UPSTOX_INSTRUMENTS.COPPER },
  // Zerodha fallbacks
  "NSE:RELIANCE_Z": { broker: "zerodha",  key: KITE_TOKENS["NSE:RELIANCE"]   },
  "BSE:SENSEX":     { broker: "zerodha",  key: KITE_TOKENS["BSE:SENSEX"]     },
  // Angel One (NSE equity fallback)
  "NSE:RELIANCE_A": { broker: "angelone", exchange: "NSE", token: ANGEL_TOKENS["NSE:RELIANCE"] },
};

const BROKERS = { upstox: upstoxService, zerodha: zerodhaService, angelone: angelOneService };

class MarketDataBroadcaster {
  constructor() {
    this.wss       = null;     // WebSocketServer (attached to HTTP server)
    this.clients   = new Map(); // ws → Set<symbol>
    this.clientTiers = new Map(); // ws → "free" | "basic" | "premium" | "enterprise"
    this.symbolSubs = new Map(); // symbol → { broker, unsubFn, clients: Set<ws> }
    this.lastTick   = new Map(); // symbol → last tick (for new-client cache)
    this.onTierChangeCallback = null; // (hasPremiumOrEnterprise: boolean) => void
    this._lastHadPremiumOrEnterprise = false;
  }

  /** Call after attach() to enable 1s updates when any premium/enterprise client is connected */
  setOnTierChangeCallback(cb) {
    this.onTierChangeCallback = cb;
  }

  hasPremiumOrEnterpriseClient() {
    for (const tier of this.clientTiers.values()) {
      if (tier === "premium" || tier === "enterprise") return true;
    }
    return false;
  }

  _checkTierChange() {
    if (!this.onTierChangeCallback) return;
    const now = this.hasPremiumOrEnterpriseClient();
    if (now !== this._lastHadPremiumOrEnterprise) {
      this._lastHadPremiumOrEnterprise = now;
      this.onTierChangeCallback(now);
    }
  }

  /**
   * Attach a WebSocketServer to an existing HTTP server.
   * Call this after creating the Express HTTP server.
   * @param {import("http").Server} httpServer
   * @param {string} path - WebSocket path prefix, e.g. "/ws/market"
   */
  attach(httpServer, path = "/ws/market") {
    this.wss = new WebSocketServer({ server: httpServer, path });

    this.wss.on("connection", (ws, req) => {
      console.log(`📡 Market WS: client connected (${req.socket.remoteAddress})`);
      this.clients.set(ws, new Set());

      ws.on("message", (raw) => this._handleClientMessage(ws, raw));
      ws.on("close",   ()    => this._handleClientClose(ws));
      ws.on("error",   (err) => console.error("Market WS client error:", err.message));

      // Send current broker connection status
      this._sendStatus(ws);
      // Send last known ticks for any pre-existing symbols (none for new client)
    });

    console.log(`✅ MarketDataBroadcaster: WebSocket listening at ${path}`);
  }

  _handleClientMessage(ws, raw) {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.action === "tier" && msg.tier) {
        const t = String(msg.tier).toLowerCase();
        if (["free", "basic", "premium", "enterprise"].includes(t)) {
          this.clientTiers.set(ws, t);
          this._checkTierChange();
        }
      } else if (msg.action === "subscribe" && Array.isArray(msg.symbols)) {
        for (const sym of msg.symbols) {
          this._subscribeClientToSymbol(ws, sym.toUpperCase());
        }
      } else if (msg.action === "unsubscribe" && Array.isArray(msg.symbols)) {
        for (const sym of msg.symbols) {
          this._unsubscribeClientFromSymbol(ws, sym.toUpperCase());
        }
      } else if (msg.action === "ping") {
        this._send(ws, { type: "pong" });
      }
    } catch (err) {
      console.error("Market WS: invalid message:", err.message);
    }
  }

  _handleClientClose(ws) {
    const symbols = this.clients.get(ws) ?? new Set();
    for (const sym of symbols) {
      this._unsubscribeClientFromSymbol(ws, sym);
    }
    this.clients.delete(ws);
    this.clientTiers.delete(ws);
    this._checkTierChange();
    console.log("📡 Market WS: client disconnected");
  }

  _subscribeClientToSymbol(ws, symbol) {
    const clientSymbols = this.clients.get(ws);
    if (!clientSymbols || clientSymbols.has(symbol)) return;
    clientSymbols.add(symbol);

    // Send last cached tick immediately if available
    if (this.lastTick.has(symbol)) {
      this._send(ws, { type: "tick", symbol, data: this.lastTick.get(symbol) });
    }

    // Ensure broker subscription exists
    if (!this.symbolSubs.has(symbol)) {
      this._subscribeToBroker(symbol);
    }
    this.symbolSubs.get(symbol)?.clients.add(ws);
  }

  _unsubscribeClientFromSymbol(ws, symbol) {
    const clientSymbols = this.clients.get(ws);
    if (clientSymbols) clientSymbols.delete(symbol);

    const sub = this.symbolSubs.get(symbol);
    if (!sub) return;
    sub.clients.delete(ws);

    // If no more clients for this symbol, unsubscribe from broker
    if (sub.clients.size === 0) {
      sub.unsubFn?.();
      this.symbolSubs.delete(symbol);
    }
  }

  _subscribeToBroker(symbol) {
    const mapping = SYMBOL_BROKER_MAP[symbol];
    if (!mapping) {
      console.warn(`⚠️  No broker mapping for symbol: ${symbol}`);
      return;
    }

    const broker = BROKERS[mapping.broker];
    if (!broker) return;

    let unsubFn;
    const onTick = (tick) => this._broadcastTick(symbol, tick);

    if (mapping.broker === "upstox") {
      unsubFn = broker.subscribe(mapping.key, onTick);
    } else if (mapping.broker === "zerodha") {
      unsubFn = broker.subscribe(mapping.key, onTick, "full");
    } else if (mapping.broker === "angelone") {
      unsubFn = broker.subscribe(mapping.exchange, mapping.token, onTick, 3);
    }

    this.symbolSubs.set(symbol, {
      broker:  mapping.broker,
      clients: new Set(),
      unsubFn,
    });
  }

  _broadcastTick(symbol, rawTick) {
    // Normalize tick to a common format regardless of broker
    const normalized = this._normalizeTick(symbol, rawTick);
    this.lastTick.set(symbol, normalized);

    const sub = this.symbolSubs.get(symbol);
    if (!sub) return;

    const msg = JSON.stringify({ type: "tick", symbol, data: normalized });
    for (const clientWs of sub.clients) {
      if (clientWs.readyState === 1 /* OPEN */) {
        clientWs.send(msg);
      }
    }
  }

  _normalizeTick(symbol, tick) {
    // Handle Upstox format
    if (tick.instrumentKey !== undefined) {
      return {
        ltp:           tick.ltp,
        open:          tick.ohlc?.open  ?? 0,
        high:          tick.ohlc?.high  ?? 0,
        low:           tick.ohlc?.low   ?? 0,
        close:         tick.ohlc?.close ?? 0,
        previousClose: tick.previousClose ?? 0,
        change:        tick.change ?? 0,
        changePercent: tick.changePercent ?? 0,
        volume:        tick.volume ?? 0,
        avgPrice:      tick.avgPrice ?? 0,
        oi:            tick.oi ?? 0,
        timestamp:     tick.lastTradedTime ?? new Date(),
        broker:        "upstox",
      };
    }
    // Handle Zerodha format
    if (tick.instrumentToken !== undefined) {
      return {
        ltp:           tick.lastPrice,
        open:          tick.ohlc?.open  ?? 0,
        high:          tick.ohlc?.high  ?? 0,
        low:           tick.ohlc?.low   ?? 0,
        close:         tick.ohlc?.close ?? 0,
        previousClose: tick.ohlc?.close ?? 0,
        change:        tick.changeAbsolute ?? (tick.lastPrice - (tick.ohlc?.close ?? 0)),
        changePercent: tick.change        ?? 0,
        volume:        tick.volumeTraded  ?? 0,
        avgPrice:      tick.averageTradePrice ?? 0,
        depth:         tick.depth,
        timestamp:     new Date(),
        broker:        "zerodha",
      };
    }
    // Handle Angel One format
    if (tick.token !== undefined) {
      return {
        ltp:           tick.ltp,
        open:          tick.open  ?? 0,
        high:          tick.high  ?? 0,
        low:           tick.low   ?? 0,
        close:         tick.close ?? 0,
        previousClose: tick.close ?? 0,
        change:        tick.change        ?? 0,
        changePercent: tick.changePercent ?? 0,
        volume:        tick.volume        ?? 0,
        timestamp:     tick.timestamp ?? new Date(),
        broker:        "angelone",
      };
    }
    return tick; // pass-through if already normalized
  }

  _sendStatus(ws) {
    this._send(ws, {
      type: "status",
      brokers: {
        upstox:   upstoxService.isConnected(),
        zerodha:  zerodhaService.isConnected(),
        angelone: angelOneService.isConnected(),
      },
    });
  }

  _send(ws, data) {
    if (ws.readyState !== 1 /* OPEN */) return;
    ws.send(JSON.stringify(data));
  }

  /** Broadcast broker connection status change to all connected clients */
  broadcastBrokerStatus() {
    const msg = JSON.stringify({
      type: "status",
      brokers: {
        upstox:   upstoxService.isConnected(),
        zerodha:  zerodhaService.isConnected(),
        angelone: angelOneService.isConnected(),
      },
    });
    for (const ws of this.clients.keys()) {
      if (ws.readyState === 1) ws.send(msg);
    }
  }

  /**
   * Broadcast any message to ALL connected frontend clients.
   * Used by schedulers to push live index/market updates.
   * Message format examples:
   *   { type: "indices_update", country: "India", data: [...rows] }
   *   { type: "indices_update", country: "all",   data: [...rows] }
   */
  broadcastAll(message) {
    if (this.clients.size === 0) return;
    const raw = typeof message === "string" ? message : JSON.stringify(message);
    for (const ws of this.clients.keys()) {
      if (ws.readyState === 1) ws.send(raw);
    }
  }

  /** Get broadcaster diagnostics */
  getStatus() {
    return {
      connectedClients: this.clients.size,
      activeSymbols:    [...this.symbolSubs.keys()],
      brokers: {
        upstox:   { connected: upstoxService.isConnected()   },
        zerodha:  { connected: zerodhaService.isConnected()  },
        angelone: { connected: angelOneService.isConnected() },
      },
    };
  }
}

export default new MarketDataBroadcaster();
