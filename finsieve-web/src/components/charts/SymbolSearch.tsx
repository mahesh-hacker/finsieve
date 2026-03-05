/**
 * SymbolSearch
 *
 * Searchable instrument picker that queries the Upstox instrument search API
 * with a local curated list as instant fallback.
 *
 * Shows:  Symbol | Company Name | Exchange | Instrument Type
 *
 * Usage:
 *   <SymbolSearch onSelect={(sym) => setActiveSymbol(sym)} darkMode />
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";

// ─── Curated quick-access instruments ────────────────────────────────────────
const QUICK_SYMBOLS: Instrument[] = [
  // NSE Equity
  { symbol: "NSE:RELIANCE",   name: "Reliance Industries",         exchange: "NSE", type: "EQ",    segment: "NSE Equity" },
  { symbol: "NSE:TCS",        name: "Tata Consultancy Services",   exchange: "NSE", type: "EQ",    segment: "NSE Equity" },
  { symbol: "NSE:HDFCBANK",   name: "HDFC Bank",                   exchange: "NSE", type: "EQ",    segment: "NSE Equity" },
  { symbol: "NSE:INFY",       name: "Infosys",                     exchange: "NSE", type: "EQ",    segment: "NSE Equity" },
  { symbol: "NSE:ICICIBANK",  name: "ICICI Bank",                  exchange: "NSE", type: "EQ",    segment: "NSE Equity" },
  { symbol: "NSE:SBIN",       name: "State Bank of India",         exchange: "NSE", type: "EQ",    segment: "NSE Equity" },
  { symbol: "NSE:WIPRO",      name: "Wipro",                       exchange: "NSE", type: "EQ",    segment: "NSE Equity" },
  { symbol: "NSE:LT",         name: "Larsen & Toubro",             exchange: "NSE", type: "EQ",    segment: "NSE Equity" },
  { symbol: "NSE:BAJFINANCE", name: "Bajaj Finance",               exchange: "NSE", type: "EQ",    segment: "NSE Equity" },
  { symbol: "NSE:HINDUNILVR", name: "Hindustan Unilever",          exchange: "NSE", type: "EQ",    segment: "NSE Equity" },
  { symbol: "NSE:MARUTI",     name: "Maruti Suzuki",               exchange: "NSE", type: "EQ",    segment: "NSE Equity" },
  { symbol: "NSE:TITAN",      name: "Titan Company",               exchange: "NSE", type: "EQ",    segment: "NSE Equity" },
  // NSE Indices
  { symbol: "NSE:NIFTY50",    name: "Nifty 50",                    exchange: "NSE", type: "INDEX", segment: "NSE Index"   },
  { symbol: "NSE:BANKNIFTY",  name: "Nifty Bank",                  exchange: "NSE", type: "INDEX", segment: "NSE Index"   },
  { symbol: "NSE:NIFTYIT",    name: "Nifty IT",                    exchange: "NSE", type: "INDEX", segment: "NSE Index"   },
  // BSE
  { symbol: "BSE:SENSEX",     name: "BSE Sensex",                  exchange: "BSE", type: "INDEX", segment: "BSE Index"   },
  // MCX Commodities
  { symbol: "MCX:GOLD",       name: "Gold Futures (Active)",       exchange: "MCX", type: "FUT",   segment: "MCX Commodities" },
  { symbol: "MCX:SILVER",     name: "Silver Futures (Active)",     exchange: "MCX", type: "FUT",   segment: "MCX Commodities" },
  { symbol: "MCX:CRUDE",      name: "Crude Oil Futures (Active)",  exchange: "MCX", type: "FUT",   segment: "MCX Commodities" },
  { symbol: "MCX:COPPER",     name: "Copper Futures (Active)",     exchange: "MCX", type: "FUT",   segment: "MCX Commodities" },
  // Global Indices (via Yahoo Finance fallback)
  { symbol: "GLOBAL:^GSPC",   name: "S&P 500",                     exchange: "NYSE", type: "INDEX", segment: "Global Index" },
  { symbol: "GLOBAL:^DJI",    name: "Dow Jones Industrial",        exchange: "NYSE", type: "INDEX", segment: "Global Index" },
  { symbol: "GLOBAL:^IXIC",   name: "Nasdaq Composite",            exchange: "Nasdaq", type: "INDEX", segment: "Global Index" },
  { symbol: "GLOBAL:^HSI",    name: "Hang Seng Index",             exchange: "HKEX",   type: "INDEX", segment: "Global Index" },
  { symbol: "GLOBAL:^N225",   name: "Nikkei 225",                  exchange: "TSE",    type: "INDEX", segment: "Global Index" },
];

const EXCHANGE_COLORS: Record<string, string> = {
  NSE:    "#1565C0",
  BSE:    "#6A1B9A",
  MCX:    "#E65100",
  NYSE:   "#2E7D32",
  Nasdaq: "#00838F",
  HKEX:   "#D32F2F",
  TSE:    "#F57F17",
  GLOBAL: "#37474F",
};

const SEGMENT_ORDER = ["NSE Equity", "NSE Index", "BSE Index", "MCX Commodities", "Global Index"];

export interface Instrument {
  symbol:   string;
  name:     string;
  exchange: string;
  type:     string;
  segment:  string;
}

interface Props {
  onSelect:  (symbol: Instrument) => void;
  darkMode?: boolean;
  placeholder?: string;
  showRecent?: boolean;
}

const SymbolSearch: React.FC<Props> = ({
  onSelect,
  darkMode = true,
  placeholder = "Search symbol, company… (e.g. RELIANCE, NIFTY)",
  showRecent = true,
}) => {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<Instrument[]>([]);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [active,   setActive]   = useState(-1);
  const [recent,   setRecent]   = useState<Instrument[]>(() => {
    try { return JSON.parse(localStorage.getItem("finsieve:recent_symbols") ?? "[]"); }
    catch { return []; }
  });

  const inputRef    = useRef<HTMLInputElement>(null);
  const listRef     = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Search ────────────────────────────────────────────────────────────────

  const searchLocal = useCallback((q: string): Instrument[] => {
    const lower = q.toLowerCase();
    return QUICK_SYMBOLS.filter(s =>
      s.symbol.toLowerCase().includes(lower) ||
      s.name.toLowerCase().includes(lower) ||
      s.exchange.toLowerCase().includes(lower)
    );
  }, []);

  const searchRemote = useCallback(async (q: string): Promise<Instrument[]> => {
    try {
      const res = await axios.get(`${API_BASE}/broker/upstox/search?q=${encodeURIComponent(q)}&exchange=NSE_EQ`, { timeout: 5000 });
      if (!res.data.success) return [];
      return (res.data.data ?? []).slice(0, 20).map((item: Record<string, string>) => ({
        symbol:   `NSE:${item.tradingsymbol ?? item.symbol}`,
        name:     item.name ?? item.company_name ?? item.tradingsymbol,
        exchange: "NSE",
        type:     item.instrument_type ?? "EQ",
        segment:  "NSE Equity",
      }));
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      queueMicrotask(() => {
        setResults([]);
        setLoading(false);
      });
      return;
    }

    // Instant local results (defer setState to satisfy react-hooks/set-state-in-effect)
    const local = searchLocal(query);
    queueMicrotask(() => {
      setResults(local);
      setLoading(true);
    });
    debounceRef.current = setTimeout(async () => {
      const remote = await searchRemote(query);
      // Merge: remote first, then local that aren't already in remote
      const remoteSyms = new Set(remote.map(r => r.symbol));
      const merged = [...remote, ...local.filter(l => !remoteSyms.has(l.symbol))];
      setResults(merged.slice(0, 30));
      setLoading(false);
    }, 300);
  }, [query, searchLocal, searchRemote]);

  // ── Keyboard navigation ──────────────────────────────────────────────────

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    const displayed = query ? results : (showRecent ? recent : QUICK_SYMBOLS.slice(0, 8));
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, displayed.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === "Enter"  && active >= 0) { handleSelect(displayed[active]); }
    if (e.key === "Escape")    { setOpen(false); setQuery(""); }
  };

  // ── Select ────────────────────────────────────────────────────────────────

  const handleSelect = (inst: Instrument) => {
    onSelect(inst);
    setQuery("");
    setOpen(false);
    setActive(-1);
    // Persist to recent
    const next = [inst, ...recent.filter(r => r.symbol !== inst.symbol)].slice(0, 8);
    setRecent(next);
    localStorage.setItem("finsieve:recent_symbols", JSON.stringify(next));
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const bg       = darkMode ? "#1e222d" : "#fff";
  const bgHover  = darkMode ? "#2b2f3e" : "#f5f5f5";
  const fg       = darkMode ? "#d1d4dc" : "#191919";
  const border   = darkMode ? "#2b2f3e" : "#e0e0e0";
  const muted    = darkMode ? "#758696" : "#888";
  const inputBg  = darkMode ? "#131722" : "#f9fafb";

  const displayed: Instrument[] = query.trim()
    ? results
    : (showRecent && recent.length ? recent : QUICK_SYMBOLS.slice(0, 8));

  // Group by segment
  const grouped = SEGMENT_ORDER.reduce<Record<string, Instrument[]>>((acc, seg) => {
    const items = displayed.filter(d => d.segment === seg);
    if (items.length) acc[seg] = items;
    return acc;
  }, {});
  const ungrouped = displayed.filter(d => !SEGMENT_ORDER.includes(d.segment));
  if (ungrouped.length) grouped["Other"] = ungrouped;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Input */}
      <input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        style={{
          width:       "100%",
          padding:     "10px 14px",
          fontSize:    14,
          border:      `1px solid ${border}`,
          borderRadius: 6,
          background:  inputBg,
          color:       fg,
          outline:     "none",
          boxSizing:   "border-box",
        }}
      />
      {loading && (
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: muted, fontSize: 12 }}>
          Searching…
        </span>
      )}

      {/* Dropdown */}
      {open && (
        <ul
          ref={listRef}
          style={{
            position:  "absolute",
            top:       "calc(100% + 4px)",
            left:      0,
            right:     0,
            zIndex:    1000,
            background: bg,
            border:    `1px solid ${border}`,
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            maxHeight: 400,
            overflowY: "auto",
            listStyle: "none",
            margin:    0,
            padding:   0,
          }}
        >
          {!query.trim() && showRecent && recent.length > 0 && (
            <li style={{ padding: "6px 14px", fontSize: 11, color: muted, letterSpacing: 0.5 }}>
              RECENT
            </li>
          )}

          {Object.entries(grouped).map(([seg, items]) => (
            <React.Fragment key={seg}>
              {query.trim() || (showRecent && !recent.length) ? (
                <li style={{ padding: "4px 14px", fontSize: 11, color: muted, letterSpacing: 0.5, background: darkMode ? "#131722" : "#f5f5f5" }}>
                  {seg.toUpperCase()}
                </li>
              ) : null}
              {items.map((inst) => {
                const globalIdx = displayed.indexOf(inst);
                const isActive  = globalIdx === active;
                return (
                  <li
                    key={inst.symbol}
                    onMouseDown={() => handleSelect(inst)}
                    onMouseEnter={() => setActive(globalIdx)}
                    style={{
                      display:    "flex",
                      alignItems: "center",
                      padding:    "8px 14px",
                      cursor:     "pointer",
                      background: isActive ? bgHover : "transparent",
                      gap:        10,
                    }}
                  >
                    {/* Exchange badge */}
                    <span style={{
                      display:     "inline-flex", alignItems: "center", justifyContent: "center",
                      minWidth:    42, padding: "2px 6px", borderRadius: 4,
                      background:  (EXCHANGE_COLORS[inst.exchange] ?? "#455A64") + "22",
                      color:       EXCHANGE_COLORS[inst.exchange] ?? "#607D8B",
                      fontSize:    10, fontWeight: 700, letterSpacing: 0.5,
                    }}>
                      {inst.exchange}
                    </span>
                    {/* Name */}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: fg }}>
                        {inst.symbol.split(":")[1]}
                      </span>
                      <span style={{ marginLeft: 8, fontSize: 12, color: muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {inst.name}
                      </span>
                    </span>
                    {/* Type badge */}
                    <span style={{ fontSize: 10, color: muted, border: `1px solid ${border}`, borderRadius: 3, padding: "1px 5px" }}>
                      {inst.type}
                    </span>
                  </li>
                );
              })}
            </React.Fragment>
          ))}

          {displayed.length === 0 && query.trim() && !loading && (
            <li style={{ padding: "16px 14px", textAlign: "center", color: muted, fontSize: 13 }}>
              No results for "{query}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SymbolSearch;
