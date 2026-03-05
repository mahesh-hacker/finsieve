/**
 * useBrokerHistorical
 *
 * Fetches OHLCV candle data from the backend broker API.
 * Smart routing: tries Upstox → Zerodha → Angel One → Yahoo Finance fallback.
 *
 * Usage:
 *   const { candles, loading, error } = useBrokerHistorical({
 *     symbol: "NSE:RELIANCE",
 *     interval: "day",
 *     fromDate: "2024-01-01",
 *     toDate:   "2024-12-31",
 *   });
 */

import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";

export interface Candle {
  time:   number; // Unix seconds (UTC)
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
}

// Symbol → Upstox instrument_key mapping (expand as needed)
const UPSTOX_KEY_MAP: Record<string, string> = {
  "NSE:RELIANCE":   "NSE_EQ|INE002A01018",
  "NSE:TCS":        "NSE_EQ|INE467B01029",
  "NSE:HDFCBANK":   "NSE_EQ|INE040A01034",
  "NSE:INFY":       "NSE_EQ|INE009A01021",
  "NSE:ICICIBANK":  "NSE_EQ|INE090A01021",
  "NSE:WIPRO":      "NSE_EQ|INE075A01022",
  "NSE:LT":         "NSE_EQ|INE018A01030",
  "NSE:BAJFINANCE": "NSE_EQ|INE296A01024",
  "NSE:SBIN":       "NSE_EQ|INE062A01020",
  "NSE:NIFTY50":    "NSE_INDEX|Nifty 50",
  "NSE:BANKNIFTY":  "NSE_INDEX|Nifty Bank",
  "MCX:GOLD":       "MCX_FO|MCX:GOLD25APRFUT",
  "MCX:SILVER":     "MCX_FO|MCX:SILVER25MAYFUT",
  "MCX:CRUDE":      "MCX_FO|MCX:CRUDEOIL25APRFUT",
};

// Symbol → Zerodha instrument token
const ZERODHA_TOKEN_MAP: Record<string, number> = {
  "NSE:RELIANCE":   738561,
  "NSE:TCS":        2953217,
  "NSE:HDFCBANK":   341249,
  "NSE:INFY":       408065,
  "NSE:ICICIBANK":  1270529,
  "NSE:SBIN":       779521,
  "NSE:NIFTY50":    256265,
  "NSE:BANKNIFTY":  260105,
  "MCX:GOLD":       58424833,
  "MCX:SILVER":     58498305,
  "MCX:CRUDE":      57862407,
  "BSE:SENSEX":     265,
};

// Symbol → Angel One token
const ANGEL_TOKEN_MAP: Record<string, string> = {
  "NSE:RELIANCE":  "2885",
  "NSE:TCS":       "11536",
  "NSE:HDFCBANK":  "1333",
  "NSE:INFY":      "1594",
  "NSE:ICICIBANK": "4963",
  "NSE:SBIN":      "3045",
};

export type Interval = "1minute" | "5minute" | "15minute" | "30minute" | "60minute" | "day" | "week";

interface Options {
  symbol:   string;
  interval: Interval;
  fromDate: string; // "YYYY-MM-DD"
  toDate:   string;
  enabled?: boolean;
}

interface Result {
  candles: Candle[];
  loading: boolean;
  error:   string | null;
  source:  string | null;
}

// Angel One interval mapping
const ANGEL_INTERVAL: Record<Interval, string> = {
  "1minute":  "ONE_MINUTE",
  "5minute":  "FIVE_MINUTE",
  "15minute": "FIFTEEN_MINUTE",
  "30minute": "THIRTY_MINUTE",
  "60minute": "ONE_HOUR",
  "day":      "ONE_DAY",
  "week":     "ONE_DAY", // fallback
};

// Zerodha interval mapping
const ZERODHA_INTERVAL: Record<Interval, string> = {
  "1minute":  "minute",
  "5minute":  "5minute",
  "15minute": "15minute",
  "30minute": "30minute",
  "60minute": "60minute",
  "day":      "day",
  "week":     "week",
};

export function useBrokerHistorical({ symbol, interval, fromDate, toDate, enabled = true }: Options): Result {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [source,  setSource]  = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !symbol || !fromDate || !toDate) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    const sym = symbol.toUpperCase();

    fetchWithFallback(sym, interval, fromDate, toDate, ctrl.signal)
      .then(({ candles: data, source: src }) => {
        if (!ctrl.signal.aborted) {
          setCandles(data);
          setSource(src);
        }
      })
      .catch(e => {
        if (!ctrl.signal.aborted) setError(e.message ?? "Failed to load chart data");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [symbol, interval, fromDate, toDate, enabled]);

  return { candles, loading, error, source };
}

