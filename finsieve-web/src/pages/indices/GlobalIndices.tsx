import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  alpha,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  CurrencyExchange,
  Public,
} from "@mui/icons-material";
import globalIndicesService, {
  type GlobalIndex,
  type CurrencyRate,
} from "../../services/indices/globalIndicesService";
import toast from "react-hot-toast";
import { useRealTimeIndices } from "../../hooks/useRealTimeIndices";
import ChartModal from "../../components/charts/ChartModal";
import { resolveChartSymbol } from "../../components/charts/chartSymbols";

const REGIONS = [
  { key: "all", label: "All Regions", emoji: "🌍" },
  { key: "asia", label: "Asia Pacific", emoji: "🌏" },
  { key: "europe", label: "Europe", emoji: "🇪🇺" },
  { key: "americas", label: "Americas", emoji: "🌎" },
];

const COUNTRY_FLAGS: Record<string, string> = {
  "United States": "🇺🇸",
  US: "🇺🇸",
  "United Kingdom": "🇬🇧",
  UK: "🇬🇧",
  Germany: "🇩🇪",
  France: "🇫🇷",
  Japan: "🇯🇵",
  "Hong Kong": "🇭🇰",
  China: "🇨🇳",
  "South Korea": "🇰🇷",
  Taiwan: "🇹🇼",
  Australia: "🇦🇺",
  Singapore: "🇸🇬",
  India: "🇮🇳",
  Spain: "🇪🇸",
  Canada: "🇨🇦",
  Brazil: "🇧🇷",
  Mexico: "🇲🇽",
  Indonesia: "🇮🇩",
  Europe: "🇪🇺",
  Global: "🌐",
};

