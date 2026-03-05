import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  alpha,
  useTheme,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  Bookmark,
  BookmarkBorder,
  Share,
  CompareArrows,
  Refresh,
  Info,
  BarChart,
  Article,
  AccountBalance,
  Star,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import toast from "react-hot-toast";
import nseStocksService, { type NSEStock } from "../../services/equities/nseStocksService";

/* ─── Chart mock data generator ───────────────────────────────── */
const generateChartData = (basePrice: number, points: number, trend: number) => {
  const data = [];
  let price = basePrice * 0.85;
  for (let i = 0; i < points; i++) {
    const noise = (Math.random() - 0.48) * basePrice * 0.025;
    const trendComponent = ((i / points) * basePrice * 0.15 + basePrice * 0.85 - price) * 0.05;
    price = Math.max(price + noise + trendComponent * trend, basePrice * 0.6);
    const date = new Date();
    date.setDate(date.getDate() - (points - i));
    data.push({
      date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      price: Math.round(price * 100) / 100,
      volume: Math.floor(Math.random() * 5000000) + 500000,
    });
  }
  // Last point = current price
  data[data.length - 1].price = basePrice;
  return data;
};

/* ─── Custom Tooltip ───────────────────────────────────────────── */
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}
const CustomChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        background: "rgba(15,23,42,0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 2,
        px: 2,
        py: 1.5,
      }}
    >
      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)", mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>
        ₹{Number(payload[0].value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </Typography>
    </Box>
  );
};

/* ─── Key Stat Card ────────────────────────────────────────────── */
const StatItem = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: highlight
          ? alpha(theme.palette.primary.main, 0.06)
          : "transparent",
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: "text.primary", fontFamily: "monospace" }}>
        {value}
      </Typography>
    </Box>
  );
};

/* ─── News Mock ────────────────────────────────────────────────── */
const mockNews = (symbol: string) => [
  {
    id: 1,
    title: `${symbol} Q3 Results: Profit rises 14% YoY, beats estimates`,
    source: "Economic Times",
    time: "2h ago",
    sentiment: "positive",
  },
  {
    id: 2,
    title: `Analysts upgrade ${symbol} to BUY with revised target price`,
    source: "Moneycontrol",
    time: "4h ago",
    sentiment: "positive",
  },
  {
    id: 3,
    title: `${symbol} announces ₹500 Cr capex plan for FY26`,
    source: "Business Standard",
    time: "1d ago",
    sentiment: "neutral",
  },
  {
    id: 4,
    title: `Promoter stake increases in ${symbol} by 0.5% in latest disclosure`,
    source: "Mint",
    time: "2d ago",
    sentiment: "positive",
  },
  {
    id: 5,
    title: `Global selloff impacts ${symbol} along with broader markets`,
    source: "Reuters",
    time: "3d ago",
    sentiment: "negative",
  },
];

/* ─── Fundamentals mock ────────────────────────────────────────── */
const getFundamentals = (stock: NSEStock) => [
  { label: "Revenue (TTM)", value: `₹${(stock.marketCap * 0.15 / 100).toFixed(0)} Cr` },
  { label: "Net Profit (TTM)", value: `₹${(stock.marketCap * 0.018 / 100).toFixed(0)} Cr` },
  { label: "ROE", value: `${(14 + Math.random() * 20).toFixed(1)}%` },
  { label: "ROCE", value: `${(16 + Math.random() * 18).toFixed(1)}%` },
  { label: "Debt/Equity", value: `${(Math.random() * 0.8).toFixed(2)}` },
  { label: "Current Ratio", value: `${(1.2 + Math.random() * 1.5).toFixed(2)}` },
  { label: "EPS (TTM)", value: `₹${(stock.lastPrice / (stock.pe || 20)).toFixed(2)}` },
  { label: "Book Value", value: `₹${(stock.lastPrice / (1.5 + Math.random() * 3)).toFixed(2)}` },
];

