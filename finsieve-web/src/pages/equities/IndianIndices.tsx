import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  AccountBalance,
} from "@mui/icons-material";
import globalIndicesService from "../../services/indices/globalIndicesService";
import toast from "react-hot-toast";

interface IndianIndex {
  symbol: string;
  name: string;
  current_value: number;
  change: number;
  change_percent: number;
  previous_close: number;
  open: number;
  high: number;
  low: number;
  volume?: number;
  country: string;
  exchange: string;
  category?: string;
  currency?: string;
  note?: string;
  last_updated: string;
}

const CATEGORIES = [
  { key: "All", label: "All", emoji: "📊" },
  { key: "Broad Market", label: "Broad Market", emoji: "📈" },
  { key: "Sectoral", label: "Sectoral", emoji: "🏭" },
  { key: "Volatility", label: "Volatility", emoji: "⚡" },
  { key: "GIFT India", label: "GIFT India / NSE IFSC", emoji: "🏙️" },
];

const EXCHANGE_COLORS: Record<string, string> = {
  NSE: "#6366f1",
  BSE: "#f59e0b",
  "NSE IFSC": "#10b981",
};

const IndianIndices = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [indices, setIndices] = useState<IndianIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeCategory, setActiveCategory] = useState(0);

  const fetchIndices = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      const res = await globalIndicesService.getIndianIndices();
      const typed = res as { success?: boolean; data?: IndianIndex[] };
      const data: IndianIndex[] = typed?.data ?? (Array.isArray(res) ? (res as IndianIndex[]) : []);

      if (data.length > 0) {
        setIndices(data);
        setLastUpdate(new Date());
      }
    } catch {
      if (isInitial) toast.error("Failed to load Indian indices data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIndices(true);
    const t = setInterval(() => fetchIndices(false), 30000);
    return () => clearInterval(t);
  }, [fetchIndices]);

  const fmt = (n: number | string | null | undefined) => {
    if (n == null) return "—";
    const num = typeof n === "string" ? parseFloat(n.replace(/,/g, "")) : n;
    return Number.isFinite(num)
      ? num.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "—";
  };

  const getNum = (v: number | string | null | undefined): number => {
    if (v == null) return 0;
    return (typeof v === "string" ? parseFloat(v.replace(/,/g, "")) : v) || 0;
  };

  const catKey = CATEGORIES[activeCategory].key;
  const filtered =
    catKey === "All"
      ? indices
      : indices.filter((i) => (i.category ?? "Broad Market") === catKey);

  const advancers = indices.filter(
    (i) => (i.category ?? "") !== "Volatility" && getNum(i.change_percent) >= 0
  ).length;
  const decliners = indices.filter(
    (i) => (i.category ?? "") !== "Volatility" && getNum(i.change_percent) < 0
  ).length;

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 12,
        }}
      >
        <CircularProgress size={48} />
        <Typography sx={{ mt: 2, color: "text.secondary" }}>
          Loading Indian Indices...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: { xs: 18, sm: 22, md: 26 },
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            🇮🇳 Indian Indices
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            NSE · BSE · GIFT India / NSE IFSC ·{" "}
            {lastUpdate.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={`${advancers} Up`}
            size="small"
            sx={{
              bgcolor: alpha("#10b981", 0.1),
              color: "#10b981",
              fontWeight: 700,
              fontSize: 11,
            }}
          />
          <Chip
            label={`${decliners} Down`}
            size="small"
            sx={{
              bgcolor: alpha("#ef4444", 0.1),
              color: "#ef4444",
              fontWeight: 700,
              fontSize: 11,
            }}
          />
          <Tooltip title="Refresh">
            <IconButton
              onClick={() => fetchIndices(false)}
              disabled={isRefreshing}
              size="small"
            >
              <Refresh
                sx={{
                  animation: isRefreshing ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": { "100%": { transform: "rotate(360deg)" } },
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onChange={(_, v) => setActiveCategory(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, minHeight: 36 }}
      >
        {CATEGORIES.map((cat) => {
          const count =
            cat.key === "All"
              ? indices.length
              : indices.filter((i) => (i.category ?? "Broad Market") === cat.key).length;
          return (
            <Tab
              key={cat.key}
              label={`${cat.emoji} ${cat.label} (${count})`}
              sx={{ minHeight: 36, py: 0, fontSize: { xs: 11, sm: 12 } }}
            />
          );
        })}
      </Tabs>

      {/* GIFT India info banner */}
      {(catKey === "All" || catKey === "GIFT India") && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: isDark ? alpha("#10b981", 0.08) : alpha("#10b981", 0.05),
            border: `1px solid ${alpha("#10b981", 0.2)}`,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <AccountBalance sx={{ color: "#10b981", fontSize: 20, flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>
              GIFT India / NSE IFSC — International Financial Services Centre
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              GIFT City (Gujarat), India's first IFSC. NSE IFSC offers NIFTY 50 & Bank Nifty
              USD-denominated futures. Values mirror domestic NSE indices.
            </Typography>
          </Box>
        </Box>
      )}

      {indices.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <Typography>No indices data available. Try refreshing.</Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          <Typography variant="body2">No data for this category.</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {filtered.map((idx) => {
            const changePct = getNum(idx.change_percent);
            const pos = changePct >= 0;
            const isVix = idx.symbol === "INDIAVIX";
            const clr = isVix
              ? "#8b5cf6"
              : pos
              ? "#10b981"
              : "#ef4444";
            const exColor = EXCHANGE_COLORS[idx.exchange] ?? "#6366f1";
            const isGift = idx.category === "GIFT India";

            return (
              <Card
                key={idx.symbol}
                sx={{
                  background: `linear-gradient(135deg, ${alpha(clr, 0.06)} 0%, ${alpha(clr, 0.02)} 100%)`,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  borderTop: `3px solid ${clr}`,
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
                  transition: "all 0.2s",
                  cursor: "default",
                  position: "relative",
                }}
              >
                {isGift && (
                  <Chip
                    label="GIFT"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      fontSize: 9,
                      height: 16,
                      bgcolor: alpha("#10b981", 0.15),
                      color: "#10b981",
                      fontWeight: 800,
                    }}
                  />
                )}
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  {/* Exchange badge */}
                  <Box
                    sx={{
                      display: "inline-block",
                      px: 0.75,
                      py: 0.1,
                      borderRadius: 0.75,
                      bgcolor: alpha(exColor, 0.12),
                      color: exColor,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      mb: 0.5,
                    }}
                  >
                    {idx.exchange}
                  </Box>

                  {/* Category chip */}
                  {idx.category && (
                    <Typography
                      sx={{
                        fontSize: 9,
                        color: "text.disabled",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        ml: 0.5,
                        display: "inline",
                      }}
                    >
                      · {idx.category}
                    </Typography>
                  )}

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      mt: 0.5,
                      mb: 0.25,
                      lineHeight: 1.3,
                      fontSize: { xs: 12, sm: 13 },
                    }}
                  >
                    {idx.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "block",
                      fontSize: 10,
                      mb: 0.5,
                    }}
                  >
                    {idx.symbol}
                    {idx.currency && idx.currency !== "INR"
                      ? ` · ${idx.currency}`
                      : ""}
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, my: 0.5, fontSize: { xs: "1rem", sm: "1.1rem" } }}
                  >
                    {idx.current_value > 0 ? fmt(idx.current_value) : "—"}
                  </Typography>

                  {!isVix ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                      {pos ? (
                        <TrendingUp sx={{ fontSize: 14, color: clr }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 14, color: clr }} />
                      )}
                      <Typography variant="caption" sx={{ fontWeight: 700, color: clr }}>
                        {pos ? "+" : ""}
                        {Number.isFinite(changePct) ? changePct.toFixed(2) : "—"}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        ({pos ? "+" : ""}
                        {fmt(idx.change)})
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" sx={{ color: clr, fontWeight: 600 }}>
                      Fear Index · {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                    </Typography>
                  )}

                  {/* OHLC mini row */}
                  {idx.open > 0 && (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 0.25,
                        mt: 1,
                        pt: 1,
                        borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                      }}
                    >
                      <Typography sx={{ fontSize: 9, color: "text.disabled" }}>
                        O: {fmt(idx.open)}
                      </Typography>
                      <Typography sx={{ fontSize: 9, color: "text.disabled" }}>
                        H: <span style={{ color: "#10b981" }}>{fmt(idx.high)}</span>
                      </Typography>
                      <Typography sx={{ fontSize: 9, color: "text.disabled" }}>
                        C: {fmt(idx.previous_close)}
                      </Typography>
                      <Typography sx={{ fontSize: 9, color: "text.disabled" }}>
                        L: <span style={{ color: "#ef4444" }}>{fmt(idx.low)}</span>
                      </Typography>
                    </Box>
                  )}

                  {/* GIFT note */}
                  {isGift && idx.note && (
                    <Typography
                      sx={{
                        fontSize: 9,
                        color: "text.disabled",
                        mt: 0.75,
                        lineHeight: 1.4,
                        fontStyle: "italic",
                      }}
                    >
                      {idx.note}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Footer */}
      {!loading && indices.length > 0 && (
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", mt: 2, display: "block" }}
        >
          {filtered.length} indices shown · Live via Yahoo Finance · GIFT data mirrors NSE
        </Typography>
      )}
    </Box>
  );
};

export default IndianIndices;
