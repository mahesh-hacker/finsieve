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
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Refresh,
} from "@mui/icons-material";
import marketService, {
  type GlobalIndex,
} from "../../services/market/marketService";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useRealTimeIndices } from "../../hooks/useRealTimeIndices";

const IndianIndices = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useSelector((state: RootState) => state.auth);

  const [indices, setIndices] = useState<GlobalIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { indices: liveIndices, lastUpdate: liveUpdate } = useRealTimeIndices(
    "India",
    user?.userTier,
  );

  const fetchIndices = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);
      const res = await marketService.getIndicesByCountry("India");
      if (res?.data) {
        setIndices(res.data);
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
    const t = setInterval(() => fetchIndices(false), 20000);
    return () => clearInterval(t);
  }, [fetchIndices]);

  useEffect(() => {
    if (liveIndices.length) setIndices(liveIndices as unknown as GlobalIndex[]);
    if (liveUpdate) setLastUpdate(liveUpdate);
  }, [liveIndices, liveUpdate]);

  const fmt = (n: string | number) => {
    const num = typeof n === "string" ? parseFloat(String(n).replace(/,/g, "")) : n;
    return Number.isFinite(num)
      ? num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";
  };

  const getNum = (v: string | number): number =>
    (typeof v === "string" ? parseFloat(String(v).replace(/,/g, "")) : v) || 0;

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 12 }}>
        <CircularProgress size={48} />
        <Typography sx={{ mt: 2, color: "text.secondary" }}>Loading Indian Indices...</Typography>
      </Box>
    );
  }

  const advancers = indices.filter((i) => getNum(i.change_percent) >= 0).length;
  const decliners = indices.filter((i) => getNum(i.change_percent) < 0).length;

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
            Indian Indices
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            NSE & BSE · Live data · Updated {lastUpdate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip label={`${advancers} Up`} size="small" sx={{ bgcolor: alpha("#10b981", 0.1), color: "#10b981", fontWeight: 700, fontSize: 11 }} />
          <Chip label={`${decliners} Down`} size="small" sx={{ bgcolor: alpha("#ef4444", 0.1), color: "#ef4444", fontWeight: 700, fontSize: 11 }} />
          <Tooltip title="Refresh">
            <IconButton onClick={() => fetchIndices(false)} disabled={isRefreshing} size="small">
              <Refresh sx={{ animation: isRefreshing ? "spin 1s linear infinite" : "none", "@keyframes spin": { "100%": { transform: "rotate(360deg)" } } }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {indices.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <Typography>No indices data available. Try refreshing.</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          {indices.map((idx) => {
            const changePct = getNum(idx.change_percent);
            const pos = changePct >= 0;
            const clr = pos ? "#10b981" : "#ef4444";
            return (
              <Card
                key={idx.symbol ?? idx.name}
                sx={{
                  background: `linear-gradient(135deg, ${alpha(clr, 0.06)} 0%, ${alpha(clr, 0.02)} 100%)`,
                  borderTop: `3px solid ${clr}`,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  borderTopColor: clr,
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
                  transition: "all 0.2s",
                  cursor: "default",
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", letterSpacing: 1, textTransform: "uppercase" }}>
                    {idx.symbol ?? idx.name}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontSize: "0.65rem", mb: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {idx.name}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, my: 0.5, fontSize: "1.1rem" }}>
                    {fmt(idx.current_value)}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {pos ? <TrendingUp sx={{ fontSize: 14, color: clr }} /> : <TrendingDown sx={{ fontSize: 14, color: clr }} />}
                    <Typography variant="caption" sx={{ fontWeight: 700, color: clr }}>
                      {pos ? "+" : ""}{Number.isFinite(changePct) ? changePct.toFixed(2) : "—"}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: clr, ml: 0.5 }}>
                      ({pos ? "+" : ""}{fmt(idx.change)})
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default IndianIndices;
