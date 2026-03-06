import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Warning,
} from "@mui/icons-material";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import bondsService, {
  type Bond,
  type YieldCurveData,
} from "../../services/bonds/bondsService";
import toast from "react-hot-toast";

const Bonds = () => {
  const theme = useTheme();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [yieldCurve, setYieldCurve] = useState<YieldCurveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      const [bondsRes, ycRes] = await Promise.all([
        bondsService.getAllBonds(),
        bondsService.getYieldCurve(),
      ]);

      const bd = bondsRes as { data?: Bond[] };
      const yd = ycRes as { data?: YieldCurveData };
      if (bd?.data) setBonds(bd.data);
      if (yd?.data) setYieldCurve(yd.data);
    } catch (error) {
      console.error("Error fetching bonds data:", error);
      if (isInitial) toast.error("Failed to load bonds data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 300000); // 5min refresh
    return () => clearInterval(interval);
  }, [fetchData]);

  const fmt = (n: number, d = 3) =>
    n?.toLocaleString("en-US", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });

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
          Loading bonds & treasury data...
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
            🏛️ India Bonds & G-Sec
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            India Government Securities • RBI Reference Rates • Yield Curve
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Refresh">
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

      {/* Inversion Alert */}
      {yieldCurve?.isInverted && (
        <Alert
          severity="warning"
          icon={<Warning />}
          sx={{
            mb: 3,
            fontWeight: 600,
            bgcolor: alpha("#f59e0b", 0.08),
            border: `1px solid ${alpha("#f59e0b", 0.3)}`,
          }}
        >
          ⚠️ Yield Curve Inversion Detected - The 2-year G-Sec yield exceeds the
          10-year yield. This may signal RBI rate cut expectations or growth slowdown.
          {yieldCurve.spread_2_10 !== null && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              2s-10s Spread:{" "}
              <strong>{yieldCurve.spread_2_10.toFixed(3)}%</strong>
            </Typography>
          )}
        </Alert>
      )}

      {/* Yield Curve Chart */}
      {yieldCurve && yieldCurve.curve?.length > 0 && (
        <Card sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            📈 India G-Sec Yield Curve
            {yieldCurve.spread_2_10 !== null && (
              <Chip
                label={`2s-10s Spread: ${yieldCurve.spread_2_10.toFixed(3)}%`}
                size="small"
                sx={{
                  ml: 2,
                  fontWeight: 700,
                  bgcolor: alpha(
                    yieldCurve.isInverted ? "#ef4444" : "#10b981",
                    0.1,
                  ),
                  color: yieldCurve.isInverted ? "#ef4444" : "#10b981",
                }}
              />
            )}
          </Typography>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={yieldCurve.curve}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={yieldCurve.isInverted ? "#ef4444" : "#3b82f6"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={yieldCurve.isInverted ? "#ef4444" : "#3b82f6"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={alpha(theme.palette.text.primary, 0.08)}
              />
              <XAxis dataKey="maturity" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => `${v.toFixed(2)}%`}
              />
              <RechartsTooltip
                contentStyle={{
                  background: theme.palette.background.paper,
                  borderRadius: 8,
                  border: `1px solid ${theme.palette.divider}`,
                }}
                formatter={(value: number | undefined) => [
                  `${(value ?? 0).toFixed(3)}%`,
                  "Yield",
                ]}
              />
              <Area
                type="monotone"
                dataKey="yield_value"
                stroke={yieldCurve.isInverted ? "#ef4444" : "#3b82f6"}
                fill="url(#yieldGrad)"
                strokeWidth={3}
                dot={{
                  fill: yieldCurve.isInverted ? "#ef4444" : "#3b82f6",
                  r: 5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Bond Cards */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        India G-Sec Yields
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: 2,
          mb: 4,
        }}
      >
        {bonds.map((b) => {
          const pos = b.change_percent >= 0;
          const clr = pos ? "#10b981" : "#ef4444";
          // Color code by maturity
          const matColors: Record<string, string> = {
            "91D":  "#3b82f6",
            "182D": "#06b6d4",
            "364D": "#8b5cf6",
            "2Y":   "#a855f7",
            "5Y":   "#f59e0b",
            "10Y":  "#ef4444",
            "30Y":  "#10b981",
          };
          const matClr = matColors[b.maturity] || "#6366f1";
          return (
            <Card
              key={b.symbol}
              sx={{
                borderTop: `4px solid ${matClr}`,
                "&:hover": { transform: "translateY(-3px)", boxShadow: 4 },
                transition: "all 0.2s",
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Chip
                    label={b.maturity}
                    size="small"
                    sx={{
                      bgcolor: alpha(matClr, 0.12),
                      color: matClr,
                      fontWeight: 800,
                    }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
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
                      {b.change_percent?.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                >
                  {b.name}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {fmt(b.yield_value || b.current_value)}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: clr, display: "block", mt: 0.5 }}
                >
                  {pos ? "+" : ""}
                  {fmt(b.change)} bps
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Educational Info */}
      <Card
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${alpha("#3b82f6", 0.04)} 0%, ${alpha("#8b5cf6", 0.04)} 100%)`,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          💡 Understanding India G-Sec Yields
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
            mt: 1,
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              What are G-Secs?
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Government Securities (G-Secs) are debt instruments issued by the
              Government of India to borrow money. They are considered the safest
              investments in India as they carry sovereign guarantee.
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              RBI Repo Rate & G-Sec Link
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              The RBI's repo rate (currently 6.25%) anchors short-term yields.
              Long-term G-Sec yields reflect inflation expectations and fiscal
              outlook. The 10-Year G-Sec is India's benchmark rate.
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              2Y–10Y Spread
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              The spread between 2-year and 10-year G-Sec yields signals market
              expectations. A flat or inverted curve may indicate slowing growth
              or RBI rate cut expectations.
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default Bonds;
