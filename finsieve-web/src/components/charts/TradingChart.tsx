/**
 * TradingChart – full-featured candlestick chart using Lightweight Charts v4
 *
 * Features:
 *  - Candlestick + volume histogram
 *  - MA overlays (SMA 20/50/200, EMA 9/21)
 *  - RSI panel (separate pane)
 *  - MACD panel (separate pane)
 *  - Bollinger Bands overlay
 *  - Real-time tick updates via broadcaster WebSocket
 *  - Interval selector (1m, 5m, 15m, 30m, 1h, 1D, 1W)
 *  - Crosshair price tooltip
 *  - Dark / Light theme toggle
 *
 * Usage:
 *   <TradingChart symbol="NSE:RELIANCE" title="Reliance Industries" />
 */

import React, {
  useEffect, useRef, useCallback, useState,
} from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  UTCTimestamp,
  CrosshairMode,
  ColorType,
} from "lightweight-charts";
import {
  Candle, calcSMA, calcEMA, calcRSI, calcBB, calcMACD, buildVolumeData,
} from "./indicators";
import { useBrokerHistorical } from "../../hooks/useBrokerHistorical";
import { useMarketWebSocket  } from "../../hooks/useMarketWebSocket";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Interval = "1minute" | "5minute" | "15minute" | "30minute" | "60minute" | "day" | "week";
export type IndicatorKey = "sma20" | "sma50" | "sma200" | "ema9" | "ema21" | "bb" | "rsi" | "macd" | "volume";

interface Props {
  symbol:       string;          // e.g. "NSE:RELIANCE"
  title?:       string;
  initialInterval?: Interval;
  height?:      number;
  darkMode?:    boolean;
  showOrderPanel?: boolean;
  onPriceChange?: (ltp: number, change: number, changePercent: number) => void;
  className?:   string;
  style?:       React.CSSProperties;
}

// ─── Interval config ──────────────────────────────────────────────────────────

const INTERVALS: { label: string; value: Interval; days: number }[] = [
  { label: "1m",  value: "1minute",   days: 1   },
  { label: "5m",  value: "5minute",   days: 5   },
  { label: "15m", value: "15minute",  days: 10  },
  { label: "30m", value: "30minute",  days: 20  },
  { label: "1h",  value: "60minute",  days: 30  },
  { label: "1D",  value: "day",       days: 365 },
  { label: "1W",  value: "week",      days: 730 },
];

// ─── Theme ────────────────────────────────────────────────────────────────────

const darkTheme = {
  background:      { type: ColorType.Solid, color: "#131722" },
  textColor:       "#D9D9D9",
  gridColor:       "#2B2B43",
  borderColor:     "#2B2B43",
  upColor:         "#26a69a",
  downColor:       "#ef5350",
  wickUpColor:     "#26a69a",
  wickDownColor:   "#ef5350",
  crosshairColor:  "#9B9EA3",
} as const;

