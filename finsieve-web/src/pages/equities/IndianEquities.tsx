import { useState, useMemo, useCallback } from "react";
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
  Menu,
  MenuItem,
  Divider,
  Badge,
} from "@mui/material";
import {
  Search,
  OpenInNew,
  Download,
  ViewList,
  GridView,
  FilterList,
  ArrowUpward,
  ArrowDownward,
  UnfoldMore,
  Close,
} from "@mui/icons-material";
import { SECTORS, SECTOR_ICONS, INDIAN_STOCKS, type IndianStock } from "../../data/indianStocksData";

type SortField = "name" | "symbol" | "cap" | "sector";
type SortDir = "asc" | "desc";
type View = "table" | "grid";

const CAP_ORDER: Record<string, number> = { "Large Cap": 0, "Mid Cap": 1, "Small Cap": 2 };
const CAP_COLORS: Record<string, { bg: string; color: string }> = {
  "Large Cap": { bg: alpha("#10b981", 0.1), color: "#10b981" },
  "Mid Cap": { bg: alpha("#f59e0b", 0.1), color: "#f59e0b" },
  "Small Cap": { bg: alpha("#ef4444", 0.1), color: "#ef4444" },
};

function exportCSV(stocks: IndianStock[]) {
  const header = "Company,NSE Symbol,BSE Code,Sector,Market Cap\n";
  const rows = stocks
    .map((s) => `"${s.name}",${s.symbol},${s.bse},"${s.sector}",${s.cap}`)
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "indian_equities.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const SortIcon = ({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) => {
  if (field !== sortField) return <UnfoldMore sx={{ fontSize: 14, opacity: 0.3 }} />;
  return sortDir === "asc"
    ? <ArrowUpward sx={{ fontSize: 14, color: "#6366f1" }} />
    : <ArrowDownward sx={{ fontSize: 14, color: "#6366f1" }} />;
};

