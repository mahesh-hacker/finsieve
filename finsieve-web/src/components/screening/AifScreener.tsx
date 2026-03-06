/**
 * AIF Screener — Alternative Investment Funds (Min ₹1 Crore)
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

type AifRow = {
  name: string;
  manager: string;
  category: string;
  strategy: string;
  aum_cr: number;
  min_investment: number;
  vintage_year: number;
  irr_target: number;
  irr_achieved: number;
  lock_in_years: number;
  nav: number;
  distributions: number;
};

type SortField = "name" | "aum_cr" | "irr_target" | "irr_achieved" | "lock_in_years" | "vintage_year";
type SortDir = "asc" | "desc";
type View = "table" | "grid";

const AIF_CATEGORIES = ["All", "Category I", "Category II", "Category III"];

const CAT_COLORS: Record<string, string> = {
  "Category I": "#10b981",
  "Category II": "#6366f1",
  "Category III": "#f59e0b",
};

const CAT_SHORT: Record<string, string> = {
  "Category I": "Cat I",
  "Category II": "Cat II",
  "Category III": "Cat III",
};

function fmt(v: number | undefined, decimals = 2, suffix = "") {
  if (v == null || isNaN(Number(v))) return "—";
  return Number(v).toFixed(decimals) + suffix;
}

function retColor(v: number | undefined): { value: string; color: string } | string {
  if (v == null || isNaN(Number(v))) return "—";
  const n = Number(v);
  return { value: (n >= 0 ? "+" : "") + n.toFixed(1) + "%", color: n >= 0 ? "#10b981" : "#ef4444" };
}

function exportCSV(rows: AifRow[]) {
  const header = "Name,Manager,Category,Strategy,AUM (Cr),Min Investment,Vintage Year,IRR Target (%),IRR Achieved (%),Lock-in (Yrs)\n";
  const body = rows
    .map((r) => `"${r.name}","${r.manager}","${r.category}","${r.strategy}",${r.aum_cr},${r.min_investment},${r.vintage_year},${r.irr_target},${r.irr_achieved},${r.lock_in_years}`)
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "aif_funds.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const SortIcon = ({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) => {
  if (field !== sortField) return <UnfoldMore sx={{ fontSize: 14, opacity: 0.3 }} />;
  return sortDir === "asc"
    ? <ArrowUpward sx={{ fontSize: 14, color: "#6366f1" }} />
    : <ArrowDownward sx={{ fontSize: 14, color: "#6366f1" }} />;
};

const getCatKey = (cat: string) =>
  AIF_CATEGORIES.find((c) => c !== "All" && cat?.toLowerCase().includes(c.toLowerCase().replace("category ", "cat "))) ??
  AIF_CATEGORIES.find((c) => c !== "All" && cat?.toLowerCase().includes(c.toLowerCase())) ?? "";

const AifScreener = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [data, setData] = useState<AifRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortField, setSortField] = useState<SortField>("irr_achieved");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [view, setView] = useState<View>("table");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resp = await screeningService.screenByAssetClass("AIF", undefined, undefined, 500);
        const items = ((resp as unknown as { data: AifRow[] }).data) || [];
        setData(items);
      } catch {
        setError("Failed to load AIF data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data
      .filter((r) => {
        if (category !== "All" && !r.category?.toLowerCase().includes(category.toLowerCase().replace("category ", "cat "))) return false;
        if (q && !r.name?.toLowerCase().includes(q) && !r.manager?.toLowerCase().includes(q) && !r.strategy?.toLowerCase().includes(q)) return false;
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
      const cat = r.category || "";
      AIF_CATEGORIES.filter((c) => c !== "All").forEach((c) => {
        if (cat.toLowerCase().includes(c.toLowerCase().replace("category ", "cat "))) {
          m[c] = (m[c] || 0) + 1;
        }
      });
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
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 24 } }}>AIF</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Alternative Investment Funds · Min ₹1 Crore · {data.length} funds
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
          <InputBase value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, manager, strategy..." sx={{ fontSize: 13, flex: 1 }} />
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
        {AIF_CATEGORIES.map((cat) => {
          const active = category === cat;
          const color = cat === "All" ? "#6366f1" : (CAT_COLORS[cat] ?? "#6366f1");
          const count = catCounts[cat] ?? 0;
          return (
            <Chip key={cat} label={`${CAT_SHORT[cat] ?? cat} (${count})`} onClick={() => setCategory(cat)} size="small"
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
          <Typography variant="h6" sx={{ mb: 1 }}>No AIF funds found</Typography>
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
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1" }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1" }}>Strategy</TableCell>
                <SortableHeader field="aum_cr" label="AUM (Cr)" />
                <SortableHeader field="vintage_year" label="Vintage" />
                <SortableHeader field="irr_target" label="IRR Target" />
                <SortableHeader field="irr_achieved" label="IRR Achieved" />
                <SortableHeader field="lock_in_years" label="Lock-in" />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((aif, idx) => {
                const catColor = CAT_COLORS[AIF_CATEGORIES.find((c) => c !== "All" && aif.category?.toLowerCase().includes(c.toLowerCase().replace("category ", "cat "))) ?? ""] ?? "#6366f1";
                const irrA = retColor(aif.irr_achieved);
                const irrT = retColor(aif.irr_target);
                return (
                  <TableRow key={aif.name + idx} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{aif.name}</Typography>
                      <Typography sx={{ fontSize: 10, color: "text.secondary" }}>{aif.manager}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={CAT_SHORT[aif.category] ?? aif.category} size="small"
                        sx={{ fontSize: 10, fontWeight: 600, bgcolor: alpha(catColor, 0.1), color: catColor }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary", whiteSpace: "nowrap" }}>{aif.strategy}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>
                      {aif.aum_cr ? `₹${Number(aif.aum_cr).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>{aif.vintage_year || "—"}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: typeof irrT === "object" ? irrT.color : "text.primary" }}>
                      {typeof irrT === "object" ? irrT.value : irrT}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: typeof irrA === "object" ? irrA.color : "text.primary" }}>
                      {typeof irrA === "object" ? irrA.value : irrA}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>
                      {aif.lock_in_years ? `${aif.lock_in_years}Y` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)", lg: "repeat(4,1fr)" }, gap: 2 }}>
          {filtered.map((aif, idx) => {
            const catColor = CAT_COLORS[AIF_CATEGORIES.find((c) => c !== "All" && aif.category?.toLowerCase().includes(c.toLowerCase().replace("category ", "cat "))) ?? ""] ?? "#6366f1";
            const irrA = retColor(aif.irr_achieved);
            const irrT = retColor(aif.irr_target);
            return (
              <Paper key={aif.name + idx} elevation={0} sx={{
                p: 2, borderRadius: 2,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                borderTop: `3px solid ${catColor}`,
                transition: "all 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
              }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Chip label={CAT_SHORT[aif.category] ?? aif.category} size="small"
                    sx={{ fontSize: 10, fontWeight: 600, bgcolor: alpha(catColor, 0.1), color: catColor }} />
                  <Typography sx={{ fontSize: 10, color: "text.secondary" }}>{aif.vintage_year}</Typography>
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4, mb: 0.5,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {aif.name}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 1.5 }}>
                  {aif.manager} · {aif.strategy}
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>IRR Target</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: typeof irrT === "object" ? irrT.color : "inherit" }}>
                      {typeof irrT === "object" ? irrT.value : irrT}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>IRR Achieved</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: typeof irrA === "object" ? irrA.color : "inherit" }}>
                      {typeof irrA === "object" ? irrA.value : irrA}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Lock-in</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                      {aif.lock_in_years ? `${aif.lock_in_years} Years` : "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>AUM</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>₹{Number(aif.aum_cr).toLocaleString()} Cr</Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 10, color: "text.secondary", mt: 1 }}>
                  Min ₹{Number(aif.min_investment / 100).toFixed(0)} Cr
                </Typography>
              </Paper>
            );
          })}
        </Box>
      )}

      {!loading && filtered.length > 0 && (
        <Typography variant="caption" sx={{ color: "text.secondary", mt: 2, display: "block" }}>
          Showing {filtered.length} of {data.length} AIF funds{category !== "All" ? ` · ${category}` : ""}
        </Typography>
      )}
    </Box>
  );
};

export default AifScreener;
