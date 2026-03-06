/**
 * ETF Screener — Indian ETFs (NSE/BSE)
 * IndianEquities-style UX: search, category chips, sortable table, CSV export, grid/table toggle
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

type EtfRow = {
  symbol: string;
  name: string;
  category: string;
  aum_cr: number;
  ter: number;
  current_value: number;
  return_1y: number;
  return_3y: number;
  return_5y: number;
  tracking_error: number;
  dividend_yield: number;
  launch_year: number;
};

type SortField = "name" | "aum_cr" | "ter" | "return_1y" | "return_3y" | "return_5y" | "tracking_error";
type SortDir = "asc" | "desc";
type View = "table" | "grid";

const ETF_CATEGORIES = ["All", "Equity", "Gold", "Silver", "Debt", "International", "Smart Beta"];

const CAT_COLORS: Record<string, string> = {
  Equity: "#6366f1",
  Gold: "#f59e0b",
  Silver: "#94a3b8",
  Debt: "#10b981",
  International: "#3b82f6",
  "Smart Beta": "#8b5cf6",
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

function exportCSV(rows: EtfRow[]) {
  const header = "Symbol,Name,Category,AUM (Cr),TER (%),Price,1Y Ret (%),3Y Ret (%),5Y Ret (%),Tracking Error (%),Launch Year\n";
  const body = rows
    .map((r) => `${r.symbol},"${r.name}",${r.category},${r.aum_cr},${r.ter},${r.current_value},${r.return_1y},${r.return_3y},${r.return_5y},${r.tracking_error},${r.launch_year}`)
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "etfs.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const SortIcon = ({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) => {
  if (field !== sortField) return <UnfoldMore sx={{ fontSize: 14, opacity: 0.3 }} />;
  return sortDir === "asc"
    ? <ArrowUpward sx={{ fontSize: 14, color: "#6366f1" }} />
    : <ArrowDownward sx={{ fontSize: 14, color: "#6366f1" }} />;
};

const EtfScreener = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [data, setData] = useState<EtfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortField, setSortField] = useState<SortField>("return_1y");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [view, setView] = useState<View>("table");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resp = await screeningService.screenByAssetClass("ETF", undefined, undefined, 500);
        const items = ((resp as unknown as { data: EtfRow[] }).data) || [];
        setData(items);
      } catch {
        setError("Failed to load ETF data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getCatKey = (cat: string) =>
    ETF_CATEGORIES.find((c) => c !== "All" && cat?.toLowerCase().includes(c.toLowerCase())) ?? "";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data
      .filter((r) => {
        if (category !== "All" && getCatKey(r.category) !== category) return false;
        if (q && !r.name?.toLowerCase().includes(q) && !r.symbol?.toLowerCase().includes(q)) return false;
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
  }, [data, search, category, sortField, sortDir]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else setSortDir("desc");
      return field;
    });
  }, []);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = { All: data.length };
    data.forEach((r) => {
      const key = getCatKey(r.category);
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
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 24 } }}>ETFs</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Indian Exchange Traded Funds · NSE/BSE · {data.length} funds
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
          <InputBase value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or symbol..." sx={{ fontSize: 13, flex: 1 }} />
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
        {ETF_CATEGORIES.map((cat) => {
          const active = category === cat;
          const color = cat === "All" ? "#6366f1" : (CAT_COLORS[cat] ?? "#6366f1");
          const count = catCounts[cat] ?? 0;
          return (
            <Chip key={cat} label={`${cat} (${count})`} onClick={() => setCategory(cat)} size="small"
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

      {(search || category !== "All") && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </Typography>
          {search && <Chip label={`"${search}"`} size="small" onDelete={() => setSearch("")} sx={{ fontSize: 11 }} />}
          {category !== "All" && <Chip label={category} size="small" onDelete={() => setCategory("All")} sx={{ fontSize: 11 }} />}
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
          <Typography variant="h6" sx={{ mb: 1 }}>No ETFs found</Typography>
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
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1" }}>Symbol</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1" }}>Category</TableCell>
                <SortableHeader field="aum_cr" label="AUM (Cr)" />
                <SortableHeader field="ter" label="TER %" />
                <SortableHeader field="return_1y" label="1Y Ret" />
                <SortableHeader field="return_3y" label="3Y Ret" />
                <SortableHeader field="return_5y" label="5Y Ret" />
                <SortableHeader field="tracking_error" label="Track Err" />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((etf, idx) => {
                const catKey = getCatKey(etf.category);
                const catColor = CAT_COLORS[catKey] ?? "#6366f1";
                const r1 = retColor(etf.return_1y);
                const r3 = retColor(etf.return_3y);
                const r5 = retColor(etf.return_5y);
                return (
                  <TableRow key={etf.symbol} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{etf.name}</Typography>
                      <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Est. {etf.launch_year}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={etf.symbol} size="small"
                        sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: 11, bgcolor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)", color: "#6366f1" }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={etf.category} size="small"
                        sx={{ fontSize: 10, fontWeight: 600, bgcolor: alpha(catColor, 0.1), color: catColor }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>
                      {etf.aum_cr ? `₹${Number(etf.aum_cr).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>{fmt(etf.ter, 2, "%")}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: typeof r1 === "object" ? r1.color : "text.primary" }}>
                      {typeof r1 === "object" ? r1.value : r1}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: typeof r3 === "object" ? r3.color : "text.primary" }}>
                      {typeof r3 === "object" ? r3.value : r3}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: typeof r5 === "object" ? r5.color : "text.primary" }}>
                      {typeof r5 === "object" ? r5.value : r5}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>{fmt(etf.tracking_error, 2, "%")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)", lg: "repeat(4,1fr)" }, gap: 2 }}>
          {filtered.map((etf) => {
            const catKey = getCatKey(etf.category);
            const catColor = CAT_COLORS[catKey] ?? "#6366f1";
            const r1 = retColor(etf.return_1y);
            const r3 = retColor(etf.return_3y);
            return (
              <Paper key={etf.symbol} elevation={0} sx={{
                p: 2, borderRadius: 2,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                borderTop: `3px solid ${catColor}`,
                transition: "all 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
              }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Chip label={etf.symbol} size="small"
                    sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: 11, bgcolor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)", color: "#6366f1" }} />
                  <Chip label={etf.category} size="small"
                    sx={{ fontSize: 10, fontWeight: 600, bgcolor: alpha(catColor, 0.1), color: catColor }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4, mb: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {etf.name}
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>AUM</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>₹{Number(etf.aum_cr).toLocaleString()} Cr</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>TER</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{fmt(etf.ter, 2, "%")}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>1Y Return</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: typeof r1 === "object" ? r1.color : "inherit" }}>
                      {typeof r1 === "object" ? r1.value : r1}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Tracking Err</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{fmt(etf.tracking_error, 2, "%")}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>3Y Return</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: typeof r3 === "object" ? r3.color : "inherit" }}>
                      {typeof r3 === "object" ? r3.value : r3}
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 10, color: "text.secondary", mt: 1 }}>Est. {etf.launch_year}</Typography>
              </Paper>
            );
          })}
        </Box>
      )}

      {!loading && filtered.length > 0 && (
        <Typography variant="caption" sx={{ color: "text.secondary", mt: 2, display: "block" }}>
          Showing {filtered.length} of {data.length} ETFs{category !== "All" ? ` · ${category}` : ""}
        </Typography>
      )}
    </Box>
  );
};

export default EtfScreener;