const IndianEquities = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [search, setSearch] = useState("");
  const [sector, setSector] = useState<string>("All");
  const [capFilter, setCapFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [view, setView] = useState<View>("table");
  const [capAnchor, setCapAnchor] = useState<null | HTMLElement>(null);

  const allCaps = useMemo(() => {
    const caps = [...new Set(INDIAN_STOCKS.map((s) => s.cap))];
    return caps.sort((a, b) => (CAP_ORDER[a] ?? 99) - (CAP_ORDER[b] ?? 99));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return INDIAN_STOCKS.filter((s) => {
      if (sector !== "All" && s.sector !== sector) return false;
      if (capFilter !== "All" && s.cap !== capFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.symbol.toLowerCase().includes(q) && !s.bse.includes(q)) return false;
      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "symbol") cmp = a.symbol.localeCompare(b.symbol);
      else if (sortField === "sector") cmp = a.sector.localeCompare(b.sector);
      else if (sortField === "cap") cmp = (CAP_ORDER[a.cap] ?? 99) - (CAP_ORDER[b.cap] ?? 99);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [search, sector, capFilter, sortField, sortDir]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else setSortDir("asc");
      return field;
    });
  }, []);

  const openNSE = (symbol: string) =>
    window.open(`https://www.nseindia.com/get-quotes/equity?symbol=${symbol}`, "_blank", "noopener");

  const activeFilters = (sector !== "All" ? 1 : 0) + (capFilter !== "All" ? 1 : 0);

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
      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Indian Equities
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          NSE &amp; BSE · {INDIAN_STOCKS.length} stocks · {SECTORS.length} sectors
        </Typography>
      </Box>

      {/* ── Toolbar ── */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2, alignItems: "center" }}>
        {/* Search */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            flex: "1 1 220px",
            minWidth: 180,
            maxWidth: 340,
          }}
        >
          <Search sx={{ fontSize: 18, color: "text.secondary" }} />
          <InputBase
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, symbol, BSE code..."
            sx={{ fontSize: 13, flex: 1 }}
          />
          {search && (
            <IconButton size="small" onClick={() => setSearch("")} sx={{ p: 0.25 }}>
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>

        {/* Cap filter */}
        <Tooltip title="Filter by market cap">
          <Badge badgeContent={capFilter !== "All" ? 1 : 0} color="primary" variant="dot">
            <IconButton
              size="small"
              onClick={(e) => setCapAnchor(e.currentTarget)}
              sx={{
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                borderRadius: 2,
                px: 1.5,
                py: 0.75,
                gap: 0.5,
                fontSize: 13,
                fontWeight: 600,
                color: activeFilters > 0 ? "#6366f1" : "text.secondary",
              }}
            >
              <FilterList sx={{ fontSize: 16 }} />
            </IconButton>
          </Badge>
        </Tooltip>
        <Menu anchorEl={capAnchor} open={Boolean(capAnchor)} onClose={() => setCapAnchor(null)}>
          <MenuItem disabled sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", opacity: "1 !important" }}>
            MARKET CAP
          </MenuItem>
          {["All", ...allCaps].map((c) => (
            <MenuItem
              key={c}
              selected={capFilter === c}
              onClick={() => { setCapFilter(c); setCapAnchor(null); }}
              sx={{ fontSize: 13, minWidth: 160 }}
            >
              {c}
            </MenuItem>
          ))}
        </Menu>

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
          {/* CSV Export */}
          <Tooltip title="Export to CSV">
            <IconButton
              size="small"
              onClick={() => exportCSV(filtered)}
              sx={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, borderRadius: 2 }}
            >
              <Download sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* View toggle */}
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, v) => v && setView(v)}
            size="small"
            sx={{ "& .MuiToggleButton-root": { border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, px: 1.25, py: 0.5 } }}
          >
            <ToggleButton value="table"><ViewList sx={{ fontSize: 18 }} /></ToggleButton>
            <ToggleButton value="grid"><GridView sx={{ fontSize: 18 }} /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* ── Sector Chips ── */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2.5 }}>
        {["All", ...SECTORS].map((s) => {
          const active = sector === s;
          const count = s === "All" ? INDIAN_STOCKS.length : INDIAN_STOCKS.filter((st) => st.sector === s).length;
          return (
            <Chip
              key={s}
              label={`${s === "All" ? "" : (SECTOR_ICONS[s] ?? "") + " "}${s} (${count})`}
              onClick={() => setSector(s)}
              size="small"
              sx={{
                fontWeight: active ? 700 : 500,
                fontSize: 12,
                cursor: "pointer",
                bgcolor: active ? alpha("#6366f1", 0.12) : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                color: active ? "#6366f1" : "text.secondary",
                border: active ? `1px solid ${alpha("#6366f1", 0.4)}` : "1px solid transparent",
                transition: "all 0.15s",
                "&:hover": { bgcolor: alpha("#6366f1", 0.08), color: "#6366f1" },
              }}
            />
          );
        })}
      </Box>

      {/* ── Active filter summary ── */}
      {(search || capFilter !== "All") && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </Typography>
          {search && (
            <Chip label={`"${search}"`} size="small" onDelete={() => setSearch("")} sx={{ fontSize: 11 }} />
          )}
          {capFilter !== "All" && (
            <Chip label={capFilter} size="small" onDelete={() => setCapFilter("All")} sx={{ fontSize: 11 }} />
          )}
        </Box>
      )}

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10, color: "text.secondary" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>No stocks found</Typography>
          <Typography variant="body2">Try adjusting your search or filters</Typography>
        </Box>
      ) : view === "table" ? (
        /* ── Table View ── */
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, borderRadius: 2 }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.05)" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", width: 36 }}>#</TableCell>
                <SortableHeader field="name" label="Company" />
                <SortableHeader field="symbol" label="NSE Symbol" />
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1" }}>BSE Code</TableCell>
                <SortableHeader field="sector" label="Sector" />
                <SortableHeader field="cap" label="Market Cap" />
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1", width: 40 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((stock, idx) => {
                const capStyle = CAP_COLORS[stock.cap] ?? { bg: alpha("#6366f1", 0.1), color: "#6366f1" };
                return (
                  <TableRow
                    key={stock.symbol + stock.bse}
                    hover
                    sx={{ "&:last-child td": { border: 0 }, cursor: "default" }}
                  >
                    <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{stock.name}</Typography>
                        <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.2 }}>{stock.desc}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={stock.symbol}
                        size="small"
                        sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: 11, bgcolor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)", color: "#6366f1" }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary", fontFamily: "monospace" }}>{stock.bse}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary", whiteSpace: "nowrap" }}>
                      {SECTOR_ICONS[stock.sector] ?? ""} {stock.sector}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={stock.cap}
                        size="small"
                        sx={{ fontSize: 10, fontWeight: 600, bgcolor: capStyle.bg, color: capStyle.color }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View on NSE">
                        <IconButton size="small" onClick={() => openNSE(stock.symbol)}>
                          <OpenInNew sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* ── Grid / Card View ── */
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          {filtered.map((stock) => {
            const capStyle = CAP_COLORS[stock.cap] ?? { bg: alpha("#6366f1", 0.1), color: "#6366f1" };
            return (
              <Paper
                key={stock.symbol + stock.bse}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  borderTop: `3px solid ${capStyle.color}`,
                  transition: "all 0.2s",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Chip
                    label={stock.symbol}
                    size="small"
                    sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: 11, bgcolor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)", color: "#6366f1" }}
                  />
                  <IconButton size="small" onClick={() => openNSE(stock.symbol)} sx={{ p: 0.25 }}>
                    <OpenInNew sx={{ fontSize: 13, color: "text.secondary" }} />
                  </IconButton>
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4, mb: 0.5 }}>{stock.name}</Typography>
                <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 1.5, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {stock.desc}
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 10, color: "text.secondary" }}>BSE {stock.bse}</Typography>
                  <Chip label={stock.cap} size="small" sx={{ fontSize: 10, fontWeight: 600, height: 18, bgcolor: capStyle.bg, color: capStyle.color }} />
                </Box>
                <Typography sx={{ fontSize: 10, color: "text.secondary", mt: 0.5 }}>
                  {SECTOR_ICONS[stock.sector] ?? ""} {stock.sector}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* ── Footer count ── */}
      {filtered.length > 0 && (
        <Typography variant="caption" sx={{ color: "text.secondary", mt: 2, display: "block" }}>
          Showing {filtered.length} of {INDIAN_STOCKS.length} stocks
          {capFilter !== "All" ? ` · ${capFilter}` : ""}
          {sector !== "All" ? ` · ${sector}` : ""}
        </Typography>
      )}
    </Box>
  );
};

export default IndianEquities;
