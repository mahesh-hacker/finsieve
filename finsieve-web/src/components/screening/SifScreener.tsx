/**
 * SIF Screener — Specialized Investment Funds (Min ₹10 Lakh)
 * IndianEquities-style UX: search, strategy chips, sortable table, CSV export, grid/table toggle
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Chip,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputBase,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Search,
  Download,
  ViewList,
  GridView,
  ArrowUpward,
  ArrowDownward,
  UnfoldMore,
  Close,
} from "@mui/icons-material";
import screeningService from "../../services/screening/screeningService";

type SifRow = {
  name: string;
  fund_house: string;
  strategy: string;
  risk_band: string;
  min_investment: number;
  aum_cr: number;
  returns_1y: number;
  returns_3y: number;
  alpha: number;
  sharpe: number;
  max_drawdown: number;
  redemption: string;
  exit_load: number;
};

type SortField = "name" | "aum_cr" | "returns_1y" | "returns_3y" | "alpha" | "sharpe" | "max_drawdown";
type SortDir = "asc" | "desc";
type View = "table" | "grid";

const SIF_STRATEGIES = ["All", "Multi-Asset", "Long Short", "Absolute Return", "Thematic", "Quantitative", "Sector"];

const RISK_COLORS: Record<string, string> = {
  Low: "#10b981",
  Moderate: "#f59e0b",
  "Moderately High": "#f97316",
  High: "#ef4444",
};

const STRATEGY_COLORS: Record<string, string> = {
  "Multi-Asset": "#6366f1",
  "Long Short": "#ef4444",
  "Absolute Return": "#10b981",
  Thematic: "#f59e0b",
  Quantitative: "#3b82f6",
  Sector: "#8b5cf6",
};

function fmt(v: number | undefined, decimals = 2, suffix = "") {
  if (v == null || isNaN(Number(v))) return "—";
  return Number(v).toFixed(decimals) + suffix;
}

function retColor(v: number | undefined): { value: string; color: string } | string {
  if (v == null || isNaN(Number(v))) return "—";
  const n = Number(v);
  return { value: (n >= 0 ? "+" : "") + n.toFixed(2) + "%", color: n >= 0 ? "#10b981" : "#ef4444" };
}

function exportCSV(rows: SifRow[]) {
  const header = "Name,Fund House,Strategy,Risk Band,Min Investment,AUM (Cr),1Y Return (%),3Y Return (%),Alpha,Sharpe,Max Drawdown (%)\n";
  const body = rows
    .map((r) => `"${r.name}","${r.fund_house}",${r.strategy},${r.risk_band},${r.min_investment},${r.aum_cr},${r.returns_1y},${r.returns_3y},${r.alpha},${r.sharpe},${r.max_drawdown}`)
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sif_funds.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const SortIcon = ({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) => {
  if (field !== sortField) return <UnfoldMore sx={{ fontSize: 14, opacity: 0.3 }} />;
  return sortDir === "asc"
    ? <ArrowUpward sx={{ fontSize: 14, color: "#6366f1" }} />
    : <ArrowDownward sx={{ fontSize: 14, color: "#6366f1" }} />;
};

const getStrategyKey = (strategy: string) =>
  SIF_STRATEGIES.find((s) => s !== "All" && strategy?.toLowerCase().includes(s.toLowerCase())) ?? "";

const SifScreener = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [data, setData] = useState<SifRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [strategy, setStrategy] = useState("All");
  const [sortField, setSortField] = useState<SortField>("returns_1y");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [view, setView] = useState<View>("table");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resp = await screeningService.screenByAssetClass("SIF", undefined, undefined, 500);
        const items = ((resp as unknown as { data: SifRow[] }).data) || [];
        setData(items);
      } catch {
        setError("Failed to load SIF data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data
      .filter((r) => {
        if (strategy !== "All" && getStrategyKey(r.strategy) !== strategy) return false;
        if (q && !r.name?.toLowerCase().includes(q) && !r.fund_house?.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortField === "name") {
          const cmp = (a.name || "").localeCompare(b.name || "");
          return sortDir === "asc" ? cmp : -cmp;
        }
        const cmp = (Number(a[sortField]) || 0) - (Number(b[sortField]) || 0);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [data, search, strategy, sortField, sortDir]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else setSortDir("desc");
      return field;
    });
  }, []);

  const strategyCounts = useMemo(() => {
    const m: Record<string, number> = { All: data.length };
    data.forEach((r) => {
      const key = getStrategyKey(r.strategy);
      if (key) m[key] = (m[key] || 0) + 1;
    });
    return m;
  }, [data]);

  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableCell
      onClick={() => handleSort(field)}
      sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {label}
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </Box>
    </TableCell>
  );

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 24 } }}>SIF</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Specialized Investment Funds · Min ₹10 Lakh · {data.length} funds
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2, alignItems: "center" }}>
        <Box
          sx={{
            display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: 2,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            flex: "1 1 220px", minWidth: 180, maxWidth: 340,
          }}
        >
          <Search sx={{ fontSize: 18, color: "text.secondary" }} />
          <InputBase value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by fund name or house..." sx={{ fontSize: 13, flex: 1 }} />
          {search && (
            <IconButton size="small" onClick={() => setSearch("")} sx={{ p: 0.25 }}>
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Export to CSV">
            <IconButton size="small" onClick={() => exportCSV(filtered)}
              sx={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, borderRadius: 2 }}>
              <Download sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small"
            sx={{ "& .MuiToggleButton-root": { border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, px: 1.25, py: 0.5 } }}>
            <ToggleButton value="table"><ViewList sx={{ fontSize: 18 }} /></ToggleButton>
            <ToggleButton value="grid"><GridView sx={{ fontSize: 18 }} /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2.5 }}>
        {SIF_STRATEGIES.map((s) => {
          const active = strategy === s;
          const color = s === "All" ? "#6366f1" : (STRATEGY_COLORS[s] ?? "#6366f1");
          const count = strategyCounts[s] ?? 0;
          return (
            <Chip key={s} label={`${s} (${count})`} onClick={() => setStrategy(s)} size="small"
              sx={{
                fontWeight: active ? 700 : 500, fontSize: 12, cursor: "pointer",
                bgcolor: active ? alpha(color, 0.12) : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                color: active ? color : "text.secondary",
                border: active ? `1px solid ${alpha(color, 0.4)}` : "1px solid transparent",
                transition: "all 0.15s",
                "&:hover": { bgcolor: alpha(color, 0.08), color },
              }}
            />
          );
        })}
      </Box>

      {(search || strategy !== "All") && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </Typography>
          {search && <Chip label={`"${search}"`} size="small" onDelete={() => setSearch("")} sx={{ fontSize: 11 }} />}
          {strategy !== "All" && <Chip label={strategy} size="small" onDelete={() => setStrategy("All")} sx={{ fontSize: 11 }} />}
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={36} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10, color: "text.secondary" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>No SIF funds found</Typography>
          <Typography variant="body2">Try adjusting your search or filters</Typography>
        </Box>
      ) : view === "table" ? (
        <TableContainer component={Paper} elevation={0}
          sx={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, borderRadius: 2, overflowX: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.05)" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", width: 36 }}>#</TableCell>
                <SortableHeader field="name" label="Fund Name" />
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1" }}>Strategy</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1" }}>Risk</TableCell>
                <SortableHeader field="aum_cr" label="AUM (Cr)" />
                <SortableHeader field="returns_1y" label="1Y Ret" />
                <SortableHeader field="returns_3y" label="3Y Ret" />
                <SortableHeader field="alpha" label="Alpha" />
                <SortableHeader field="sharpe" label="Sharpe" />
                <SortableHeader field="max_drawdown" label="Max DD" />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((fund, idx) => {
                const stratKey = getStrategyKey(fund.strategy);
                const stratColor = STRATEGY_COLORS[stratKey] ?? "#6366f1";
                const riskColor = RISK_COLORS[fund.risk_band] ?? "#6366f1";
                const r1 = retColor(fund.returns_1y);
                const r3 = retColor(fund.returns_3y);
                return (
                  <TableRow key={fund.name + idx} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{fund.name}</Typography>
                      <Typography sx={{ fontSize: 10, color: "text.secondary" }}>{fund.fund_house}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={fund.strategy} size="small"
                        sx={{ fontSize: 10, fontWeight: 600, bgcolor: alpha(stratColor, 0.1), color: stratColor }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={fund.risk_band} size="small"
                        sx={{ fontSize: 10, fontWeight: 600, bgcolor: alpha(riskColor, 0.1), color: riskColor }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>
                      {fund.aum_cr ? `₹${Number(fund.aum_cr).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: typeof r1 === "object" ? r1.color : "text.primary" }}>
                      {typeof r1 === "object" ? r1.value : r1}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: typeof r3 === "object" ? r3.color : "text.primary" }}>
                      {typeof r3 === "object" ? r3.value : r3}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: Number(fund.alpha) >= 0 ? "#10b981" : "#ef4444" }}>
                      {fmt(fund.alpha, 1, "%")}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>{fmt(fund.sharpe, 2)}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace", color: "#ef4444" }}>{fmt(fund.max_drawdown, 1, "%")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)", lg: "repeat(4,1fr)" }, gap: 2 }}>
          {filtered.map((fund, idx) => {
            const stratKey = getStrategyKey(fund.strategy);
            const stratColor = STRATEGY_COLORS[stratKey] ?? "#6366f1";
            const riskColor = RISK_COLORS[fund.risk_band] ?? "#6366f1";
            const r1 = retColor(fund.returns_1y);
            return (
              <Paper key={fund.name + idx} elevation={0} sx={{
                p: 2, borderRadius: 2,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                borderTop: `3px solid ${stratColor}`,
                transition: "all 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
              }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Chip label={fund.strategy} size="small"
                    sx={{ fontSize: 10, fontWeight: 600, bgcolor: alpha(stratColor, 0.1), color: stratColor }} />
                  <Chip label={fund.risk_band} size="small"
                    sx={{ fontSize: 10, fontWeight: 600, bgcolor: alpha(riskColor, 0.1), color: riskColor }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4, mb: 0.5,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {fund.name}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 1.5 }}>{fund.fund_house}</Typography>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>1Y Return</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: typeof r1 === "object" ? r1.color : "inherit" }}>
                      {typeof r1 === "object" ? r1.value : r1}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Alpha</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: Number(fund.alpha) >= 0 ? "#10b981" : "#ef4444" }}>
                      {fmt(fund.alpha, 1, "%")}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Sharpe</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{fmt(fund.sharpe, 2)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Max Drawdown</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#ef4444" }}>{fmt(fund.max_drawdown, 1, "%")}</Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 10, color: "text.secondary", mt: 1 }}>
                  Min ₹{Number(fund.min_investment).toLocaleString()} · AUM ₹{Number(fund.aum_cr).toLocaleString()} Cr
                </Typography>
              </Paper>
            );
          })}
        </Box>
      )}

      {!loading && filtered.length > 0 && (
        <Typography variant="caption" sx={{ color: "text.secondary", mt: 2, display: "block" }}>
          Showing {filtered.length} of {data.length} SIF funds{strategy !== "All" ? ` · ${strategy}` : ""}
        </Typography>
      )}
    </Box>
  );
};

export default SifScreener;
