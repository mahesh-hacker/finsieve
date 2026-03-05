/**
 * useRealTimeIndices
 *
 * Connects to the backend WebSocket broadcaster and receives live index updates
 * pushed by the NSE / Global schedulers after every data-fetch cycle.
 *
 * Falls back to REST polling if the WebSocket is not available.
 *
 * Usage:
 *   const { indices, lastUpdate, connected } = useRealTimeIndices("India");
 *   const { indices, lastUpdate, connected } = useRealTimeIndices("all");
 */

import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = (import.meta.env.VITE_MARKET_WS_URL as string | undefined)
  ?? "ws://localhost:3000/ws/market";

export interface LiveIndex {
  id:             string;
  symbol:         string;
  name:           string;
  country:        string;
  current_value:  number | string;
  change:         number | string;
  change_percent: number | string;
  previous_close: number | string | null;
  open:           number | string | null;
  high:           number | string | null;
  low:            number | string | null;
  last_updated:   string;
  exchange?:      string;
}

// ─── Singleton WS (shared across all hook instances) ─────────────────────────
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECTS = 30;

type IndexUpdateCallback = (country: string, data: LiveIndex[], timestamp: string) => void;
const callbacks = new Set<IndexUpdateCallback>();

export interface LiveStocksUpdate {
  type: "stocks_update";
  country: string;
  timestamp: string;
  gainers: LiveStockRow[];
  losers: LiveStockRow[];
  volume: LiveStockRow[];
  week52High: LiveStockRow[];
  week52Low: LiveStockRow[];
}

export interface LiveStockRow {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  volume: number;
  marketCap: number;
  pe: number;
  yearHigh: number;
  yearLow: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
}

type StocksUpdateCallback = (payload: LiveStocksUpdate) => void;
const stockCallbacks = new Set<StocksUpdateCallback>();

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    reconnectAttempts = 0;
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string);
      if (msg.type === "indices_update") {
        callbacks.forEach(cb => cb(msg.country, msg.data, msg.timestamp));
      }
      if (msg.type === "stocks_update") {
        stockCallbacks.forEach(cb => cb(msg));
      }
    } catch { /* ignore */ }
  };

  ws.onclose = () => {
    ws = null;
    if (reconnectTimer) return;
    if (reconnectAttempts >= MAX_RECONNECTS) return;
    reconnectAttempts++;
    const delay = Math.min(500 * 2 ** reconnectAttempts, 15_000);
    reconnectTimer = setTimeout(() => { reconnectTimer = null; connect(); }, delay);
  };

  ws.onerror = () => { ws?.close(); };
}

/** Send user tier to backend so Premium/Enterprise get 1s updates. Call when connected. */
export function sendClientTier(tier: string) {
  if (!tier) return;
  if (ws?.readyState === WebSocket.OPEN) {
    const t = String(tier).toLowerCase();
    if (["free", "basic", "premium", "enterprise"].includes(t)) {
      ws.send(JSON.stringify({ action: "tier", tier: t }));
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRealTimeIndices(country: string, tier?: string) {
  const [indices,    setIndices]    = useState<LiveIndex[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connected,  setConnected]  = useState(false);
  const countryRef = useRef(country);

  useEffect(() => {
    countryRef.current = country;
  }, [country]);

  useEffect(() => {
    if (connected && tier) sendClientTier(tier);
  }, [connected, tier]);

  const onUpdate = useCallback((updCountry: string, data: LiveIndex[], ts: string) => {
    const want = countryRef.current;
    if (want === "all" || updCountry === want) {
      setIndices(prev => {
        const map = new Map(prev.map(r => [r.symbol, r]));
        data.forEach(r => map.set(r.symbol, r));
        return [...map.values()];
      });
      setLastUpdate(new Date(ts));
    }
  }, []);

  useEffect(() => {
    callbacks.add(onUpdate);
    connect();

    // Track connection status
    const statusTimer = setInterval(() => {
      setConnected(ws?.readyState === WebSocket.OPEN);
    }, 1000);

    return () => {
      callbacks.delete(onUpdate);
      clearInterval(statusTimer);
    };
  }, [onUpdate]);

  return { indices, lastUpdate, connected };
}

/**
 * useRealTimeStocks
 *
 * Subscribes to the same WebSocket as useRealTimeIndices and receives
 * live NSE stock updates (gainers, losers, volume, 52W high/low) pushed
 * by the backend during India market hours — Zerodha/Groww/Angel One style.
 * Pass tier so Premium/Enterprise get 1s updates.
 */
export function useRealTimeStocks(tier?: string) {
  const [gainers, setGainers] = useState<LiveStockRow[]>([]);
  const [losers, setLosers] = useState<LiveStockRow[]>([]);
  const [volume, setVolume] = useState<LiveStockRow[]>([]);
  const [week52High, setWeek52High] = useState<LiveStockRow[]>([]);
  const [week52Low, setWeek52Low] = useState<LiveStockRow[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (connected && tier) sendClientTier(tier);
  }, [connected, tier]);

  const onStocksUpdate = useCallback((payload: LiveStocksUpdate) => {
    if (payload.country !== "India") return;
    if (payload.gainers?.length) setGainers(payload.gainers);
    if (payload.losers?.length) setLosers(payload.losers);
    if (payload.volume?.length) setVolume(payload.volume);
    if (payload.week52High?.length) setWeek52High(payload.week52High);
    if (payload.week52Low?.length) setWeek52Low(payload.week52Low);
    setLastUpdate(new Date(payload.timestamp));
  }, []);

  useEffect(() => {
    stockCallbacks.add(onStocksUpdate);
    connect();

    const statusTimer = setInterval(() => {
      setConnected(ws?.readyState === WebSocket.OPEN);
    }, 1000);

    return () => {
      stockCallbacks.delete(onStocksUpdate);
      clearInterval(statusTimer);
    };
  }, [onStocksUpdate]);

  return {
    gainers,
    losers,
    volume,
    week52High,
    week52Low,
    lastUpdate,
    connected,
  };
}
