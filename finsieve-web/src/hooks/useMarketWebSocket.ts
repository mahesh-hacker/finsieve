/**
 * useMarketWebSocket
 *
 * Connects to the backend market data broadcaster at ws://localhost:3000/ws/market
 * (same port as the Express server – both share one HTTP server).
 *
 * Features:
 *  - Auto-reconnect with exponential back-off
 *  - Subscribe / unsubscribe symbols dynamically
 *  - Single shared WebSocket instance (via module-level singleton)
 *  - Provides broker connection status
 *
 * Usage:
 *   const { isConnected, brokerStatus } = useMarketWebSocket({
 *     symbol: "NSE:RELIANCE",
 *     onTick: (tick) => console.log(tick.ltp),
 *   });
 */

import { useEffect, useRef, useCallback } from "react";

const WS_URL = import.meta.env.VITE_MARKET_WS_URL ?? "ws://localhost:3000/ws/market";

// ─── Tick type ────────────────────────────────────────────────────────────────
export interface MarketTick {
  ltp:           number;
  open:          number;
  high:          number;
  low:           number;
  close:         number;
  previousClose: number;
  change:        number;
  changePercent: number;
  volume:        number;
  avgPrice?:     number;
  oi?:           number;
  depth?:        { buy: DepthLevel[]; sell: DepthLevel[] };
  timestamp:     string;
  broker:        "upstox" | "zerodha" | "angelone";
}

export interface DepthLevel { price: number; quantity: number; orders: number; }

export interface BrokerStatus { upstox: boolean; zerodha: boolean; angelone: boolean; }

// ─── Singleton WebSocket manager ──────────────────────────────────────────────
// All hook instances share one WebSocket connection

type TickCallback    = (tick: MarketTick) => void;
type StatusCallback  = (status: BrokerStatus) => void;

interface TickSub { callbacks: Set<TickCallback>; count: number; }

let ws:                WebSocket | null    = null;
let reconnectTimer:    ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts  = 0;
const MAX_RECONNECTS   = 20;

const tickSubs:   Map<string, TickSub>    = new Map();
const statusSubs: Set<StatusCallback>     = new Set();

let pendingSubscriptions: string[] = []; // symbols to subscribe on next open

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    reconnectAttempts = 0;
    console.log("✅ Market WS connected");

    // Re-subscribe all active symbols
    const symbols = [...tickSubs.keys()];
    if (symbols.length > 0) {
      ws!.send(JSON.stringify({ action: "subscribe", symbols }));
    }
    if (pendingSubscriptions.length > 0) {
      ws!.send(JSON.stringify({ action: "subscribe", symbols: pendingSubscriptions }));
      pendingSubscriptions = [];
    }
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === "tick") {
        const sub = tickSubs.get(msg.symbol);
        if (sub) sub.callbacks.forEach(cb => cb(msg.data as MarketTick));
        return;
      }

      if (msg.type === "status") {
        statusSubs.forEach(cb => cb(msg.brokers as BrokerStatus));
        return;
      }
    } catch { /* ignore malformed messages */ }
  };

  ws.onclose = () => {
    ws = null;
    scheduleReconnect();
  };

  ws.onerror = () => {
    ws?.close();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  if (reconnectAttempts >= MAX_RECONNECTS) {
    console.warn("Market WS: max reconnect attempts reached");
    return;
  }
  reconnectAttempts++;
  const delay = Math.min(500 * 2 ** reconnectAttempts, 30_000);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

function subscribeSymbol(symbol: string, cb: TickCallback) {
  if (!tickSubs.has(symbol)) {
    tickSubs.set(symbol, { callbacks: new Set(), count: 0 });
  }
  const sub = tickSubs.get(symbol)!;
  sub.callbacks.add(cb);
  sub.count++;

  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: "subscribe", symbols: [symbol] }));
  } else {
    pendingSubscriptions.push(symbol);
    connect();
  }
}

function unsubscribeSymbol(symbol: string, cb: TickCallback) {
  const sub = tickSubs.get(symbol);
  if (!sub) return;
  sub.callbacks.delete(cb);
  sub.count--;
  if (sub.count <= 0) {
    tickSubs.delete(symbol);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "unsubscribe", symbols: [symbol] }));
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
interface UseMarketWSOptions {
  symbol?:  string;
  onTick?:  TickCallback;
  onStatus?: StatusCallback;
}

export function useMarketWebSocket({ symbol, onTick, onStatus }: UseMarketWSOptions = {}) {
  const onTickRef   = useRef(onTick);
  const onStatusRef = useRef(onStatus);

  useEffect(() => {
    onTickRef.current   = onTick;
    onStatusRef.current = onStatus;
  }, [onTick, onStatus]);

  // Stable callbacks that always call the latest ref
  const stableTickCb = useCallback((tick: MarketTick) => {
    onTickRef.current?.(tick);
  }, []);

  const stableStatusCb = useCallback((status: BrokerStatus) => {
    onStatusRef.current?.(status);
  }, []);

  useEffect(() => {
    if (!symbol || !onTick) return;
    subscribeSymbol(symbol.toUpperCase(), stableTickCb);
    return () => unsubscribeSymbol(symbol.toUpperCase(), stableTickCb);
    // onTick intentionally omitted: we use ref to avoid re-subscribing on every callback identity change
  }, [symbol, stableTickCb]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!onStatus) return;
    statusSubs.add(stableStatusCb);
    return () => { statusSubs.delete(stableStatusCb); };
  }, [stableStatusCb, onStatus]);

  // Ensure connection is open
  useEffect(() => { connect(); }, []);

  return {
    isConnected: ws?.readyState === WebSocket.OPEN,
    send: (data: object) => ws?.readyState === WebSocket.OPEN && ws.send(JSON.stringify(data)),
  };
}

/** Subscribe to multiple symbols at once (for dashboards) */
export function useMultiMarketWebSocket(symbols: string[], onTick: (symbol: string, tick: MarketTick) => void) {
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!symbols.length) return;
    const cbs = symbols.map(sym => {
      const cb = (tick: MarketTick) => onTickRef.current(sym, tick);
      subscribeSymbol(sym.toUpperCase(), cb);
      return { sym, cb };
    });
    connect();
    return () => { cbs.forEach(({ sym, cb }) => unsubscribeSymbol(sym.toUpperCase(), cb)); };
  }, [symbols.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
}