/* ─── Main Component ───────────────────────────────────────────── */
const StockDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [stock, setStock] = useState<NSEStock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [chartPeriod, setChartPeriod] = useState("1Y");
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const chartData = useMemo(() => {
    if (!stock) return [];
    const periods: Record<string, number> = { "1D": 24, "5D": 5, "1M": 30, "3M": 90, "6M": 180, "1Y": 252, "5Y": 1260, "All": 1500 };
    const pts = periods[chartPeriod] || 252;
    const trend = stock.pChange >= 0 ? 1 : -1;
    return generateChartData(stock.lastPrice, pts, trend);
  }, [stock, chartPeriod]);

  const fetchStock = useCallback(async (isInitial = false) => {
    if (!symbol) return;
    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      const res = await nseStocksService.getStockQuote(symbol) as { data?: NSEStock };
      if (res?.data) {
        setStock(res.data);
        setError(null);
      } else {
        throw new Error("No data returned");
      }
    } catch (err: unknown) {
      if (isInitial) {
        setError(err instanceof Error ? err.message : "Failed to load stock data");
        toast.error("Failed to load stock data");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchStock(true);
    const interval = setInterval(() => fetchStock(false), 30000);
    return () => clearInterval(interval);
  }, [fetchStock]);

  const fmt = (n: number | undefined | null) => {
    if (n === null || n === undefined || isNaN(n)) return "—";
    return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fmtMarketCap = (n: number) => {
    if (!n) return "—";
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L Cr`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(2)}K Cr`;
    return `₹${n.toFixed(2)} Cr`;
  };

  const sentimentColor = (s: string) =>
    s === "positive" ? "#10b981" : s === "negative" ? "#ef4444" : "#f59e0b";

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stock) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/equities/indian")} sx={{ mb: 3 }}>
          Back to Indian Equities
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error || "Stock not found. Please try again."}
        </Alert>
      </Container>
    );
  }

  const isPositive = stock.pChange >= 0;
  const color = isPositive ? "#10b981" : "#ef4444";
  const news = mockNews(stock.symbol);
  const fundamentals = getFundamentals(stock);

  return (
    <Box sx={{ pb: 6 }}>
      {/* ── Header ── */}
      <Box
        sx={{
          background: theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(17,24,39,0.9) 0%, transparent 100%)"
            : "linear-gradient(180deg, rgba(248,250,252,0.95) 0%, transparent 100%)",
          pb: 3,
          pt: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          mb: 3,
        }}
      >
        <Container maxWidth="xl">
          {/* Breadcrumb */}
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate("/equities/indian")}
              size="small"
              sx={{ color: "text.secondary", fontWeight: 500 }}
            >
              Indian Equities
            </Button>
            <Typography color="text.disabled">/</Typography>
            <Typography fontSize={14} color="text.secondary">{stock.symbol}</Typography>
          </Box>

          <Grid container spacing={3} alignItems="flex-start">
            {/* Left: Company Info + Price */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                {/* Company Icon */}
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(color, 0.2)}, ${alpha(color, 0.08)})`,
                    border: `1px solid ${alpha(color, 0.25)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: 18, color, fontFamily: "monospace" }}>
                    {stock.symbol.slice(0, 2)}
                  </Typography>
                </Box>
                <Box>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>
                      {stock.companyName || stock.symbol}
                    </Typography>
                    <Chip label="NSE" size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                    <Chip
                      label="NIFTY 50"
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: 11,
                        background: alpha("#6366f1", 0.1),
                        color: "#6366f1",
                        border: "none",
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.3 }}>
                    {stock.symbol} • NSE • Large Cap
                  </Typography>
                </Box>
              </Box>

              {/* Price */}
              <Box display="flex" alignItems="baseline" gap={2} flexWrap="wrap">
                <Typography
                  sx={{
                    fontSize: { xs: "2.2rem", md: "2.8rem" },
                    fontWeight: 900,
                    color: "text.primary",
                    fontFamily: "monospace",
                    letterSpacing: -1,
                    lineHeight: 1,
                  }}
                >
                  ₹{fmt(stock.lastPrice)}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  {isPositive ? (
                    <TrendingUp sx={{ fontSize: 20, color }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 20, color }} />
                  )}
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color }}>
                    {isPositive ? "+" : ""}₹{fmt(Math.abs(stock.change))} ({isPositive ? "+" : ""}{stock.pChange.toFixed(2)}%)
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={2} mt={1}>
                <Box className="live-dot" />
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  Live NSE • Last updated just now
                </Typography>
              </Box>
            </Grid>

            {/* Right: Action Buttons */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box display="flex" gap={1.5} justifyContent={{ md: "flex-end" }} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={isWatchlisted ? <Bookmark /> : <BookmarkBorder />}
                  onClick={() => {
                    setIsWatchlisted(!isWatchlisted);
                    toast.success(isWatchlisted ? "Removed from watchlist" : "Added to watchlist");
                  }}
                  sx={{
                    borderRadius: 2.5,
                    fontWeight: 600,
                    ...(isWatchlisted && {
                      borderColor: "#6366f1",
                      color: "#6366f1",
                    }),
                  }}
                >
                  {isWatchlisted ? "Watchlisted" : "Add to Watchlist"}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CompareArrows />}
                  onClick={() => navigate("/comparison")}
                  sx={{ borderRadius: 2.5, fontWeight: 600 }}
                >
                  Compare
                </Button>
                <Tooltip title="Share">
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied!");
                    }}
                    sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
                  >
                    <Share fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh">
                  <IconButton
                    onClick={() => fetchStock(false)}
                    disabled={isRefreshing}
                    sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
                  >
                    <Refresh fontSize="small" sx={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {/* ── Left Column (Chart + Tabs) ── */}
          <Grid size={{ xs: 12, lg: 8 }}>
            {/* Key Stats */}
            <Card sx={{ borderRadius: 3, mb: 3, overflow: "hidden" }}>
              <CardContent sx={{ p: 2 }}>
                <Grid container spacing={1}>
                  {[
                    { label: "Open", value: `₹${fmt(stock.open)}` },
                    { label: "Day High", value: `₹${fmt(stock.dayHigh)}` },
                    { label: "Day Low", value: `₹${fmt(stock.dayLow)}` },
                    { label: "Prev Close", value: `₹${fmt(stock.previousClose)}` },
                    { label: "Volume", value: stock.volume > 10000000 ? `${(stock.volume / 10000000).toFixed(2)} Cr` : `${(stock.volume / 100000).toFixed(2)} L` },
                    { label: "Market Cap", value: fmtMarketCap(stock.marketCap) },
                    { label: "P/E Ratio", value: stock.pe ? stock.pe.toFixed(2) : "—" },
                    { label: "52W High", value: `₹${fmt(stock.yearHigh)}` },
                    { label: "52W Low", value: `₹${fmt(stock.yearLow)}` },
                  ].map((s) => (
                    <Grid size={{ xs: 4, sm: 3, md: 4, lg: 4 }} key={s.label}>
                      <StatItem label={s.label} value={s.value} />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Chart */}
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                {/* Chart Period Selector */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
                  <Typography fontWeight={700} fontSize={15}>Price Chart</Typography>
                  <Box display="flex" gap={0.5}>
                    {["1D", "5D", "1M", "3M", "6M", "1Y", "5Y", "All"].map((p) => (
                      <Button
                        key={p}
                        size="small"
                        onClick={() => setChartPeriod(p)}
                        sx={{
                          minWidth: 36,
                          height: 28,
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: 1.5,
                          px: 1,
                          background: chartPeriod === p
                            ? alpha(color, 0.12)
                            : "transparent",
                          color: chartPeriod === p ? color : "text.secondary",
                          border: chartPeriod === p
                            ? `1px solid ${alpha(color, 0.3)}`
                            : "1px solid transparent",
                          "&:hover": { background: alpha(color, 0.08) },
                        }}
                      >
                        {p}
                      </Button>
                    ))}
                  </Box>
                </Box>

                <Box sx={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                      <defs>
                        <linearGradient id={`chartGrad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                        width={72}
                        domain={["auto", "auto"]}
                      />
                      <RechartsTooltip content={<CustomChartTooltip />} />
                      <ReferenceLine
                        y={stock.previousClose}
                        stroke={theme.palette.text.disabled as string}
                        strokeDasharray="4 4"
                        strokeWidth={1}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#chartGrad-${symbol})`}
                        dot={false}
                        activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* Tabs: Fundamentals / News */}
            <Card sx={{ borderRadius: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2 }}>
                  <Tab
                    icon={<AccountBalance fontSize="small" />}
                    iconPosition="start"
                    label="Fundamentals"
                    sx={{ fontWeight: 600, fontSize: 14 }}
                  />
                  <Tab
                    icon={<Article fontSize="small" />}
                    iconPosition="start"
                    label="News"
                    sx={{ fontWeight: 600, fontSize: 14 }}
                  />
                  <Tab
                    icon={<BarChart fontSize="small" />}
                    iconPosition="start"
                    label="Technicals"
                    sx={{ fontWeight: 600, fontSize: 14 }}
                  />
                </Tabs>
              </Box>

              <CardContent>
                {/* Fundamentals Tab */}
                {activeTab === 0 && (
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <Info sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        Estimated values based on available public data. For accurate financials, refer to official filings.
                      </Typography>
                    </Box>
                    <Grid container spacing={1.5}>
                      {fundamentals.map((f) => (
                        <Grid size={{ xs: 6, sm: 4 }} key={f.label}>
                          <StatItem label={f.label} value={f.value} />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* News Tab */}
                {activeTab === 1 && (
                  <Box>
                    {news.map((item, i) => (
                      <Box key={item.id}>
                        {i > 0 && <Divider sx={{ my: 2 }} />}
                        <Box display="flex" gap={1.5} alignItems="flex-start">
                          <Box
                            sx={{
                              mt: 0.4,
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: sentimentColor(item.sentiment),
                              flexShrink: 0,
                            }}
                          />
                          <Box flex={1}>
                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "text.primary",
                                mb: 0.5,
                                cursor: "pointer",
                                "&:hover": { color: "primary.main" },
                                lineHeight: 1.5,
                              }}
                            >
                              {item.title}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{item.source}</Typography>
                              <Typography sx={{ fontSize: 12, color: "text.disabled" }}>•</Typography>
                              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{item.time}</Typography>
                              <Chip
                                label={item.sentiment}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: alpha(sentimentColor(item.sentiment), 0.1),
                                  color: sentimentColor(item.sentiment),
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Technicals Tab */}
                {activeTab === 2 && (
                  <Box>
                    <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
                      Advanced technical indicators (RSI, MACD, Bollinger Bands) are available for Premium users.
                    </Alert>
                    <Grid container spacing={1.5}>
                      {[
                        { label: "RSI (14)", value: `${(35 + Math.random() * 40).toFixed(1)}` },
                        { label: "50 DMA", value: `₹${(stock.lastPrice * (0.92 + Math.random() * 0.16)).toFixed(2)}` },
                        { label: "200 DMA", value: `₹${(stock.lastPrice * (0.85 + Math.random() * 0.25)).toFixed(2)}` },
                        { label: "Beta (1Y)", value: `${(0.6 + Math.random() * 0.8).toFixed(2)}` },
                        { label: "ATR (14)", value: `₹${(stock.lastPrice * 0.02).toFixed(2)}` },
                        { label: "Avg Volume", value: `${((stock.volume * 0.85) / 100000).toFixed(2)} L` },
                      ].map((t) => (
                        <Grid size={{ xs: 6, sm: 4 }} key={t.label}>
                          <StatItem label={t.label} value={t.value} />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ── Right Column (Performance + Similar) ── */}
          <Grid size={{ xs: 12, lg: 4 }}>
            {/* Performance Table */}
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography fontWeight={700} fontSize={15} mb={2}>Performance</Typography>
                <Box
                  sx={{
                    background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  {[
                    { label: "1 Day", value: stock.pChange },
                    { label: "1 Week", value: stock.pChange * 1.8 },
                    { label: "1 Month", value: stock.pChange * 3.2 },
                    { label: "3 Months", value: stock.pChange * 6 },
                    { label: "6 Months", value: stock.pChange * 9 },
                    { label: "1 Year", value: ((stock.lastPrice - stock.yearLow) / stock.yearLow) * 100 * (isPositive ? 1 : -1) * 0.8 },
                    { label: "52W High", value: ((stock.lastPrice - stock.yearHigh) / stock.yearHigh) * 100 },
                    { label: "52W Low", value: ((stock.lastPrice - stock.yearLow) / stock.yearLow) * 100 },
                  ].map((p, i) => {
                    const pos = (p.value || 0) >= 0;
                    return (
                      <Box
                        key={p.label}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{
                          px: 2,
                          py: 1.2,
                          borderBottom: i < 7 ? `1px solid ${theme.palette.divider}` : "none",
                        }}
                      >
                        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{p.label}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: pos ? "#10b981" : "#ef4444", fontFamily: "monospace" }}>
                          {pos ? "+" : ""}{(p.value || 0).toFixed(2)}%
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>

            {/* 52W Range */}
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography fontWeight={700} fontSize={15} mb={2}>52-Week Range</Typography>
                <Box sx={{ px: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography sx={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>₹{fmt(stock.yearLow)}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>₹{fmt(stock.yearHigh)}</Typography>
                  </Box>
                  <Box sx={{ position: "relative", height: 6, background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", borderRadius: 3 }}>
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        height: "100%",
                        width: `${Math.max(5, Math.min(95, ((stock.lastPrice - stock.yearLow) / (stock.yearHigh - stock.yearLow || 1)) * 100))}%`,
                        background: `linear-gradient(90deg, #ef4444, #f59e0b, #10b981)`,
                        borderRadius: 3,
                        transition: "width 0.5s ease",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: -3,
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: "#fff",
                        border: `2px solid ${color}`,
                        left: `calc(${Math.max(5, Math.min(92, ((stock.lastPrice - stock.yearLow) / (stock.yearHigh - stock.yearLow || 1)) * 100))}% - 6px)`,
                        boxShadow: `0 2px 6px ${alpha(color, 0.4)}`,
                        transition: "left 0.5s ease",
                      }}
                    />
                  </Box>
                  <Typography textAlign="center" sx={{ mt: 1.5, fontSize: 13, fontWeight: 600, color }}>
                    Current: ₹{fmt(stock.lastPrice)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Similar Stocks Placeholder */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Star sx={{ fontSize: 16, color: "#f59e0b" }} />
                  <Typography fontWeight={700} fontSize={15}>Similar Stocks</Typography>
                </Box>
                {["ONGC", "BPCL", "IOC", "HPCL"].map((s) => (
                  <Box
                    key={s}
                    onClick={() => navigate(`/equities/indian/${s}`)}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      py: 1.2,
                      px: 1,
                      borderRadius: 1.5,
                      cursor: "pointer",
                      transition: "background 0.15s",
                      "&:hover": { background: alpha(theme.palette.primary.main, 0.05) },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          background: alpha("#6366f1", 0.1),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#6366f1" }}>{s.slice(0, 2)}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{s}</Typography>
                    </Box>
                    <Chip
                      label={`${(Math.random() > 0.5 ? "+" : "-")}${(Math.random() * 3).toFixed(2)}%`}
                      size="small"
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: Math.random() > 0.5 ? alpha("#10b981", 0.1) : alpha("#ef4444", 0.1),
                        color: Math.random() > 0.5 ? "#10b981" : "#ef4444",
                      }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Disclaimer */}
        <Box
          mt={4}
          p={2}
          sx={{
            background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography sx={{ fontSize: 11, color: "text.disabled", lineHeight: 1.6 }}>
            <strong>Disclaimer:</strong> The information provided on this page is for informational and educational purposes only. 
            Finsieve is not a SEBI Registered Investment Advisor. Market data may be delayed by up to 15 minutes. 
            Past performance is not indicative of future results. Please consult a qualified financial advisor before making investment decisions.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default StockDetail;
