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
  Tabs,
  Tab,
} from "@mui/material";
import { TrendingUp, TrendingDown, Refresh } from "@mui/icons-material";
import commoditiesService, {
  type Commodity,
} from "../../services/commodities/commoditiesService";
import toast from "react-hot-toast";

const CATEGORY_CONFIG: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  all: { label: "All", emoji: "📊", color: "#3b82f6" },
  "Precious Metals": {
    label: "Precious Metals",
    emoji: "🥇",
    color: "#f59e0b",
  },
  Energy: { label: "Energy", emoji: "⛽", color: "#ef4444" },
  Agriculture: { label: "Agriculture", emoji: "🌾", color: "#10b981" },
  Industrial: { label: "Industrial Metals", emoji: "🔩", color: "#6366f1" },
};

const Commodities = () => {
  const theme = useTheme();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      const res = await commoditiesService.getAllCommodities() as { data?: Commodity[] };
      if (res?.data) setCommodities(res.data);
    } catch (error) {
      console.error("Error fetching commodities:", error);
      if (isInitial) toast.error("Failed to load commodities data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const fmt = (n: number, d = 2) =>
    n?.toLocaleString("en-US", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });

  const filtered =
    activeCategory === "all"
      ? commodities
      : commodities.filter((c) => c.category === activeCategory);

  // Group by category for summary
  const categories = Object.keys(CATEGORY_CONFIG).filter((k) => k !== "all");
  const categorySummary = categories.map((cat) => {
    const items = commodities.filter((c) => c.category === cat);
    const avgChange = items.length
      ? items.reduce((sum, c) => sum + (c.change_percent || 0), 0) /
        items.length
      : 0;
    return { category: cat, count: items.length, avgChange };
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
          Loading commodities data...
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
            🏦 Commodities
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Precious Metals • Energy • Agriculture • Industrial Metals
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

      {/* Category Summary Cards */}
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
        {categorySummary.map((cs) => {
          const cfg = CATEGORY_CONFIG[cs.category];
          const pos = cs.avgChange >= 0;
          return (
            <Card
              key={cs.category}
              onClick={() => setActiveCategory(cs.category)}
              sx={{
                background: `linear-gradient(135deg, ${alpha(cfg.color, 0.08)} 0%, transparent 100%)`,
                borderTop: `3px solid ${cfg.color}`,
                cursor: "pointer",
                outline:
                  activeCategory === cs.category
                    ? `2px solid ${cfg.color}`
                    : "none",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
                transition: "all 0.2s",
              }}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {cfg.emoji} {cfg.label}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {cs.count} items
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 0.5,
                  }}
                >
                  {pos ? (
                    <TrendingUp sx={{ fontSize: 14, color: "#10b981" }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 14, color: "#ef4444" }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: pos ? "#10b981" : "#ef4444" }}
                  >
                    Avg: {pos ? "+" : ""}
                    {cs.avgChange.toFixed(2)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Category Tabs */}
      <Tabs
        value={Object.keys(CATEGORY_CONFIG).indexOf(activeCategory)}
        onChange={(_, v) => setActiveCategory(Object.keys(CATEGORY_CONFIG)[v])}
        sx={{ mb: 2 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <Tab key={key} label={`${cfg.emoji} ${cfg.label}`} />
        ))}
      </Tabs>

      {/* Commodities Grid */}
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
        {filtered.map((c) => {
          const pos = c.change_percent >= 0;
          const clr = pos ? "#10b981" : "#ef4444";
          const catCfg = CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.all;
          return (
            <Card
              key={c.symbol}
              sx={{
                "&:hover": { transform: "translateY(-3px)", boxShadow: 4 },
                transition: "all 0.2s",
                cursor: "pointer",
                borderLeft: `4px solid ${catCfg.color}`,
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {c.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {c.symbol?.replace("=F", "")} • {c.unit || "USD"}
                    </Typography>
                  </Box>
                  <Chip
                    label={catCfg.label}
                    size="small"
                    sx={{
                      bgcolor: alpha(catCfg.color, 0.1),
                      color: catCfg.color,
                      fontWeight: 600,
                      fontSize: "0.65rem",
                    }}
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, my: 1 }}>
                  ${fmt(c.current_value)}
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
                      {c.change_percent?.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: clr }}>
                    ({pos ? "+" : ""}
                    {fmt(c.change)})
                  </Typography>
                </Box>
                {/* High / Low bar */}
                <Box sx={{ mt: 1.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.25,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontSize: "0.65rem" }}
                    >
                      L: ${fmt(c.low)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontSize: "0.65rem" }}
                    >
                      H: ${fmt(c.high)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 4,
                      bgcolor: alpha(theme.palette.text.primary, 0.08),
                      borderRadius: 2,
                      position: "relative",
                    }}
                  >
                    {c.high > c.low && (
                      <Box
                        sx={{
                          position: "absolute",
                          left: `${((c.current_value - c.low) / (c.high - c.low)) * 100}%`,
                          top: -2,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: theme.palette.primary.main,
                          transform: "translateX(-50%)",
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
      {filtered.length === 0 && (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            No commodities data available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Commodities;
