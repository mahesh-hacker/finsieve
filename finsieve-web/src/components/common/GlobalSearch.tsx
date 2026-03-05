import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  TrendingUp,
  ShowChart,
  AccountBalance,
  CurrencyBitcoin,
  Grain,
  BarChart,
  History,
  Clear,
  ArrowForward,
  Keyboard,
} from "@mui/icons-material";
import nseStocksService, { type NSEStock } from "../../services/equities/nseStocksService";

/* ─── Types ────────────────────────────────────────────────────── */
interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  exchange?: string;
  price?: number;
  change?: number;
  pChange?: number;
  path: string;
}

/* ─── Asset class icon & color ─────────────────────────────────── */
const assetConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  EQUITY: { icon: <ShowChart fontSize="small" />, color: "#6366f1", label: "Indian Equity" },
  "US_EQUITY": { icon: <ShowChart fontSize="small" />, color: "#2563eb", label: "US Equity" },
  MUTUAL_FUND: { icon: <BarChart fontSize="small" />, color: "#10b981", label: "Mutual Fund" },
  CRYPTO: { icon: <CurrencyBitcoin fontSize="small" />, color: "#f59e0b", label: "Crypto" },
  COMMODITY: { icon: <Grain fontSize="small" />, color: "#d97706", label: "Commodity" },
  BOND: { icon: <AccountBalance fontSize="small" />, color: "#6b7280", label: "Bond" },
  INDEX: { icon: <TrendingUp fontSize="small" />, color: "#06b6d4", label: "Index" },
};

/* ─── Popular shortcuts ────────────────────────────────────────── */
const POPULAR_SHORTCUTS = [
  { symbol: "NIFTY 50", name: "NSE Nifty 50 Index", assetClass: "INDEX", path: "/indices" },
  { symbol: "SENSEX", name: "BSE Sensex Index", assetClass: "INDEX", path: "/indices" },
  { symbol: "RELIANCE", name: "Reliance Industries", assetClass: "EQUITY", path: "/equities/indian/RELIANCE" },
  { symbol: "TCS", name: "Tata Consultancy Services", assetClass: "EQUITY", path: "/equities/indian/TCS" },
  { symbol: "HDFCBANK", name: "HDFC Bank Limited", assetClass: "EQUITY", path: "/equities/indian/HDFCBANK" },
  { symbol: "BTC", name: "Bitcoin", assetClass: "CRYPTO", path: "/crypto" },
];

/* ─── Recent searches storage ──────────────────────────────────── */
const getRecentSearches = (): SearchResult[] => {
  try {
    return JSON.parse(localStorage.getItem("fs-recent-searches") || "[]");
  } catch {
    return [];
  }
};

const addRecentSearch = (item: SearchResult) => {
  const recent = getRecentSearches().filter((r) => r.id !== item.id).slice(0, 9);
  recent.unshift(item);
  localStorage.setItem("fs-recent-searches", JSON.stringify(recent));
};

const clearRecentSearches = () => localStorage.removeItem("fs-recent-searches");

