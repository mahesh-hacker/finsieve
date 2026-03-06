import {
  Box,
  Typography,
  Button,
  alpha,
  useTheme,
  Chip,
  Skeleton,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Rocket,
  ShowChart,
  Speed,
  Insights,
  FilterList,
  ArrowForward,
  Public,
  CurrencyBitcoin,
  AccountBalance,
  Diamond,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../store";
import { useState, useEffect, useCallback } from "react";
import marketService, {
  GlobalIndex,
} from "../../services/market/marketService";
import { useRealTimeIndices } from "../../hooks/useRealTimeIndices";
import toast from "react-hot-toast";

// ─── Mini Sparkline ──────────────────────────────────────────
const MiniSparkline = ({
  positive,
  width = 60,
  height = 24,
}: {
  positive: boolean;
  width?: number;
  height?: number;
}) => {
  const color = positive ? "#10b981" : "#ef4444";
  // Generate realistic-looking sparkline points
  const points = Array.from({ length: 12 }, (_, i) => {
    const progress = i / 11;
    const trend = positive ? progress * 0.6 : -progress * 0.6;
    const noise = Math.sin(i * 2.5) * 0.2 + Math.cos(i * 1.7) * 0.15;
    return Math.max(0.1, Math.min(0.9, 0.5 + trend + noise));
  });

  const svgPoints = points
    .map((v, i) => `${(i / 11) * width},${height - v * height}`)
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`spark-${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={svgPoints}
        opacity={0.8}
      />
    </svg>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const [indices, setIndices] = useState<GlobalIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { indices: liveIndices, lastUpdate: liveUpdate } = useRealTimeIndices("all");

  const fetchIndices = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const response = await marketService.getMajorIndices();
      if (response.success && response.data) {
        setIndices(response.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("❌ Error fetching indices:", error);
      if (isInitialLoad) toast.error("Failed to load market data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndices(true);
  }, [fetchIndices]);

  useEffect(() => {
    if (!liveIndices.length) return;
    setIndices((prev) => {
      if (!prev.length) return prev;
      const liveMap = new Map(liveIndices.map((r) => [r.symbol, r]));
      return prev.map((idx) => {
        const live = liveMap.get(idx.symbol);
        if (!live) return idx;
        return {
          ...idx,
          current_value: live.current_value,
          change: live.change,
          change_percent: live.change_percent,
          open: live.open ?? idx.open,
          high: live.high ?? idx.high,
          low: live.low ?? idx.low,
          previous_close: live.previous_close ?? idx.previous_close,
          last_updated: live.last_updated,
        };
      });
    });
    setLastUpdate(liveUpdate);
  }, [liveIndices, liveUpdate]);

  useEffect(() => {
    const interval = setInterval(() => fetchIndices(false), 15000);
    return () => clearInterval(interval);
  }, [fetchIndices]);

  const formatNumber = (num: number | string) => {
    const n = typeof num === "string" ? parseFloat(num) : num;
    return n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const stats = indices.map((index) => {
    const val =
      typeof index.current_value === "string"
        ? parseFloat(index.current_value)
        : index.current_value;
    const chg =
      typeof index.change === "string"
        ? parseFloat(index.change)
        : index.change;
    const pct =
      typeof index.change_percent === "string"
        ? parseFloat(index.change_percent)
        : index.change_percent;
    return {
      title: index.symbol,
      subtitle: index.name,
      value: formatNumber(val),
      change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
      changeValue: `${chg >= 0 ? "+" : ""}${formatNumber(chg)}`,
      isPositive: pct >= 0,
      country: index.country,
    };
  });

  // ─── Quick Access Cards ──────────────────────────────────
  const quickAccess = [
    {
      title: "Global Indices",
      description: "20+ world indices",
      icon: <Public sx={{ fontSize: 22 }} />,
      path: "/indices",
      gradient:
        "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%)",
      iconColor: "#818cf8",
    },
    {
      title: "Cryptocurrency",
      description: "Top 100 coins",
      icon: <CurrencyBitcoin sx={{ fontSize: 22 }} />,
      path: "/crypto",
      gradient:
        "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)",
      iconColor: "#fbbf24",
    },
    {
      title: "US Equities",
      description: "NYSE & NASDAQ",
      icon: <TrendingUp sx={{ fontSize: 22 }} />,
      path: "/equities/us",
      gradient:
        "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)",
      iconColor: "#34d399",
    },
    {
      title: "Mutual Funds",
      description: "AMFI registered",
      icon: <AccountBalance sx={{ fontSize: 22 }} />,
      path: "/mutual-funds",
      gradient:
        "linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(236,72,153,0.04) 100%)",
      iconColor: "#f472b6",
    },
    {
      title: "Commodities",
      description: "Gold, Oil & more",
      icon: <Diamond sx={{ fontSize: 22 }} />,
      path: "/commodities",
      gradient:
        "linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(6,182,212,0.04) 100%)",
      iconColor: "#22d3ee",
    },
    {
      title: "Screener",
      description: "50+ filters",
      icon: <FilterList sx={{ fontSize: 22 }} />,
      path: "/screening",
      gradient:
        "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%)",
      iconColor: "#a78bfa",
    },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      {/* ─── Hero ────────────────────────────────────────── */}
      <Box
        sx={{
          mb: 4,
          position: "relative",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: "#6366f1",
                fontWeight: 700,
                fontSize: "0.65rem",
                mb: 0.5,
                display: "block",
              }}
            >
              INVESTMENT INTELLIGENCE
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: "text.primary",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                mb: 1,
              }}
            >
              Good{" "}
              {new Date().getHours() < 12
                ? "Morning"
                : new Date().getHours() < 17
                  ? "Afternoon"
                  : "Evening"}
              <Box
                component="span"
                sx={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                .
              </Box>
            </Typography>
            <Typography
              sx={{
                color: "text.secondary",
                fontSize: "0.875rem",
                maxWidth: 500,
              }}
            >
              Your 360° view across global markets, equities, crypto,
              commodities & more.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ─── CTA Banner ──────────────────────────────────── */}
      {!isAuthenticated && (
        <Box
          sx={{
            mb: 4,
            p: 2.5,
            borderRadius: "14px",
            background: (t) =>
              t.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)"
                : "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)",
            border: (t) =>
              `1px solid ${t.palette.mode === "dark" ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.2)"}`,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: { sm: 1 } }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: "rgba(99,102,241,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Rocket sx={{ fontSize: 20, color: "#818cf8" }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "text.primary",
                }}
              >
                Unlock personalized watchlists & advanced screening
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
                Create a free account to save your preferences
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate("/register")}
            endIcon={<ArrowForward sx={{ fontSize: 16, display: { xs: "none", sm: "block" } }} />}
            sx={{
              fontSize: "0.75rem",
              px: 2.5,
              whiteSpace: "nowrap",
              alignSelf: { xs: "stretch", sm: "auto" },
            }}
          >
            Get Started
          </Button>
        </Box>
      )}

      {/* ─── Market Overview Grid ────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Live Markets
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label="REAL-TIME"
              size="small"
              sx={{
                height: 18,
                fontSize: "0.55rem",
                fontWeight: 800,
                bgcolor: "rgba(16,185,129,0.1)",
                color: "#10b981",
                borderRadius: "4px",
                "& .MuiChip-label": { px: 0.8 },
                letterSpacing: "0.05em",
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#10b981",
                animation: "pulse 2s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.4 },
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontSize: "0.65rem" }}
            >
              {lastUpdate.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </Typography>
          </Box>
        </Box>

        {loading && indices.length === 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {[...Array(8)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  bgcolor: "action.hover",
                  border: (t) => `1px solid ${t.palette.divider}`,
                }}
              >
                <Skeleton
                  variant="text"
                  width={60}
                  height={14}
                  sx={{ mb: 1, bgcolor: "action.hover" }}
                />
                <Skeleton
                  variant="text"
                  width={120}
                  height={28}
                  sx={{ mb: 1, bgcolor: "action.hover" }}
                />
                <Skeleton
                  variant="text"
                  width={80}
                  height={14}
                  sx={{ bgcolor: "action.hover" }}
                />
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {stats.map((stat, index) => (
              <Box
                key={index}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  bgcolor: (t) =>
                    t.palette.mode === "dark"
                      ? "rgba(17,24,39,0.7)"
                      : "background.paper",
                  border: (t) => `1px solid ${t.palette.divider}`,
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  animation: "fadeInUp 0.5s ease both",
                  animationDelay: `${index * 0.05}s`,
                  "&:hover": {
                    borderColor: (t) =>
                      t.palette.mode === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.12)",
                    bgcolor: (t) =>
                      t.palette.mode === "dark"
                        ? "rgba(17,24,39,0.9)"
                        : "background.paper",
                    transform: "translateY(-2px)",
                    boxShadow: (t) =>
                      t.palette.mode === "dark"
                        ? "0 8px 32px rgba(0,0,0,0.3)"
                        : "0 8px 32px rgba(0,0,0,0.08)",
                  },
                }}
              >
                {/* Top Row: Symbol + Sparkline */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "text.secondary",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {stat.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        color: "text.disabled",
                        mt: 0.2,
                        lineHeight: 1.2,
                        maxWidth: 120,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {stat.subtitle}
                    </Typography>
                  </Box>
                  <MiniSparkline positive={stat.isPositive} />
                </Box>

                {/* Value */}
                <Typography
                  sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    color: "text.primary",
                    letterSpacing: "-0.02em",
                    my: 0.5,
                  }}
                >
                  {stat.value}
                </Typography>

                {/* Change */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.3,
                      px: 0.8,
                      py: 0.2,
                      borderRadius: "6px",
                      bgcolor: stat.isPositive
                        ? "rgba(16,185,129,0.08)"
                        : "rgba(239,68,68,0.08)",
                    }}
                  >
                    {stat.isPositive ? (
                      <TrendingUp sx={{ fontSize: 13, color: "#10b981" }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 13, color: "#ef4444" }} />
                    )}
                    <Typography
                      sx={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: stat.isPositive ? "#10b981" : "#ef4444",
                      }}
                    >
                      {stat.change}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      color: "text.disabled",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {stat.changeValue}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* ─── Quick Access Grid ───────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}
        >
          Explore Markets
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              sm: "repeat(3, 1fr)",
              md: "repeat(6, 1fr)",
            },
            gap: 2,
          }}
        >
          {quickAccess.map((item, i) => (
            <Box
              key={item.title}
              onClick={() => navigate(item.path)}
              sx={{
                p: 2.5,
                borderRadius: "14px",
                background: item.gradient,
                border: (t) => `1px solid ${t.palette.divider}`,
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                textAlign: "center",
                animation: "fadeInUp 0.5s ease both",
                animationDelay: `${i * 0.06}s`,
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: (t) =>
                    t.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.15)",
                  boxShadow: (t) =>
                    t.palette.mode === "dark"
                      ? "0 12px 40px rgba(0,0,0,0.3)"
                      : "0 12px 40px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 1.5,
                  color: item.iconColor,
                }}
              >
                {item.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 0.3,
                }}
              >
                {item.title}
              </Typography>
              <Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }}>
                {item.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ─── Platform Features ───────────────────────────── */}
      <Box
        sx={{
          p: { xs: 2.5, sm: 3, md: 4 },
          borderRadius: "16px",
          border: (t) => `1px solid ${t.palette.divider}`,
          background: (t) =>
            t.palette.mode === "dark"
              ? "rgba(17,24,39,0.5)"
              : alpha(theme.palette.background.paper, 0.7),
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="overline"
            sx={{ color: "#6366f1", fontSize: "0.6rem", fontWeight: 700 }}
          >
            WHY FINSIEVE
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "text.primary", mt: 0.5 }}
          >
            One Platform. Every Market.
          </Typography>
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: "0.8125rem",
              mt: 1,
              maxWidth: 500,
              mx: "auto",
            }}
          >
            Stop juggling between Zerodha, CoinDCX, and Yahoo Finance.
            Everything you need, beautifully unified.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {[
            {
              icon: <ShowChart sx={{ fontSize: 28 }} />,
              title: "8+ Asset Classes",
              desc: "Track Indian & US equities, mutual funds, bonds, commodities, crypto & more in one place",
              color: "#6366f1",
            },
            {
              icon: <Speed sx={{ fontSize: 28 }} />,
              title: "Real-time Data",
              desc: "Live market updates with sub-second refresh across all instruments globally",
              color: "#10b981",
            },
            {
              icon: <Insights sx={{ fontSize: 28 }} />,
              title: "Smart Screening",
              desc: "50+ filters across all asset classes. Find the perfect investment in seconds",
              color: "#8b5cf6",
            },
          ].map((feature, i) => (
            <Box
              key={i}
              sx={{
                p: 3,
                borderRadius: "14px",
                border: (t) => `1px solid ${t.palette.divider}`,
                bgcolor: "action.hover",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: `${feature.color}33`,
                  bgcolor: `${feature.color}08`,
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "14px",
                  bgcolor: `${feature.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: feature.color,
                  mb: 2,
                }}
              >
                {feature.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "text.primary",
                  mb: 1,
                }}
              >
                {feature.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.8125rem",
                  color: "text.secondary",
                  lineHeight: 1.6,
                }}
              >
                {feature.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
