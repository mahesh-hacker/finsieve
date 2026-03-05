/**
 * MultiChartDashboard
 *
 * Groww/Kite-inspired multi-chart layout with:
 *  - 1 / 2 / 4 chart grid layouts
 *  - Live price tickers for each symbol
 *  - Symbol search per chart slot
 *  - Global indices ticker bar (Nifty, Sensex, Dow, Nasdaq, Gold, Crude)
 *  - Dark / Light mode
 *  - Market status indicator
 *
 * Usage:
 *   <MultiChartDashboard darkMode />
 */

import React, { useState, useCallback } from "react";
import TradingChart, { type Interval } from "./TradingChart";
import SymbolSearch, { type Instrument } from "./SymbolSearch";
import { useMultiMarketWebSocket } from "../../hooks/useMarketWebSocket";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartSlot {
  id:        number;
  symbol:    string;
  title:     string;
  interval:  Interval;
  ltp?:      number;
  change?:   number;
  changePct?: number;
}

type LayoutMode = 1 | 2 | 4;

const INITIAL_SYMBOLS: ChartSlot[] = [
  { id: 1, symbol: "NSE:NIFTY50",   title: "Nifty 50",         interval: "day" },
  { id: 2, symbol: "NSE:RELIANCE",  title: "Reliance",         interval: "day" },
  { id: 3, symbol: "MCX:GOLD",      title: "Gold",             interval: "day" },
  { id: 4, symbol: "NSE:BANKNIFTY", title: "Bank Nifty",       interval: "day" },
];

const GLOBAL_INDICES = [
  { symbol: "NSE:NIFTY50",   label: "Nifty 50" },
  { symbol: "BSE:SENSEX",    label: "Sensex" },
  { symbol: "MCX:GOLD",      label: "Gold" },
  { symbol: "MCX:CRUDE",     label: "Crude Oil" },
  { symbol: "GLOBAL:^DJI",   label: "Dow Jones" },
  { symbol: "GLOBAL:^IXIC",  label: "Nasdaq" },
  { symbol: "GLOBAL:^GSPC",  label: "S&P 500" },
];

// ─── IndicesTicker ────────────────────────────────────────────────────────────
const IndicesTicker: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const [prices, setPrices] = useState<Record<string, { ltp: number; changePct: number }>>({});

  const symbols = GLOBAL_INDICES.map(i => i.symbol);

  useMultiMarketWebSocket(symbols, (sym, tick) => {
    setPrices(prev => ({
      ...prev,
      [sym]: { ltp: tick.ltp, changePct: tick.changePercent },
    }));
  });

  const bg     = darkMode ? "#0f1523" : "#1565c0";
  const muted  = darkMode ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.7)";

  return (
    <div style={{
      background:  bg,
      overflowX:   "auto",
      whiteSpace:  "nowrap",
      padding:     "6px 12px",
      display:     "flex",
      gap:         24,
      alignItems:  "center",
      fontSize:    12,
    }}>
      {GLOBAL_INDICES.map(({ symbol, label }) => {
        const data  = prices[symbol];
        const color = !data ? "#888" : data.changePct >= 0 ? "#26a69a" : "#ef5350";
        return (
          <span key={symbol} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: muted }}>{label}</span>
            <span style={{ color: "#fff", fontWeight: 700 }}>
              {data ? data.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
            </span>
            <span style={{ color }}>
              {data ? `${data.changePct >= 0 ? "+" : ""}${data.changePct.toFixed(2)}%` : ""}
            </span>
          </span>
        );
      })}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  darkMode?: boolean;
  showOrderPanel?: boolean;
}

