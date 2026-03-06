import { useState, useMemo, useCallback, useEffect } from "react";
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
  Pagination,
  CircularProgress,
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
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";
import {
  SECTORS,
  SECTOR_ICONS,
  INDIAN_STOCKS,
  type IndianStock,
} from "../../data/indianStocksData";
import nseStocksService, {
  type NSEStock,
} from "../../services/equities/nseStocksService";

type SortField = "name" | "symbol" | "cap" | "sector" | "price" | "pChange";
type SortDir = "asc" | "desc";
type View = "table" | "grid";

const PAGE_SIZE = 100;

const CAP_ORDER: Record<string, number> = {
  "Large Cap": 0,
  "Mid Cap": 1,
  "Small Cap": 2,
};
const CAP_COLORS: Record<string, { bg: string; color: string }> = {
  "Large Cap": { bg: alpha("#10b981", 0.1), color: "#10b981" },
  "Mid Cap": { bg: alpha("#f59e0b", 0.1), color: "#f59e0b" },
  "Small Cap": { bg: alpha("#ef4444", 0.1), color: "#ef4444" },
};

// Build a lookup map from static data for sector/cap/bse/desc enrichment
const STATIC_MAP: Record<
  string,
  Pick<IndianStock, "sector" | "cap" | "bse" | "desc">
> = {};
INDIAN_STOCKS.forEach((s) => {
  STATIC_MAP[s.symbol] = { sector: s.sector, cap: s.cap, bse: s.bse, desc: s.desc };
});

interface EnrichedStock extends NSEStock {
  sector: string;
  cap: string;
  bse: string;
  desc: string;
}

function toEnriched(s: NSEStock): EnrichedStock {
  const st = STATIC_MAP[s.symbol] ?? {};
  return {
    ...s,
    sector: st.sector ?? "Other",
    cap: st.cap ?? "Small Cap",
    bse: st.bse ?? "",
    desc: st.desc ?? s.companyName,
  };
}

function fromStatic(s: IndianStock): EnrichedStock {
  return {
    symbol: s.symbol,
    companyName: s.name,
    lastPrice: 0,
    change: 0,
    pChange: 0,
    volume: 0,
    marketCap: 0,
    pe: 0,
    yearHigh: 0,
    yearLow: 0,
    open: 0,
    dayHigh: 0,
    dayLow: 0,
    previousClose: 0,
    sector: s.sector,
    cap: s.cap,
    bse: s.bse,
    desc: s.desc,
  };
}

