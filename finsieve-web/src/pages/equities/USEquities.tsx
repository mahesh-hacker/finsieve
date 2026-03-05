import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Refresh,
  ShowChart,
} from "@mui/icons-material";
import usMarketService, {
  type USStock,
  type USIndex,
} from "../../services/equities/usMarketService";
import toast from "react-hot-toast";

const USEquities = () => {
  const theme = useTheme();
  const [indices, setIndices] = useState<USIndex[]>([]);
  const [stocks, setStocks] = useState<USStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      const [indicesRes, stocksRes] = await Promise.all([
        usMarketService.getUSIndices(),
        usMarketService.getTopUSStocks(),
      ]);

      const indData = indicesRes as { data?: USIndex[] };
      const stkData = stocksRes as { data?: USStock[] };
      if (indData?.data) setIndices(indData.data);
      if (stkData?.data) setStocks(stkData.data);
    } catch (error) {
      console.error("Error fetching US market data:", error);
      if (isInitial) toast.error("Failed to load US market data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const fmt = (n: number) =>
    n?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const fmtLarge = (n: number) => {
    if (!n) return "N/A";
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n.toLocaleString()}`;
  };

  const filtered = stocks.filter(
    (s) =>
      s.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Sort helpers
  const getTopGainers = () =>
    [...stocks]
      .sort((a, b) => b.change_percent - a.change_percent)
      .slice(0, 10);
  const getTopLosers = () =>
    [...stocks]
      .sort((a, b) => a.change_percent - b.change_percent)
      .slice(0, 10);
  const getByVolume = () =>
    [...stocks].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 10);

  const displayStocks =
    activeTab === 0
      ? filtered
      : activeTab === 1
        ? getTopGainers()
        : activeTab === 2
          ? getTopLosers()
          : getByVolume();

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
          Loading US market data...
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
          mb: 3,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            🇺🇸 US Equities
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            NYSE & NASDAQ • Real-time data via Yahoo Finance
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton
              onClick={() => fetchData(false)}
              disabled={isRefreshing}
              size="small"
            >
              <Refresh
                sx={{
                  animation: isRefreshing ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": {
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* US Indices Cards */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Major Indices
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(6, 1fr)",
          },
          gap: 2,
          mb: 4,
        }}
      >
        {indices.map((idx) => {
          const pos = idx.change_percent >= 0;
          const clr = pos ? "#10b981" : "#ef4444";
          return (
            <Card
              key={idx.symbol}
              sx={{
                background: `linear-gradient(135deg, ${alpha(clr, 0.06)} 0%, ${alpha(clr, 0.02)} 100%)`,
                borderTop: `3px solid ${clr}`,
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
                transition: "all 0.2s",
                cursor: "pointer",
              }}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "text.secondary",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {idx.symbol?.replace("^", "")}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    fontSize: "0.65rem",
                    mb: 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {idx.name}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, my: 0.5, fontSize: "1.1rem" }}
                >
                  {fmt(idx.current_value)}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {pos ? (
                    <TrendingUp sx={{ fontSize: 14, color: clr }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 14, color: clr }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: clr }}
                  >
                    {pos ? "+" : ""}
                    {idx.change_percent?.toFixed(2)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: clr, ml: 0.5 }}>
                    ({pos ? "+" : ""}
                    {fmt(idx.change)})
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Stocks Section */}
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            <ShowChart sx={{ mr: 1, verticalAlign: "middle" }} />
            Stocks
          </Typography>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ minHeight: 36 }}
          >
            <Tab label="All" sx={{ minHeight: 36, py: 0 }} />
            <Tab label="Top Gainers 🚀" sx={{ minHeight: 36, py: 0 }} />
            <Tab label="Top Losers 📉" sx={{ minHeight: 36, py: 0 }} />
            <Tab label="Most Active" sx={{ minHeight: 36, py: 0 }} />
          </Tabs>
        </Box>
        {activeTab === 0 && (
          <TextField
            size="small"
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 250 }}
          />
        )}
      </Box>

      {/* Stocks Table */}
      <Card sx={{ overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <Box
            component="table"
            sx={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}
          >
            <Box
              component="thead"
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}
            >
              <Box component="tr">
                {[
                  "#",
                  "Symbol",
                  "Name",
                  "Price",
                  "Change",
                  "Change %",
                  "Volume",
                  "Market Cap",
                  "P/E",
                  "52W High",
                  "52W Low",
                ].map((h) => (
                  <Box
                    component="th"
                    key={h}
                    sx={{
                      p: 1.5,
                      textAlign: "left",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {displayStocks.map((s, i) => {
                const pos = s.change_percent >= 0;
                const clr = pos ? "#10b981" : "#ef4444";
                return (
                  <Box
                    component="tr"
                    key={s.symbol}
                    sx={{
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      },
                      transition: "background 0.15s",
                    }}
                  >
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        color: "text.secondary",
                        fontSize: "0.8rem",
                      }}
                    >
                      {i + 1}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                      }}
                    >
                      {s.symbol}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: "0.85rem",
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.name}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontWeight: 700,
                      }}
                    >
                      ${fmt(s.current_value)}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        color: clr,
                        fontWeight: 600,
                      }}
                    >
                      {pos ? "+" : ""}
                      {fmt(s.change)}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Chip
                        label={`${pos ? "+" : ""}${s.change_percent?.toFixed(2)}%`}
                        size="small"
                        sx={{
                          bgcolor: alpha(clr, 0.1),
                          color: clr,
                          fontWeight: 700,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: "0.85rem",
                      }}
                    >
                      {s.volume?.toLocaleString() || "N/A"}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: "0.85rem",
                      }}
                    >
                      {fmtLarge(s.market_cap)}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: "0.85rem",
                      }}
                    >
                      {s.pe_ratio ? s.pe_ratio.toFixed(2) : "—"}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: "0.85rem",
                        color: "#10b981",
                      }}
                    >
                      {s.fifty_two_week_high
                        ? `$${fmt(s.fifty_two_week_high)}`
                        : "—"}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: "0.85rem",
                        color: "#ef4444",
                      }}
                    >
                      {s.fifty_two_week_low
                        ? `$${fmt(s.fifty_two_week_low)}`
                        : "—"}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
        {displayStocks.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              {searchQuery
                ? `No stocks found matching "${searchQuery}"`
                : "No data available"}
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default USEquities;