const MultiChartDashboard: React.FC<Props> = ({ darkMode = true, showOrderPanel = false }) => {
  const [layout,  setLayout]  = useState<LayoutMode>(2);
  const [slots,   setSlots]   = useState<ChartSlot[]>(INITIAL_SYMBOLS);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  // Track per-slot LTP
  const handlePriceChange = useCallback((slotId: number, ltp: number, change: number, changePct: number) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, ltp, change, changePct } : s));
  }, []);

  const handleSymbolSelect = useCallback((slotId: number, inst: Instrument) => {
    setSlots(prev => prev.map(s => s.id === slotId
      ? { ...s, symbol: inst.symbol, title: inst.name.length > 22 ? inst.symbol.split(":")[1] : inst.name, ltp: undefined, change: undefined, changePct: undefined }
      : s
    ));
    setActiveSlot(null);
  }, []);

  const visibleSlots = slots.slice(0, layout);

  // Styles
  const bg     = darkMode ? "#0d1117" : "#f4f5f7";
  const card   = darkMode ? "#131722" : "#ffffff";
  const border = darkMode ? "#2b2f3e" : "#e0e0e0";
  const fg     = darkMode ? "#d1d4dc" : "#191919";
  const muted  = darkMode ? "#758696" : "#888";

  const layoutBtn = (l: LayoutMode, label: string) => (
    <button
      key={l}
      onClick={() => setLayout(l)}
      title={`${l === 1 ? "Single" : l === 2 ? "Side-by-Side" : "Quad"} view`}
      style={{
        padding: "4px 10px", border: "none", cursor: "pointer", borderRadius: 4, fontSize: 12,
        background: layout === l ? (darkMode ? "#2962ff" : "#1565c0") : (darkMode ? "#2b2f3e" : "#e8eaf6"),
        color:      layout === l ? "#fff" : fg,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ background: bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Indices ticker bar ── */}
      <IndicesTicker darkMode={darkMode} />

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", borderBottom: `1px solid ${border}`, gap: 8 }}>
        <span style={{ fontWeight: 700, color: fg, fontSize: 15, marginRight: 8 }}>
          Finsieve Charts
        </span>
        <span style={{ color: muted, fontSize: 12 }}>Multi-asset · Live</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {layoutBtn(1, "⬜ 1")}
          {layoutBtn(2, "◫ 2")}
          {layoutBtn(4, "⊞ 4")}
        </div>
      </div>

      {/* ── Chart grid ── */}
      <div style={{
        display:  "grid",
        gridTemplateColumns: layout === 1 ? "1fr" : layout === 2 ? "1fr 1fr" : "1fr 1fr",
        gridTemplateRows:    layout <= 2   ? "1fr"              : "1fr 1fr",
        gap:      8,
        padding:  8,
        flex:     1,
      }}>
        {visibleSlots.map(slot => (
          <div key={slot.id} style={{
            border:       `1px solid ${border}`,
            borderRadius: 6,
            overflow:     "hidden",
            display:      "flex",
            flexDirection: "column",
            minWidth:     0,
          }}>
            {/* Slot header with symbol search toggle */}
            <div style={{ display: "flex", alignItems: "center", padding: "4px 8px", background: card, borderBottom: `1px solid ${border}`, gap: 8 }}>
              {activeSlot === slot.id ? (
                <>
                  <div style={{ flex: 1 }}>
                    <SymbolSearch
                      darkMode={darkMode}
                      onSelect={inst => handleSymbolSelect(slot.id, inst)}
                      placeholder="Search symbol…"
                      showRecent
                    />
                  </div>
                  <button onClick={() => setActiveSlot(null)} style={{ background: "none", border: "none", color: muted, cursor: "pointer", fontSize: 16 }}>✕</button>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 600, fontSize: 13, color: fg, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {slot.title}
                  </span>
                  {slot.ltp !== undefined && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: (slot.change ?? 0) >= 0 ? "#26a69a" : "#ef5350" }}>
                      {slot.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 400 }}>
                        {((slot.change ?? 0) >= 0 ? "+" : "")}{(slot.changePct ?? 0).toFixed(2)}%
                      </span>
                    </span>
                  )}
                  {/* Interval selector per slot */}
                  <select
                    value={slot.interval}
                    onChange={e => setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, interval: e.target.value as Interval } : s))}
                    style={{ fontSize: 11, background: darkMode ? "#2b2f3e" : "#f0f3fa", color: fg, border: "none", borderRadius: 3, padding: "2px 4px", cursor: "pointer" }}
                  >
                    <option value="1minute">1m</option>
                    <option value="5minute">5m</option>
                    <option value="15minute">15m</option>
                    <option value="30minute">30m</option>
                    <option value="60minute">1h</option>
                    <option value="day">1D</option>
                    <option value="week">1W</option>
                  </select>
                  <button
                    onClick={() => setActiveSlot(slot.id)}
                    title="Change symbol"
                    style={{ background: "none", border: "none", color: muted, cursor: "pointer", fontSize: 14, padding: "0 4px" }}
                  >
                    🔍
                  </button>
                </>
              )}
            </div>

            {/* Chart */}
            <TradingChart
              symbol={slot.symbol}
              title={slot.title}
              initialInterval={slot.interval}
              darkMode={darkMode}
              height={layout === 1 ? 520 : layout === 2 ? 460 : 320}
              showOrderPanel={showOrderPanel}
              onPriceChange={(ltp, change, changePct) => handlePriceChange(slot.id, ltp, change, changePct)}
              style={{ flex: 1 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiChartDashboard;