async function fetchWithFallback(
  symbol: string, interval: Interval, fromDate: string, toDate: string, signal: AbortSignal
): Promise<{ candles: Candle[]; source: string }> {

  // ── 1. Try Upstox ──────────────────────────────────────────────────────────
  const upstoxKey = UPSTOX_KEY_MAP[symbol];
  if (upstoxKey) {
    try {
      const isIntraday = ["1minute","5minute","15minute","30minute","60minute"].includes(interval);
      const endpoint   = isIntraday
        ? `${API_BASE}/broker/upstox/intraday?instrument_key=${encodeURIComponent(upstoxKey)}&interval=${interval}`
        : `${API_BASE}/broker/upstox/historical?instrument_key=${encodeURIComponent(upstoxKey)}&interval=${interval}&from=${fromDate}&to=${toDate}`;

      const res = await axios.get(endpoint, { signal, timeout: 10_000 });
      if (res.data.success && res.data.data?.length) {
        return { candles: res.data.data, source: "upstox" };
      }
    } catch (e: unknown) {
      if ((e as Error).name === "CanceledError") throw e;
      console.warn("Upstox historical failed:", (e as Error).message);
    }
  }

  // ── 2. Try Zerodha ─────────────────────────────────────────────────────────
  const zerodhaToken = ZERODHA_TOKEN_MAP[symbol];
  if (zerodhaToken) {
    try {
      const res = await axios.get(
        `${API_BASE}/broker/zerodha/historical?token=${zerodhaToken}&interval=${ZERODHA_INTERVAL[interval]}&from=${fromDate}&to=${toDate}`,
        { signal, timeout: 10_000 }
      );
      if (res.data.success && res.data.data?.length) {
        return { candles: res.data.data, source: "zerodha" };
      }
    } catch (e: unknown) {
      if ((e as Error).name === "CanceledError") throw e;
      console.warn("Zerodha historical failed:", (e as Error).message);
    }
  }

  // ── 3. Try Angel One ───────────────────────────────────────────────────────
  const [exchange] = symbol.split(":");
  const angelToken = ANGEL_TOKEN_MAP[symbol];
  if (angelToken) {
    try {
      const from = `${fromDate} 09:00`;
      const to   = `${toDate} 15:30`;
      const res  = await axios.get(
        `${API_BASE}/broker/angelone/historical?exchange=${exchange}&token=${angelToken}&interval=${ANGEL_INTERVAL[interval]}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { signal, timeout: 10_000 }
      );
      if (res.data.success && res.data.data?.length) {
        return { candles: res.data.data, source: "angelone" };
      }
    } catch (e: unknown) {
      if ((e as Error).name === "CanceledError") throw e;
      console.warn("Angel One historical failed:", (e as Error).message);
    }
  }

  // ── 4. Fallback: Yahoo Finance via backend ─────────────────────────────────
  try {
    const yahooSym = toYahooSymbol(symbol);
    const res = await axios.get(
      `${API_BASE}/market/historical?symbol=${yahooSym}&interval=${toYahooInterval(interval)}&from=${fromDate}&to=${toDate}`,
      { signal, timeout: 15_000 }
    );
    if (res.data.success && res.data.data?.length) {
      return { candles: res.data.data, source: "yahoo" };
    }
  } catch (e: unknown) {
    if ((e as Error).name === "CanceledError") throw e;
    console.warn("Yahoo Finance fallback failed:", (e as Error).message);
  }

  throw new Error(`No data source available for ${symbol}`);
}

function toYahooSymbol(symbol: string): string {
  const map: Record<string, string> = {
    "NSE:RELIANCE":  "RELIANCE.NS",
    "NSE:TCS":       "TCS.NS",
    "NSE:HDFCBANK":  "HDFCBANK.NS",
    "NSE:INFY":      "INFY.NS",
    "NSE:ICICIBANK": "ICICIBANK.NS",
    "NSE:SBIN":      "SBIN.NS",
    "NSE:NIFTY50":   "^NSEI",
    "NSE:BANKNIFTY": "^NSEBANK",
    "BSE:SENSEX":    "^BSESN",
    "MCX:GOLD":      "GC=F",
    "MCX:SILVER":    "SI=F",
    "MCX:CRUDE":     "CL=F",
  };
  return map[symbol] ?? symbol.replace("NSE:", "") + ".NS";
}

function toYahooInterval(interval: Interval): string {
  const map: Record<Interval, string> = {
    "1minute": "1m", "5minute": "5m", "15minute": "15m", "30minute": "30m",
    "60minute": "1h", "day": "1d", "week": "1wk",
  };
  return map[interval];
}