function exportCSV(stocks: EnrichedStock[]) {
  const header = "Company,NSE Symbol,BSE Code,Sector,Market Cap,Price,Change%\n";
  const rows = stocks
    .map(
      (s) =>
        `"${s.companyName}",${s.symbol},${s.bse},"${s.sector}",${s.cap},${s.lastPrice},${s.pChange}`
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "indian_equities.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const SortIcon = ({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) => {
  if (field !== sortField)
    return <UnfoldMore sx={{ fontSize: 14, opacity: 0.3 }} />;
  return sortDir === "asc" ? (
    <ArrowUpward sx={{ fontSize: 14, color: "#6366f1" }} />
  ) : (
    <ArrowDownward sx={{ fontSize: 14, color: "#6366f1" }} />
  );
};

const IndianEquities = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [stocks, setStocks] = useState<EnrichedStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveDataAvailable, setLiveDataAvailable] = useState(false);

  const [search, setSearch] = useState("");
  const [sector, setSector] = useState<string>("All");
  const [capFilter, setCapFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [view, setView] = useState<View>("table");
  const [capAnchor, setCapAnchor] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(1);

  // Fetch from backend, fall back to static data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    nseStocksService
      .getAllNSEStocks()
      .then((res) => {
        if (cancelled) return;
        const raw = res as unknown as { success?: boolean; data?: NSEStock[] } | NSEStock[];
        const data = Array.isArray(raw) ? raw : (raw as { data?: NSEStock[] }).data;
        if (Array.isArray(data) && data.length > 0) {
          setStocks(data.map(toEnriched));
          setLiveDataAvailable(true);
        } else {
          setStocks(INDIAN_STOCKS.map(fromStatic));
        }
      })
      .catch(() => {
        if (!cancelled) setStocks(INDIAN_STOCKS.map(fromStatic));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allCaps = useMemo(() => {
    const caps = [...new Set(stocks.map((s) => s.cap))];
    return caps.sort((a, b) => (CAP_ORDER[a] ?? 99) - (CAP_ORDER[b] ?? 99));
  }, [stocks]);

  const sectorCounts = useMemo(() => {
    const map: Record<string, number> = { All: stocks.length };
    stocks.forEach((s) => {
      map[s.sector] = (map[s.sector] ?? 0) + 1;
    });
    return map;
  }, [stocks]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stocks
      .filter((s) => {
        if (sector !== "All" && s.sector !== sector) return false;
        if (capFilter !== "All" && s.cap !== capFilter) return false;
        if (
          q &&
          !s.companyName.toLowerCase().includes(q) &&
          !s.symbol.toLowerCase().includes(q) &&
          !s.bse.includes(q)
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === "name") cmp = a.companyName.localeCompare(b.companyName);
        else if (sortField === "symbol") cmp = a.symbol.localeCompare(b.symbol);
        else if (sortField === "sector") cmp = a.sector.localeCompare(b.sector);
        else if (sortField === "cap")
          cmp = (CAP_ORDER[a.cap] ?? 99) - (CAP_ORDER[b.cap] ?? 99);
        else if (sortField === "price") cmp = a.lastPrice - b.lastPrice;
        else if (sortField === "pChange") cmp = a.pChange - b.pChange;
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [stocks, search, sector, capFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else setSortDir("asc");
      return field;
    });
    setPage(1);
  }, []);

  const handleSectorChange = (s: string) => {
    setSector(s);
    setPage(1);
  };

  const openNSE = (symbol: string) =>
    window.open(
      `https://www.nseindia.com/get-quotes/equity?symbol=${symbol}`,
      "_blank",
      "noopener"
    );

  const activeFilters = (sector !== "All" ? 1 : 0) + (capFilter !== "All" ? 1 : 0);

  const SortableHeader = ({
    field,
    label,
    sx,
  }: {
    field: SortField;
    label: string;
    sx?: object;
  }) => (
    <TableCell
      onClick={() => handleSort(field)}
      sx={{
        fontWeight: 700,
        fontSize: 12,
        color: "#6366f1",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        ...sx,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {label}
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </Box>
    </TableCell>
  );

  const PChangeCell = ({ value }: { value: number }) => {
    if (!value && value !== 0) return <TableCell sx={{ fontSize: 12 }}>—</TableCell>;
    const isPos = value >= 0;
    return (
      <TableCell>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.25,
            color: isPos ? "#10b981" : "#ef4444",
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {isPos ? (
            <TrendingUp sx={{ fontSize: 13 }} />
          ) : (
            <TrendingDown sx={{ fontSize: 13 }} />
          )}
          {isPos ? "+" : ""}
          {value.toFixed(2)}%
        </Box>
      </TableCell>
    );
  };

  return (
    <Box sx={{ pb: 3 }}>
      {/* ── Header ── */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 24 } }}>
          Indian Equities
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          NSE &amp; BSE ·{" "}
          {loading ? (
            <CircularProgress size={10} sx={{ verticalAlign: "middle", mx: 0.5 }} />
          ) : (
            `${stocks.length} stocks`
          )}{" "}
          · {SECTORS.length} sectors
          {liveDataAvailable && (
            <Chip
              label="Live"
              size="small"
              sx={{
                ml: 1,
                fontSize: 10,
                height: 16,
                bgcolor: alpha("#10b981", 0.12),
                color: "#10b981",
                fontWeight: 700,
              }}
            />
          )}
        </Typography>
      </Box>

      {/* ── Toolbar ── */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
          alignItems: "center",
        }}
      >
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
            flex: "1 1 180px",
            minWidth: 160,
            maxWidth: 320,
          }}
        >
          <Search sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
          <InputBase
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, symbol..."
            sx={{ fontSize: 13, flex: 1, minWidth: 0 }}
          />
          {search && (
            <IconButton size="small" onClick={() => setSearch("")} sx={{ p: 0.25 }}>
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>

        {/* Cap filter */}
        <Tooltip title="Filter by market cap">
          <Badge
            badgeContent={capFilter !== "All" ? 1 : 0}
            color="primary"
            variant="dot"
          >
            <IconButton
              size="small"
              onClick={(e) => setCapAnchor(e.currentTarget)}
              sx={{
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                borderRadius: 2,
                px: 1.25,
                py: 0.75,
                color: activeFilters > 0 ? "#6366f1" : "text.secondary",
              }}
            >
              <FilterList sx={{ fontSize: 16 }} />
            </IconButton>
          </Badge>
        </Tooltip>
        <Menu
          anchorEl={capAnchor}
          open={Boolean(capAnchor)}
          onClose={() => setCapAnchor(null)}
        >
          <MenuItem
            disabled
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: "text.secondary",
              opacity: "1 !important",
            }}
          >
            MARKET CAP
          </MenuItem>
          {["All", ...allCaps].map((c) => (
            <MenuItem
              key={c}
              selected={capFilter === c}
              onClick={() => {
                setCapFilter(c);
                setCapAnchor(null);
                setPage(1);
              }}
              sx={{ fontSize: 13, minWidth: 150 }}
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
              sx={{
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                borderRadius: 2,
              }}
            >
              <Download sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>

          {/* View toggle */}
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, v) => v && setView(v)}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                px: 1,
                py: 0.5,
              },
            }}
          >
            <ToggleButton value="table">
              <ViewList sx={{ fontSize: 17 }} />
            </ToggleButton>
            <ToggleButton value="grid">
              <GridView sx={{ fontSize: 17 }} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* ── Sector Chips ── */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
        {["All", ...SECTORS].map((s) => {
          const active = sector === s;
          const count = sectorCounts[s] ?? 0;
          return (
            <Chip
              key={s}
              label={`${s === "All" ? "" : (SECTOR_ICONS[s] ?? "") + " "}${s} (${count})`}
              onClick={() => handleSectorChange(s)}
              size="small"
              sx={{
                fontWeight: active ? 700 : 500,
                fontSize: 11,
                cursor: "pointer",
                bgcolor: active
                  ? alpha("#6366f1", 0.12)
                  : isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.04)",
                color: active ? "#6366f1" : "text.secondary",
                border: active
                  ? `1px solid ${alpha("#6366f1", 0.4)}`
                  : "1px solid transparent",
                transition: "all 0.15s",
                "&:hover": { bgcolor: alpha("#6366f1", 0.08), color: "#6366f1" },
              }}
            />
          );
        })}
      </Box>

      {/* ── Active filter summary ── */}
      {(search || capFilter !== "All") && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </Typography>
          {search && (
            <Chip
              label={`"${search}"`}
              size="small"
              onDelete={() => setSearch("")}
              sx={{ fontSize: 11 }}
            />
          )}
          {capFilter !== "All" && (
            <Chip
              label={capFilter}
              size="small"
              onDelete={() => {
                setCapFilter("All");
                setPage(1);
              }}
              sx={{ fontSize: 11 }}
            />
          )}
        </Box>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress size={36} sx={{ color: "#6366f1" }} />
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
            Loading stocks...
          </Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10, color: "text.secondary" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            No stocks found
          </Typography>
          <Typography variant="body2">Try adjusting your search or filters</Typography>
        </Box>
      ) : view === "table" ? (
        /* ── Table View ── */
        <>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              borderRadius: 2,
              overflowX: "auto",
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: isDark
                      ? "rgba(99,102,241,0.08)"
                      : "rgba(99,102,241,0.05)",
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: "text.secondary",
                      width: 36,
                      display: { xs: "none", sm: "table-cell" },
                    }}
                  >
                    #
                  </TableCell>
                  <SortableHeader field="name" label="Company" />
                  <SortableHeader field="symbol" label="NSE" />
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#6366f1",
                      display: { xs: "none", md: "table-cell" },
                    }}
                  >
                    BSE
                  </TableCell>
                  <SortableHeader
                    field="sector"
                    label="Sector"
                    sx={{ display: { xs: "none", lg: "table-cell" } }}
                  />
                  <SortableHeader field="cap" label="Cap" />
                  {liveDataAvailable && (
                    <>
                      <SortableHeader
                        field="price"
                        label="Price"
                        sx={{ display: { xs: "none", sm: "table-cell" } }}
                      />
                      <SortableHeader field="pChange" label="Chg%" />
                    </>
                  )}
                  <TableCell
                    sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1", width: 36 }}
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((stock, idx) => {
                  const capStyle =
                    CAP_COLORS[stock.cap] ?? { bg: alpha("#6366f1", 0.1), color: "#6366f1" };
                  const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <TableRow
                      key={stock.symbol + stock.bse + idx}
                      hover
                      sx={{ "&:last-child td": { border: 0 }, cursor: "default" }}
                    >
                      <TableCell
                        sx={{
                          fontSize: 12,
                          color: "text.secondary",
                          display: { xs: "none", sm: "table-cell" },
                        }}
                      >
                        {rowNum}
                      </TableCell>
                      <TableCell sx={{ minWidth: 140, maxWidth: { xs: 160, md: 240 } }}>
                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: 13,
                              lineHeight: 1.3,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {stock.companyName}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: "text.secondary",
                              lineHeight: 1.2,
                              display: { xs: "none", sm: "block" },
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {stock.desc}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Chip
                          label={stock.symbol}
                          size="small"
                          sx={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: 11,
                            bgcolor: isDark
                              ? "rgba(99,102,241,0.12)"
                              : "rgba(99,102,241,0.08)",
                            color: "#6366f1",
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: 12,
                          color: "text.secondary",
                          fontFamily: "monospace",
                          display: { xs: "none", md: "table-cell" },
                        }}
                      >
                        {stock.bse || "—"}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: 12,
                          color: "text.secondary",
                          whiteSpace: "nowrap",
                          display: { xs: "none", lg: "table-cell" },
                        }}
                      >
                        {SECTOR_ICONS[stock.sector] ?? ""} {stock.sector}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stock.cap}
                          size="small"
                          sx={{
                            fontSize: 10,
                            fontWeight: 600,
                            bgcolor: capStyle.bg,
                            color: capStyle.color,
                            whiteSpace: "nowrap",
                          }}
                        />
                      </TableCell>
                      {liveDataAvailable && (
                        <>
                          <TableCell
                            sx={{
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              display: { xs: "none", sm: "table-cell" },
                            }}
                          >
                            {stock.lastPrice > 0
                              ? `₹${stock.lastPrice.toLocaleString("en-IN")}`
                              : "—"}
                          </TableCell>
                          <PChangeCell value={stock.pChange} />
                        </>
                      )}
                      <TableCell>
                        <Tooltip title="View on NSE">
                          <IconButton size="small" onClick={() => openNSE(stock.symbol)}>
                            <OpenInNew sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mt: 2,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                color="primary"
                size="small"
                siblingCount={1}
              />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </Typography>
            </Box>
          )}
        </>
      ) : (
        /* ── Grid / Card View ── */
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 1.5,
            }}
          >
            {paginated.map((stock, idx) => {
              const capStyle =
                CAP_COLORS[stock.cap] ?? { bg: alpha("#6366f1", 0.1), color: "#6366f1" };
              return (
                <Paper
                  key={stock.symbol + stock.bse + idx}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                    borderTop: `3px solid ${capStyle.color}`,
                    transition: "all 0.2s",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 0.75,
                    }}
                  >
                    <Chip
                      label={stock.symbol}
                      size="small"
                      sx={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: 11,
                        bgcolor: isDark
                          ? "rgba(99,102,241,0.12)"
                          : "rgba(99,102,241,0.08)",
                        color: "#6366f1",
                      }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {liveDataAvailable && stock.pChange !== 0 && (
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: stock.pChange >= 0 ? "#10b981" : "#ef4444",
                          }}
                        >
                          {stock.pChange >= 0 ? "+" : ""}
                          {stock.pChange.toFixed(2)}%
                        </Typography>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => openNSE(stock.symbol)}
                        sx={{ p: 0.25 }}
                      >
                        <OpenInNew sx={{ fontSize: 13, color: "text.secondary" }} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 13,
                      lineHeight: 1.4,
                      mb: 0.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {stock.companyName}
                  </Typography>
                  {liveDataAvailable && stock.lastPrice > 0 && (
                    <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.25 }}>
                      ₹{stock.lastPrice.toLocaleString("en-IN")}
                    </Typography>
                  )}
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "text.secondary",
                      mb: 1,
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {stock.desc}
                  </Typography>
                  <Divider sx={{ mb: 0.75 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {stock.bse ? (
                      <Typography sx={{ fontSize: 10, color: "text.secondary" }}>
                        BSE {stock.bse}
                      </Typography>
                    ) : (
                      <span />
                    )}
                    <Chip
                      label={stock.cap}
                      size="small"
                      sx={{
                        fontSize: 10,
                        fontWeight: 600,
                        height: 18,
                        bgcolor: capStyle.bg,
                        color: capStyle.color,
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: 10, color: "text.secondary", mt: 0.5 }}>
                    {SECTOR_ICONS[stock.sector] ?? ""} {stock.sector}
                  </Typography>
                </Paper>
              );
            })}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mt: 2,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                color="primary"
                size="small"
                siblingCount={1}
              />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* ── Footer count ── */}
      {!loading && filtered.length > 0 && totalPages <= 1 && (
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", mt: 2, display: "block" }}
        >
          Showing {filtered.length} of {stocks.length} stocks
          {capFilter !== "All" ? ` · ${capFilter}` : ""}
          {sector !== "All" ? ` · ${sector}` : ""}
        </Typography>
      )}
    </Box>
  );
};

export default IndianEquities;