const GlobalIndices = () => {
  const [indices, setIndices] = useState<GlobalIndex[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeRegion, setActiveRegion] = useState(0);

  // Chart modal state
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);
  const [chartTitle,  setChartTitle]  = useState("");
  const [chartIdx,    setChartIdx]    = useState<GlobalIndex | null>(null);

  // Real-time WS updates (pushes "all" country updates from global scheduler)
  const { indices: liveIndices, lastUpdate: liveUpdate } =
    useRealTimeIndices("all");

  const openChart = (idx: GlobalIndex) => {
    setChartSymbol(resolveChartSymbol(idx.symbol, idx.country));
    setChartTitle(idx.name);
    setChartIdx(idx);
  };

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      const [indRes, curRes] = await Promise.all([
        globalIndicesService.getAllIndices(),
        globalIndicesService.getCurrencies(),
      ]);

      const id = indRes as { data?: GlobalIndex[] };
      const cd = curRes as { data?: CurrencyRate[] };
      if (id?.data) setIndices(id.data);
      if (cd?.data) setCurrencies(cd.data);
    } catch (error) {
      console.error("Error fetching global indices:", error);
      if (isInitial) toast.error("Failed to load global indices");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 60000); // fallback poll
    return () => clearInterval(interval);
  }, [fetchData]);

  // Merge live WS data on top of REST snapshot
  useEffect(() => {
    if (!liveIndices.length) return;
    setIndices(liveIndices as unknown as GlobalIndex[]);
  }, [liveIndices, liveUpdate]);

  const fmt = (n: number) =>
    n?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Region grouping helper
  const asiaCountries = [
    "Japan",
    "Hong Kong",
    "China",
    "South Korea",
    "Taiwan",
    "Australia",
    "Singapore",
    "India",
    "Indonesia",
  ];
  const europeCountries = ["UK", "Germany", "France", "Spain", "Europe"];
  const americasCountries = ["United States", "US", "Canada", "Brazil", "Mexico"];

  const getRegionIndices = () => {
    const region = REGIONS[activeRegion].key;
    if (region === "all") return indices;
    if (region === "asia")
      return indices.filter((i) => asiaCountries.includes(i.country));
    if (region === "europe")
      return indices.filter((i) => europeCountries.includes(i.country));
    if (region === "americas")
      return indices.filter((i) => americasCountries.includes(i.country));
    return indices;
  };

  const filtered = getRegionIndices();

  // Market health summary
  const up = indices.filter((i) => i.change_percent > 0).length;
  const down = indices.filter((i) => i.change_percent < 0).length;

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
          Loading global market data...
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
            <Public sx={{ color: "#3b82f6" }} /> Global Indices
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {indices.length} Major Indices Worldwide • Real-time via Yahoo
            Finance
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

      {/* Market Pulse */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
          mb: 4,
        }}
      >
        <Card
          sx={{
            borderTop: "3px solid #3b82f6",
            background: `linear-gradient(135deg, ${alpha("#3b82f6", 0.06)} 0%, transparent 100%)`,
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              Total Markets
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {indices.length}
            </Typography>
          </CardContent>
        </Card>
        <Card
          sx={{
            borderTop: "3px solid #10b981",
            background: `linear-gradient(135deg, ${alpha("#10b981", 0.06)} 0%, transparent 100%)`,
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              Markets Up
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#10b981" }}>
              {up}
            </Typography>
          </CardContent>
        </Card>
        <Card
          sx={{
            borderTop: "3px solid #ef4444",
            background: `linear-gradient(135deg, ${alpha("#ef4444", 0.06)} 0%, transparent 100%)`,
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              Markets Down
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#ef4444" }}>
              {down}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Region Tabs */}
      <Tabs
        value={activeRegion}
        onChange={(_, v) => setActiveRegion(v)}
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {REGIONS.map((r) => (
          <Tab key={r.key} label={`${r.emoji} ${r.label}`} />
        ))}
      </Tabs>

      {/* Indices Grid */}
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
          mb: 4,
        }}
      >
        {filtered.map((idx) => {
          const pos = idx.change_percent >= 0;
          const clr = pos ? "#10b981" : "#ef4444";
          const flag = COUNTRY_FLAGS[idx.country] || "🏳️";
          return (
            <Card
              key={idx.symbol}
              onClick={() => openChart(idx)}
              sx={{
                "&:hover": { transform: "translateY(-3px)", boxShadow: 4 },
                transition: "all 0.2s",
                cursor: "pointer",
                borderLeft: `4px solid ${clr}`,
              }}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 0.5,
                  }}
                >
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {flag} {idx.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {idx.country} • {idx.exchange}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, my: 1 }}>
                  {fmt(idx.current_value)}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {pos ? (
                      <TrendingUp sx={{ fontSize: 16, color: clr }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 16, color: clr }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: clr }}
                    >
                      {pos ? "+" : ""}
                      {idx.change_percent?.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: clr }}>
                    ({pos ? "+" : ""}
                    {fmt(idx.change)})
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Currencies */}
      {currencies.length > 0 && (
        <>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <CurrencyExchange sx={{ color: "#f59e0b" }} /> Forex / Currency
            Rates
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
            }}
          >
            {currencies.map((c) => {
              const pos = c.change_percent >= 0;
              const clr = pos ? "#10b981" : "#ef4444";
              return (
                <Card
                  key={c.symbol}
                  sx={{
                    borderTop: `3px solid ${clr}`,
                    "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
                    transition: "all 0.2s",
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {c.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {c.symbol?.replace("=X", "")}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, my: 0.5 }}>
                      {c.current_value?.toFixed(4)}
                    </Typography>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
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
                        {c.change_percent?.toFixed(2)}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </>
      )}
      {/* Chart Modal */}
      {chartSymbol && chartIdx && (
        <ChartModal
          open={!!chartSymbol}
          onClose={() => { setChartSymbol(null); setChartIdx(null); }}
          symbol={chartSymbol}
          title={chartTitle}
          country={chartIdx.country}
          ltp={Number(chartIdx.current_value)}
          change={Number(chartIdx.change)}
          changePercent={Number(chartIdx.change_percent)}
        />
      )}
    </Box>
  );
};

export default GlobalIndices;
