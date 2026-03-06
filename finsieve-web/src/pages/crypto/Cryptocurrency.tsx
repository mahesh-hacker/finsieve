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
  Avatar,
  LinearProgress,
} from "@mui/material";
import {
  Search,
  Refresh,
  LocalFireDepartment,
} from "@mui/icons-material";
import cryptoService, {
  type Crypto,
  type CryptoOverview,
  type TrendingCrypto,
} from "../../services/crypto/cryptoService";
import toast from "react-hot-toast";

// Mini sparkline renderer
const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 32;
  const points = data
    .map(
      (v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`,
    )
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
};

const Cryptocurrency = () => {
  const theme = useTheme();
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [overview, setOverview] = useState<CryptoOverview | null>(null);
  const [trending, setTrending] = useState<TrendingCrypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      const [cryptoRes, overviewRes, trendingRes] = await Promise.all([
        cryptoService.getTopCryptos(200),
        cryptoService.getMarketOverview(),
        cryptoService.getTrending(),
      ]);

      const cd = cryptoRes as { data?: Crypto[] };
      const od = overviewRes as { data?: CryptoOverview };
      const td = trendingRes as { data?: TrendingCrypto[] };
      if (cd?.data) setCryptos(cd.data);
      if (od?.data) setOverview(od.data);
      if (td?.data) setTrending(td.data);
    } catch (error) {
      console.error("Error fetching crypto data:", error);
      if (isInitial) toast.error("Failed to load crypto data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const fmt = (n: number, d = 2) =>
    n?.toLocaleString("en-US", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });

  const fmtLarge = (n: number) => {
    if (!n) return "N/A";
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n.toLocaleString()}`;
  };

  const filtered = cryptos.filter(
    (c) =>
      c.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
          Loading cryptocurrency data...
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
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: { xs: 18, sm: 22, md: 26 },
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            ₿ Cryptocurrency
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Top 200 by Market Cap • Powered by CoinGecko
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

      {/* Market Overview Cards */}
      {overview && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            mb: 4,
          }}
        >
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha("#3b82f6", 0.08)} 0%, transparent 100%)`,
              borderTop: "3px solid #3b82f6",
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                Total Market Cap
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                {fmtLarge(overview.total_market_cap)}
              </Typography>
              <Chip
                label={`${overview.market_cap_change_24h >= 0 ? "+" : ""}${overview.market_cap_change_24h?.toFixed(2)}%`}
                size="small"
                sx={{
                  mt: 0.5,
                  bgcolor: alpha(
                    overview.market_cap_change_24h >= 0 ? "#10b981" : "#ef4444",
                    0.1,
                  ),
                  color:
                    overview.market_cap_change_24h >= 0 ? "#10b981" : "#ef4444",
                  fontWeight: 700,
                }}
              />
            </CardContent>
          </Card>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha("#f59e0b", 0.08)} 0%, transparent 100%)`,
              borderTop: "3px solid #f59e0b",
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                BTC Dominance
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                {overview.btc_dominance?.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={overview.btc_dominance || 0}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha("#8b5cf6", 0.08)} 0%, transparent 100%)`,
              borderTop: "3px solid #8b5cf6",
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                ETH Dominance
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                {overview.eth_dominance?.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={overview.eth_dominance || 0}
                sx={{
                  mt: 1,
                  height: 6,
                  borderRadius: 3,
                  "& .MuiLinearProgress-bar": { bgcolor: "#8b5cf6" },
                }}
              />
            </CardContent>
          </Card>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha("#10b981", 0.08)} 0%, transparent 100%)`,
              borderTop: "3px solid #10b981",
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                Active Cryptos
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                {overview.active_cryptocurrencies?.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Total 24h Vol: {fmtLarge(overview.total_volume)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <LocalFireDepartment sx={{ color: "#f59e0b" }} /> Trending
          </Typography>
          <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1 }}>
            {trending.slice(0, 7).map((t) => (
              <Card
                key={t.id}
                sx={{
                  minWidth: 140,
                  flex: "0 0 auto",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
              >
                <CardContent
                  sx={{
                    p: 1.5,
                    "&:last-child": { pb: 1.5 },
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  {t.image && (
                    <Avatar src={t.image} sx={{ width: 24, height: 24 }} />
                  )}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {t.symbol?.toUpperCase()}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      #{t.market_cap_rank}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Search */}
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
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Top 200 Cryptocurrencies
        </Typography>
        <TextField
          size="small"
          placeholder="Search cryptos..."
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
          sx={{ width: { xs: "100%", sm: 220 } }}
        />
      </Box>

      {/* Crypto Table */}
      <Card sx={{ overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="table"
            sx={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}
          >
            <Box
              component="thead"
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}
            >
              <Box component="tr">
                {[
                  "#",
                  "Coin",
                  "Price",
                  "1h",
                  "24h",
                  "7d",
                  "Market Cap",
                  "Volume (24h)",
                  "Circulating Supply",
                  "7D Chart",
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
              {filtered.map((c) => {
                const pos = c.change_percent >= 0;
                const c1h = c.change_1h ?? 0;
                const c7d = c.change_7d ?? 0;
                return (
                  <Box
                    component="tr"
                    key={c.id}
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
                      {c.market_cap_rank}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar src={c.image} sx={{ width: 24, height: 24 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {c.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              textTransform: "uppercase",
                            }}
                          >
                            {c.symbol}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontWeight: 700,
                      }}
                    >
                      $
                      {c.current_value < 1
                        ? c.current_value?.toFixed(6)
                        : fmt(c.current_value)}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        color: c1h >= 0 ? "#10b981" : "#ef4444",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                      }}
                    >
                      {c1h >= 0 ? "+" : ""}
                      {c1h?.toFixed(2)}%
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Chip
                        label={`${pos ? "+" : ""}${c.change_percent?.toFixed(2)}%`}
                        size="small"
                        sx={{
                          bgcolor: alpha(pos ? "#10b981" : "#ef4444", 0.1),
                          color: pos ? "#10b981" : "#ef4444",
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
                        color: c7d >= 0 ? "#10b981" : "#ef4444",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                      }}
                    >
                      {c7d >= 0 ? "+" : ""}
                      {c7d?.toFixed(2)}%
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: "0.85rem",
                      }}
                    >
                      {fmtLarge(c.market_cap)}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: "0.85rem",
                      }}
                    >
                      {fmtLarge(c.total_volume)}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: "0.8rem",
                      }}
                    >
                      {c.circulating_supply
                        ? `${(c.circulating_supply / 1e6).toFixed(2)}M ${c.symbol?.toUpperCase()}`
                        : "N/A"}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <MiniSparkline
                        data={c.sparkline_7d}
                        color={c7d >= 0 ? "#10b981" : "#ef4444"}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
        {filtered.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              {searchQuery
                ? `No cryptos found matching "${searchQuery}"`
                : "No data available"}
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default Cryptocurrency;