const lightTheme = {
  background:      { type: ColorType.Solid, color: "#ffffff" },
  textColor:       "#191919",
  gridColor:       "#f0f3fa",
  borderColor:     "#d1d4dc",
  upColor:         "#26a69a",
  downColor:       "#ef5350",
  wickUpColor:     "#26a69a",
  wickDownColor:   "#ef5350",
  crosshairColor:  "#758696",
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

const TradingChart: React.FC<Props> = ({
  symbol,
  title,
  initialInterval = "day",
  height = 500,
  darkMode = true,
  showOrderPanel = false,
  onPriceChange,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);

  // Series refs
  const candleSeriesRef  = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef  = useRef<ISeriesApi<"Histogram"> | null>(null);
  const rsiChartRef      = useRef<IChartApi | null>(null);
  const rsiSeriesRef     = useRef<ISeriesApi<"Line"> | null>(null);
  const macdChartRef     = useRef<IChartApi | null>(null);
  const macdLineRef      = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSignalRef    = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistRef      = useRef<ISeriesApi<"Histogram"> | null>(null);

  const indicatorSeriesRefs = useRef<Record<string, ISeriesApi<"Line"> | null>>({});
  const rsiContainerRef     = useRef<HTMLDivElement>(null);
  const macdContainerRef    = useRef<HTMLDivElement>(null);

  // State
  const [interval,   setInterval]   = useState<Interval>(initialInterval);
  const [indicators, setIndicators] = useState<Set<IndicatorKey>>(
    new Set(["volume", "sma20", "sma50"])
  );
  const [ltp,           setLtp]           = useState<number>(0);
  const [ltpChange,     setLtpChange]     = useState<number>(0);
  const [ltpChangePct,  setLtpChangePct]  = useState<number>(0);
  const [crosshairOHLC, setCrosshairOHLC] = useState<Candle | null>(null);
  const [dateRange, setDateRange] = useState<{ fromDate: string; toDate: string } | null>(null);

  const theme = darkMode ? darkTheme : lightTheme;

  // Compute date range in effect to avoid Date.now() during render (purity); defer setState
  useEffect(() => {
    const intervalCfg = INTERVALS.find(i => i.value === interval) ?? INTERVALS[5];
    const now = Date.now();
    const toDate = new Date(now).toISOString().split("T")[0];
    const fromDate = new Date(now - intervalCfg.days * 86400_000).toISOString().split("T")[0];
    queueMicrotask(() => setDateRange({ fromDate, toDate }));
  }, [interval]);

  // ─── Data fetch ──────────────────────────────────────────────────────────────
  const { candles, loading, error } = useBrokerHistorical({
    symbol,
    interval,
    fromDate: dateRange?.fromDate ?? "",
    toDate: dateRange?.toDate ?? "",
    enabled: !!dateRange,
  });

  // ─── Realtime tick ───────────────────────────────────────────────────────────
  const onTick = useCallback((tick: { ltp: number; change: number; changePercent: number;
    open: number; high: number; low: number; close: number; timestamp: string }) => {
    setLtp(tick.ltp);
    setLtpChange(tick.change);
    setLtpChangePct(tick.changePercent);
    onPriceChange?.(tick.ltp, tick.change, tick.changePercent);

    if (!candleSeriesRef.current || !candles.length) return;

    // Update (or append) the latest candle with the new LTP
    const nowSec = Math.floor(Date.now() / 1000) as UTCTimestamp;
    const last   = candles[candles.length - 1];

    // For intraday intervals update the current bar, else append a new point
    const barSeconds = interval === "day" ? 86400 : interval === "week" ? 604800 :
      parseInt(interval) * 60;
    const barStart   = Math.floor(nowSec / barSeconds) * barSeconds as UTCTimestamp;

    const updatedCandle: CandlestickData = {
      time:  barStart,
      open:  last.time === barStart ? last.open  : tick.ltp,
      high:  last.time === barStart ? Math.max(last.high,  tick.ltp) : tick.ltp,
      low:   last.time === barStart ? Math.min(last.low,   tick.ltp) : tick.ltp,
      close: tick.ltp,
    };
    candleSeriesRef.current.update(updatedCandle);
    volumeSeriesRef.current?.update({ time: barStart, value: 0 }); // live volume TBD
  }, [candles, interval, onPriceChange]);

  useMarketWebSocket({ symbol, onTick });

  // ─── Chart initialization ────────────────────────────────────────────────────

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    // Destroy existing
    chartRef.current?.remove();
    rsiChartRef.current?.remove();
    macdChartRef.current?.remove();

    const commonOptions = {
      layout:    { background: theme.background, textColor: theme.textColor },
      grid:      { vertLines: { color: theme.gridColor }, horzLines: { color: theme.gridColor } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: theme.crosshairColor }, horzLine: { color: theme.crosshairColor } },
      timeScale: { timeVisible: true, secondsVisible: interval !== "day" && interval !== "week", borderColor: theme.borderColor },
      rightPriceScale: { borderColor: theme.borderColor },
      handleScroll:  { vertTouchDrag: true },
      handleScale:   { axisPressedMouseMove: true },
    };

    // Main chart
    const chart = createChart(containerRef.current, {
      ...commonOptions,
      width:  containerRef.current.clientWidth,
      height: indicators.has("volume") ? height - 80 : height,
    });
    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor:         theme.upColor,
      downColor:       theme.downColor,
      wickUpColor:     theme.wickUpColor,
      wickDownColor:   theme.wickDownColor,
      borderUpColor:   theme.upColor,
      borderDownColor: theme.downColor,
    });
    candleSeriesRef.current = candleSeries;

    // Volume (as histogram on same pane but separate scale)
    if (indicators.has("volume")) {
      const volSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
        color: "rgba(38,166,154,0.4)",
      });
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
        borderVisible: false,
      });
      volumeSeriesRef.current = volSeries;
    }

    // MA overlays
    const maColors: Record<string, string> = {
      sma20:  "#FF9800", sma50: "#2196F3", sma200: "#9C27B0",
      ema9:   "#00BCD4", ema21: "#FF5722",
    };
    const maKeys = ["sma20", "sma50", "sma200", "ema9", "ema21"] as IndicatorKey[];
    for (const key of maKeys) {
      if (indicators.has(key)) {
        const series = chart.addLineSeries({
          color:           maColors[key],
          lineWidth:       1,
          priceLineVisible: false,
          lastValueVisible: true,
          title:           key.toUpperCase(),
        });
        indicatorSeriesRefs.current[key] = series;
      }
    }

    // BB overlay
    if (indicators.has("bb")) {
      indicatorSeriesRefs.current["bbUpper"]  = chart.addLineSeries({ color: "#607D8B", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      indicatorSeriesRefs.current["bbMiddle"] = chart.addLineSeries({ color: "#607D8B", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: "BB" });
      indicatorSeriesRefs.current["bbLower"]  = chart.addLineSeries({ color: "#607D8B", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
    }

    // Crosshair OHLC tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.has(candleSeries)) return;
      const data = param.seriesData.get(candleSeries) as CandlestickData | undefined;
      if (data) setCrosshairOHLC({ time: data.time as number, open: data.open, high: data.high, low: data.low, close: data.close, volume: 0 });
    });

    // RSI pane
    if (indicators.has("rsi") && rsiContainerRef.current) {
      const rsiChart = createChart(rsiContainerRef.current, {
        ...commonOptions,
        width:  rsiContainerRef.current.clientWidth,
        height: 120,
      });
      rsiChartRef.current = rsiChart;
      const rsiSeries = rsiChart.addLineSeries({ color: "#E91E63", lineWidth: 1, priceLineVisible: false, title: "RSI(14)" });
      rsiSeriesRef.current = rsiSeries;
      // Overbought/oversold lines
      rsiSeries.createPriceLine({ price: 70, color: "#ef5350", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "OB" });
      rsiSeries.createPriceLine({ price: 30, color: "#26a69a", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "OS" });
      // Sync time scale
      chart.timeScale().subscribeVisibleTimeRangeChange(range => {
        if (range) rsiChart.timeScale().setVisibleRange(range);
      });
    }

    // MACD pane
    if (indicators.has("macd") && macdContainerRef.current) {
      const macdChart = createChart(macdContainerRef.current, {
        ...commonOptions,
        width:  macdContainerRef.current.clientWidth,
        height: 100,
      });
      macdChartRef.current     = macdChart;
      macdLineRef.current      = macdChart.addLineSeries({ color: "#2196F3", lineWidth: 1, priceLineVisible: false, title: "MACD" });
      macdSignalRef.current    = macdChart.addLineSeries({ color: "#FF9800", lineWidth: 1, priceLineVisible: false, title: "Signal" });
      macdHistRef.current      = macdChart.addHistogramSeries({ priceLineVisible: false });
      chart.timeScale().subscribeVisibleTimeRangeChange(range => {
        if (range) macdChart.timeScale().setVisibleRange(range);
      });
    }

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.resize(containerRef.current.clientWidth, indicators.has("volume") ? height - 80 : height);
      if (rsiContainerRef.current && rsiChartRef.current)  rsiChartRef.current.resize(rsiContainerRef.current.clientWidth, 120);
      if (macdContainerRef.current && macdChartRef.current) macdChartRef.current.resize(macdContainerRef.current.clientWidth, 100);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [interval, height, indicators, theme]);

  // ─── Data loading ─────────────────────────────────────────────────────────────

  const loadData = useCallback(() => {
    if (!candles.length || !candleSeriesRef.current) return;

    // Set initial LTP from last candle
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    if (last) {
      setLtp(last.close);
      if (prev) {
        const chg    = last.close - prev.close;
        const chgPct = (chg / prev.close) * 100;
        setLtpChange(chg);
        setLtpChangePct(chgPct);
        onPriceChange?.(last.close, chg, chgPct);
      }
    }

    // Candlestick data
    candleSeriesRef.current.setData(
      candles.map(c => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close }))
    );

    // Volume
    if (volumeSeriesRef.current && indicators.has("volume")) {
      volumeSeriesRef.current.setData(buildVolumeData(candles) as HistogramData[]);
    }

    // MAs
    const refs = indicatorSeriesRefs.current;
    if (refs.sma20  && indicators.has("sma20"))  refs.sma20.setData( calcSMA(candles, 20)  as LineData[]);
    if (refs.sma50  && indicators.has("sma50"))  refs.sma50.setData( calcSMA(candles, 50)  as LineData[]);
    if (refs.sma200 && indicators.has("sma200")) refs.sma200.setData(calcSMA(candles, 200) as LineData[]);
    if (refs.ema9   && indicators.has("ema9"))   refs.ema9.setData(  calcEMA(candles, 9)   as LineData[]);
    if (refs.ema21  && indicators.has("ema21"))  refs.ema21.setData( calcEMA(candles, 21)  as LineData[]);

    // BB
    if (indicators.has("bb") && refs.bbUpper && refs.bbMiddle && refs.bbLower) {
      const bb = calcBB(candles);
      refs.bbUpper.setData( bb.map(p => ({ time: p.time as UTCTimestamp, value: p.upper  })));
      refs.bbMiddle.setData(bb.map(p => ({ time: p.time as UTCTimestamp, value: p.middle })));
      refs.bbLower.setData( bb.map(p => ({ time: p.time as UTCTimestamp, value: p.lower  })));
    }

    // RSI
    if (indicators.has("rsi") && rsiSeriesRef.current) {
      rsiSeriesRef.current.setData(calcRSI(candles) as LineData[]);
    }

    // MACD
    if (indicators.has("macd") && macdLineRef.current && macdSignalRef.current && macdHistRef.current) {
      const macd = calcMACD(candles);
      macdLineRef.current.setData(  macd.map(p => ({ time: p.time as UTCTimestamp, value: p.macd    })));
      macdSignalRef.current.setData(macd.map(p => ({ time: p.time as UTCTimestamp, value: p.signal  })));
      macdHistRef.current.setData(  macd.map(p => ({
        time:  p.time as UTCTimestamp, value: p.histogram,
        color: p.histogram >= 0 ? "rgba(38,166,154,0.7)" : "rgba(239,83,80,0.7)",
      })));
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles, indicators, onPriceChange]);

  // ─── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => { initChart(); }, [initChart]);
  useEffect(() => {
    queueMicrotask(() => loadData());
  }, [loadData]);

  // ─── Indicator toggle ────────────────────────────────────────────────────────

  const toggleIndicator = (key: IndicatorKey) => {
    setIndicators(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // ─── Format helpers ───────────────────────────────────────────────────────────

  const fmtPrice   = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtChange  = (v: number) => (v >= 0 ? "+" : "") + fmtPrice(v);
  const fmtPct     = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
  const changeColor = ltpChange >= 0 ? "#26a69a" : "#ef5350";

  // ─── Render ───────────────────────────────────────────────────────────────────

  const bg  = darkMode ? "#131722" : "#ffffff";
  const fg  = darkMode ? "#D9D9D9" : "#191919";
  const muted = darkMode ? "#758696" : "#999";
  const border = darkMode ? "#2B2B43" : "#e0e0e0";

  return (
    <div
      className={className}
      style={{ background: bg, color: fg, borderRadius: 8, overflow: "hidden", ...style }}
    >
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${border}`, gap: 16, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title ?? symbol}</span>
          {ltp > 0 && (
            <span style={{ marginLeft: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{fmtPrice(ltp)}</span>
              <span style={{ marginLeft: 8, color: changeColor, fontSize: 13 }}>
                {fmtChange(ltpChange)} ({fmtPct(ltpChangePct)})
              </span>
            </span>
          )}
        </div>

        {/* Crosshair OHLC */}
        {crosshairOHLC && (
          <div style={{ fontSize: 11, color: muted, display: "flex", gap: 8 }}>
            <span>O: {fmtPrice(crosshairOHLC.open)}</span>
            <span>H: {fmtPrice(crosshairOHLC.high)}</span>
            <span>L: {fmtPrice(crosshairOHLC.low)}</span>
            <span>C: {fmtPrice(crosshairOHLC.close)}</span>
          </div>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexWrap: "wrap" }}>
          {/* Interval buttons */}
          {INTERVALS.map(iv => (
            <button key={iv.value} onClick={() => setInterval(iv.value)}
              style={{
                padding:    "3px 8px", fontSize: 11, cursor: "pointer", borderRadius: 4,
                border:     "none",
                background: interval === iv.value ? (darkMode ? "#2962ff" : "#1565c0") : (darkMode ? "#2B2B43" : "#f0f3fa"),
                color:      interval === iv.value ? "#fff" : fg,
              }}>
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Indicator toggles ── */}
      <div style={{ display: "flex", gap: 6, padding: "6px 12px", flexWrap: "wrap" }}>
        {(["volume","sma20","sma50","sma200","ema9","ema21","bb","rsi","macd"] as IndicatorKey[]).map(key => (
          <button key={key} onClick={() => toggleIndicator(key)}
            style={{
              padding: "2px 8px", fontSize: 10, cursor: "pointer", borderRadius: 10,
              border:     `1px solid ${indicators.has(key) ? "#2962ff" : border}`,
              background: indicators.has(key) ? (darkMode ? "#1A1E2E" : "#E8EAF6") : "transparent",
              color:      indicators.has(key) ? "#2962ff" : muted,
            }}>
            {key.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Loading/Error ── */}
      {loading && <div style={{ textAlign: "center", padding: 20, color: muted }}>Loading chart data…</div>}
      {error   && <div style={{ textAlign: "center", padding: 20, color: "#ef5350" }}>{error}</div>}

      {/* ── Main chart ── */}
      <div ref={containerRef} style={{ width: "100%" }} />

      {/* ── RSI pane ── */}
      {indicators.has("rsi") && (
        <div style={{ borderTop: `1px solid ${border}` }}>
          <div style={{ padding: "2px 12px", fontSize: 10, color: muted }}>RSI (14)</div>
          <div ref={rsiContainerRef} style={{ width: "100%" }} />
        </div>
      )}

      {/* ── MACD pane ── */}
      {indicators.has("macd") && (
        <div style={{ borderTop: `1px solid ${border}` }}>
          <div style={{ padding: "2px 12px", fontSize: 10, color: muted }}>MACD (12,26,9)</div>
          <div ref={macdContainerRef} style={{ width: "100%" }} />
        </div>
      )}

      {/* ── Order Panel (Kite-style) ── */}
      {showOrderPanel && (
        <div style={{ borderTop: `1px solid ${border}`, padding: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <button style={{ background: "#26a69a", color: "#fff", border: "none", padding: "6px 20px", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}>
            BUY
          </button>
          <button style={{ background: "#ef5350", color: "#fff", border: "none", padding: "6px 20px", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}>
            SELL
          </button>
          <span style={{ fontSize: 12, color: muted }}>LTP: {fmtPrice(ltp)}</span>
        </div>
      )}
    </div>
  );
};

export default TradingChart;