/* ─── Component ────────────────────────────────────────────────── */
interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const GlobalSearch = ({ open, onClose }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const searchStocks = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await nseStocksService.getAllNSEStocks() as { data?: NSEStock[] };
      const stocks: NSEStock[] = res?.data ?? [];
      const lower = q.toLowerCase();
      const matched = stocks
        .filter(
          (s) =>
            s.symbol.toLowerCase().includes(lower) ||
            (s.companyName || "").toLowerCase().includes(lower)
        )
        .slice(0, 8)
        .map((s) => ({
          id: s.symbol,
          symbol: s.symbol,
          name: s.companyName || s.symbol,
          assetClass: "EQUITY",
          exchange: "NSE",
          price: s.lastPrice,
          change: s.change,
          pChange: s.pChange,
          path: `/equities/indian/${s.symbol}`,
        }));
      setResults(matched);
    } catch {
      // fallback: search across popular shortcuts
      const lower = q.toLowerCase();
      const matched = POPULAR_SHORTCUTS.filter(
        (s) =>
          s.symbol.toLowerCase().includes(lower) ||
          s.name.toLowerCase().includes(lower)
      ).map((s) => ({
        id: s.symbol,
        symbol: s.symbol,
        name: s.name,
        assetClass: s.assetClass,
        path: s.path,
      }));
      setResults(matched);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (query.length >= 2) {
      setLoading(true);
      debounceTimer.current = setTimeout(() => searchStocks(query), 300);
    } else {
      setResults([]);
      setLoading(false);
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, searchStocks]);

  const handleSelect = (item: SearchResult) => {
    addRecentSearch(item);
    onClose();
    navigate(item.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const displayedItems = query.length >= 2 ? results : recentSearches.length > 0 ? recentSearches : POPULAR_SHORTCUTS.map((s) => ({ ...s, id: s.symbol }));
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, displayedItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(displayedItems[selectedIndex] as SearchResult);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const displayItems: SearchResult[] =
    query.length >= 2
      ? results
      : recentSearches.length > 0
      ? recentSearches
      : POPULAR_SHORTCUTS.map((s) => ({ ...s, id: s.symbol }));

  const sectionLabel =
    query.length >= 2
      ? results.length > 0
        ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`
        : ""
      : recentSearches.length > 0
      ? "Recent Searches"
      : "Popular";

  const config = (assetClass: string) => assetConfig[assetClass] || assetConfig.EQUITY;
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          background: theme.palette.mode === "dark" ? "#111827" : "#fff",
          border: isMobile ? "none" : `1px solid ${theme.palette.divider}`,
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          mt: isMobile ? 0 : 10,
          maxHeight: isMobile ? "100dvh" : "80vh",
          overflow: "hidden",
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(4px)",
          background: "rgba(0,0,0,0.4)",
        },
      }}
    >
      <DialogContent sx={{ p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Search Input */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
            onKeyDown={handleKeyDown}
            placeholder="Search stocks, funds, indices, crypto..."
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  {loading ? (
                    <CircularProgress size={18} />
                  ) : (
                    <Search sx={{ fontSize: 22, color: "text.secondary" }} />
                  )}
                </InputAdornment>
              ),
              endAdornment: query && (
                <InputAdornment position="end">
                  <Box
                    onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                    sx={{ cursor: "pointer", display: "flex", alignItems: "center", p: 0.5, borderRadius: 1, "&:hover": { background: alpha(theme.palette.divider, 0.5) } }}
                  >
                    <Clear sx={{ fontSize: 16, color: "text.secondary" }} />
                  </Box>
                </InputAdornment>
              ),
              sx: {
                fontSize: 18,
                fontWeight: 500,
                "& input": { py: 0.5 },
              },
            }}
          />
        </Box>

        {/* Results */}
        <Box sx={{ overflowY: "auto", flex: 1 }}>
          {query.length >= 2 && !loading && results.length === 0 ? (
            <Box textAlign="center" py={5}>
              <Search sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
              <Typography color="text.secondary" fontWeight={600}>No results for "{query}"</Typography>
              <Typography variant="body2" color="text.disabled" mt={0.5}>
                Try searching by company name, symbol, or ISIN
              </Typography>
            </Box>
          ) : (
            <>
              {sectionLabel && (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  px={2}
                  py={1.2}
                >
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", letterSpacing: 0.8, textTransform: "uppercase" }}>
                    {sectionLabel}
                  </Typography>
                  {query.length < 2 && recentSearches.length > 0 && (
                    <Typography
                      sx={{ fontSize: 12, color: "primary.main", cursor: "pointer", fontWeight: 600 }}
                      onClick={() => {
                        clearRecentSearches();
                        setRecentSearches([]);
                      }}
                    >
                      Clear All
                    </Typography>
                  )}
                </Box>
              )}

              <List dense sx={{ py: 0 }}>
                {displayItems.map((item, idx) => {
                  const ac = config(item.assetClass);
                  const isSelected = idx === selectedIndex;
                  const isPositive = (item.pChange ?? 0) >= 0;

                  return (
                    <ListItemButton
                      key={item.id}
                      selected={isSelected}
                      onClick={() => handleSelect(item as SearchResult)}
                      sx={{
                        px: 2,
                        py: 1.25,
                        transition: "background 0.1s",
                        borderLeft: isSelected ? `3px solid ${theme.palette.primary.main}` : "3px solid transparent",
                        "&.Mui-selected": {
                          background: alpha(theme.palette.primary.main, 0.06),
                        },
                        "&:hover": {
                          background: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            background: alpha(ac.color, 0.12),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: ac.color,
                          }}
                        >
                          {query.length < 2 && recentSearches.find((r) => r.id === item.id) ? (
                            <History sx={{ fontSize: 16 }} />
                          ) : (
                            ac.icon
                          )}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>
                              {item.symbol}
                            </Typography>
                            <Chip
                              label={ac.label}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: 9,
                                fontWeight: 700,
                                background: alpha(ac.color, 0.1),
                                color: ac.color,
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography sx={{ fontSize: 12, color: "text.secondary" }} component="span">
                            {item.name}
                            {item.exchange && ` · ${item.exchange}`}
                          </Typography>
                        }
                      />
                      {item.price !== undefined && (
                        <Box textAlign="right">
                          <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>
                            ₹{item.price?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: isPositive ? "#10b981" : "#ef4444",
                            }}
                          >
                            {isPositive ? "+" : ""}{item.pChange?.toFixed(2)}%
                          </Typography>
                        </Box>
                      )}
                      <ArrowForward sx={{ fontSize: 14, ml: 1, color: "text.disabled", flexShrink: 0 }} />
                    </ListItemButton>
                  );
                })}
              </List>
            </>
          )}

          {/* Quick Links */}
          {query.length < 2 && (
            <>
              <Divider />
              <Box px={2} py={1.5}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", letterSpacing: 0.8, textTransform: "uppercase", mb: 1.5 }}>
                  Quick Links
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {[
                    { label: "Screener", path: "/screening" },
                    { label: "Compare", path: "/comparison" },
                    { label: "Watchlists", path: "/watchlists" },
                    { label: "News", path: "/news" },
                    { label: "Crypto", path: "/crypto" },
                  ].map((l) => (
                    <Chip
                      key={l.label}
                      label={l.label}
                      clickable
                      size="small"
                      onClick={() => { onClose(); navigate(l.path); }}
                      sx={{
                        fontWeight: 600,
                        fontSize: 12,
                        background: alpha(theme.palette.divider, 0.5),
                        "&:hover": { background: alpha(theme.palette.primary.main, 0.1) },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 3,
            flexShrink: 0,
          }}
        >
          {[
            { keys: ["↑", "↓"], label: "Navigate" },
            { keys: ["↵"], label: "Select" },
            { keys: ["Esc"], label: "Close" },
          ].map((k) => (
            <Box key={k.label} display="flex" alignItems="center" gap={0.75}>
              {k.keys.map((key) => (
                <Box
                  key={key}
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.75,
                    background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    border: `1px solid ${theme.palette.divider}`,
                    fontFamily: "monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "text.secondary",
                  }}
                >
                  {key}
                </Box>
              ))}
              <Typography sx={{ fontSize: 11, color: "text.disabled" }}>{k.label}</Typography>
            </Box>
          ))}
          <Box flexGrow={1} />
          <Box display="flex" alignItems="center" gap={0.5}>
            <Keyboard sx={{ fontSize: 12, color: "text.disabled" }} />
            <Typography sx={{ fontSize: 11, color: "text.disabled" }}>Press / to search</Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
