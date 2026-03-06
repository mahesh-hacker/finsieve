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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Paper,
  Alert,
  Collapse,
} from "@mui/material";
import {
  Refresh,
  FilterList,
  Delete,
  Add,
  Bolt,
  Tune,
  ExpandMore,
  ExpandLess,
  Search,
} from "@mui/icons-material";
import screeningService, {
  type ScreeningParam,
  type ScreeningFilter,
  type AssetClassInfo,
  type QuickScreen,
} from "../../services/screening/screeningService";
import toast from "react-hot-toast";

const ASSET_CLASS_COLORS: Record<string, string> = {
  US_EQUITY: "#3b82f6",
  CRYPTO: "#f59e0b",
  MUTUAL_FUND: "#10b981",
  COMMODITY: "#ef4444",
  BOND: "#6366f1",
  INDEX: "#8b5cf6",
  ETF: "#0ea5e9",
  SIF: "#8b5cf6",
  PMS: "#6366f1",
  AIF: "#059669",
};

// Display order: ETF, SIF, PMS, AIF right below Mutual Funds
const ASSET_CLASS_DISPLAY_ORDER = [
  "US_EQUITY",
  "CRYPTO",
  "MUTUAL_FUND",
  "ETF",
  "SIF",
  "PMS",
  "AIF",
  "COMMODITY",
  "BOND",
  "INDEX",
];

interface ScreeningProps {
  defaultAssetClass?: string;
}

const Screening = ({ defaultAssetClass }: ScreeningProps) => {
  const theme = useTheme();
  const [assetClasses, setAssetClasses] = useState<AssetClassInfo[]>([]);
  const [selectedAssetClass, setSelectedAssetClass] = useState("");
  const [params, setParams] = useState<ScreeningParam[]>([]);
  const [filters, setFilters] = useState<ScreeningFilter[]>([]);
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [quickScreens, setQuickScreens] = useState<QuickScreen[]>([]);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(true);
  const [activeQuickScreen, setActiveQuickScreen] = useState<string | null>(
    null,
  );

  // Load asset classes & quick screens on mount
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [acRes, qsRes] = await Promise.all([
          screeningService.getAssetClasses(),
          screeningService.getQuickScreens(),
        ]);
        const acData = acRes as { data?: AssetClassInfo[] };
        const qsData = qsRes as { data?: QuickScreen[] };
        if (acData?.data) {
          const ordered = [...acData.data].sort(
            (a, b) =>
              ASSET_CLASS_DISPLAY_ORDER.indexOf(a.key) -
              ASSET_CLASS_DISPLAY_ORDER.indexOf(b.key),
          );
          setAssetClasses(ordered);
          if (defaultAssetClass && acData.data.some((ac: AssetClassInfo) => ac.key === defaultAssetClass)) {
            setSelectedAssetClass(defaultAssetClass);
          }
        }
        if (qsData?.data) setQuickScreens(qsData.data);
      } catch (error) {
        console.error("Error loading screening config:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    loadInitial();
  }, [defaultAssetClass]);

  // Load screening params when asset class changes
  useEffect(() => {
    if (!selectedAssetClass) return;
    const loadParams = async () => {
      try {
        const res =
          await screeningService.getScreeningParams(selectedAssetClass) as { data?: ScreeningParam[] };
        if (res?.data) setParams(res.data);
      } catch (error) {
        console.error("Error loading params:", error);
      }
    };
    loadParams();
    setFilters([]);
    setResults([]);
    setSortBy("");
    setActiveQuickScreen(null);
  }, [selectedAssetClass]);

  // Run screening
  const runScreening = useCallback(async () => {
    if (!selectedAssetClass) {
      toast.error("Select an asset class first");
      return;
    }
    setLoading(true);
    try {
      const res = await screeningService.runScreening({
        assetClass: selectedAssetClass,
        filters,
        sortBy: sortBy || undefined,
        sortOrder,
        limit: 100,
      });
      const d = res as { data?: Record<string, unknown>[]; pagination?: { total?: number } };
      if (d?.data) {
        setResults(d.data);
        setTotalResults(d.pagination?.total ?? d.data.length);
        if (d.data.length === 0) {
          toast("No results match your filters", { icon: "🔍" });
        } else {
          toast.success(
            `Found ${d.pagination?.total || d.data.length} results`,
          );
        }
      }
    } catch (error) {
      console.error("Screening error:", error);
      toast.error("Screening failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedAssetClass, filters, sortBy, sortOrder]);

  // Run quick screen
  const runQuickScreen = useCallback(async (screen: QuickScreen) => {
    setSelectedAssetClass(screen.assetClass);
    setActiveQuickScreen(screen.id);
    setLoading(true);
    try {
      const res = await screeningService.runQuickScreen(screen.id) as { data?: Record<string, unknown>[]; pagination?: { total?: number } };
      if (res?.data) {
        setResults(res.data);
        setTotalResults(res.pagination?.total ?? res.data.length);
        setFilters(screen.filters);
        setSortBy(screen.sortBy);
        setSortOrder(screen.sortOrder);
      }
    } catch (error) {
      console.error("Quick screen error:", error);
      toast.error("Quick screen failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a filter
  const addFilter = () => {
    if (params.length === 0) return;
    setFilters([
      ...filters,
      {
        field: params[0].field,
        operator: params[0].type === "select" ? "eq" : "gt",
        value: "",
      },
    ]);
  };

  // Update a filter
  const updateFilter = (index: number, updates: Partial<ScreeningFilter>) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], ...updates };
    setFilters(updated);
  };

  // Remove a filter
  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  // Format value for display
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    const num =
      typeof value === "string" ? parseFloat(value) : (value as number);
    if (isNaN(num)) return String(value);
    if (Math.abs(num) >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (Math.abs(num) >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get display columns based on asset class
  const getColumns = (): { key: string; label: string }[] => {
    switch (selectedAssetClass) {
      case "US_EQUITY":
        return [
          { key: "symbol", label: "Symbol" },
          { key: "name", label: "Name" },
          { key: "current_value", label: "Price" },
          { key: "change_percent", label: "Change %" },
          { key: "market_cap", label: "Market Cap" },
          { key: "pe_ratio", label: "P/E" },
          { key: "volume", label: "Volume" },
          { key: "sector", label: "Sector" },
        ];
      case "CRYPTO":
        return [
          { key: "symbol", label: "Symbol" },
          { key: "name", label: "Name" },
          { key: "current_value", label: "Price" },
          { key: "change_percent", label: "24h %" },
          { key: "change_7d", label: "7d %" },
          { key: "market_cap", label: "Market Cap" },
          { key: "total_volume", label: "Volume" },
          { key: "market_cap_rank", label: "Rank" },
        ];
      case "MUTUAL_FUND":
        return [
          { key: "scheme_name", label: "Fund Name" },
          { key: "nav", label: "NAV" },
          { key: "change_percent", label: "Change %" },
          { key: "fund_house", label: "Fund House" },
          { key: "scheme_category", label: "Category" },
        ];
      case "COMMODITY":
        return [
          { key: "symbol", label: "Symbol" },
          { key: "name", label: "Name" },
          { key: "current_value", label: "Price" },
          { key: "change_percent", label: "Change %" },
          { key: "category", label: "Category" },
          { key: "unit", label: "Unit" },
        ];
      case "BOND":
        return [
          { key: "symbol", label: "Symbol" },
          { key: "name", label: "Name" },
          { key: "current_value", label: "Yield" },
          { key: "change", label: "Change" },
          { key: "change_percent", label: "Change %" },
          { key: "maturity", label: "Maturity" },
        ];
      case "INDEX":
        return [
          { key: "symbol", label: "Symbol" },
          { key: "name", label: "Name" },
          { key: "current_value", label: "Value" },
          { key: "change_percent", label: "Change %" },
          { key: "country", label: "Country" },
          { key: "exchange", label: "Exchange" },
        ];
      case "ETF":
        return [
          { key: "symbol", label: "Symbol" },
          { key: "name", label: "Name" },
          { key: "category", label: "Category" },
          { key: "current_value", label: "Price" },
          { key: "change_percent", label: "Change %" },
          { key: "aum_cr", label: "AUM (₹Cr)" },
          { key: "ter", label: "TER %" },
          { key: "return_1y", label: "1Y %" },
          { key: "return_3y", label: "3Y %" },
          { key: "tracking_error", label: "Tracking Err %" },
        ];
      case "SIF":
        return [
          { key: "name", label: "Fund" },
          { key: "strategy_type", label: "Strategy" },
          { key: "risk_band", label: "Risk" },
          { key: "aum_cr", label: "AUM (₹Cr)" },
          { key: "alpha_3y", label: "Alpha 3Y" },
          { key: "max_drawdown", label: "Max DD %" },
          { key: "redemption_days", label: "Redemption Days" },
        ];
      case "PMS":
        return [
          { key: "name", label: "PMS" },
          { key: "aum_cr", label: "AUM (₹Cr)" },
          { key: "alpha_3y", label: "Alpha 3Y" },
          { key: "sharpe_ratio", label: "Sharpe" },
          { key: "max_drawdown", label: "Max DD %" },
          { key: "irr_inception", label: "IRR %" },
          { key: "client_count", label: "Clients" },
        ];
      case "AIF":
        return [
          { key: "name", label: "Fund" },
          { key: "category", label: "Category" },
          { key: "strategy", label: "Strategy" },
          { key: "vintage_year", label: "Vintage" },
          { key: "irr_target", label: "IRR Target %" },
          { key: "lock_in_years", label: "Lock-in" },
          { key: "min_investment_cr", label: "Min (₹Cr)" },
        ];
      default:
        return [
          { key: "symbol", label: "Symbol" },
          { key: "name", label: "Name" },
          { key: "current_value", label: "Value" },
          { key: "change_percent", label: "Change %" },
        ];
    }
  };

  const TEXT_FIELDS = new Set([
    "symbol",
    "name",
    "scheme_name",
    "sector",
    "category",
    "maturity",
    "unit",
    "exchange",
    "country",
    "fund_house",
    "scheme_category",
    "strategy_type",
    "risk_band",
    "strategy",
  ]);

  if (initialLoading) {
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
          Loading screening engine...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Tune sx={{ fontSize: 36, color: "primary.main" }} />
          <Typography variant="h4" fontWeight={800}>
            Advanced Screening
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Filter across 10 asset classes - Equities, Crypto, MF, ETF, SIF, PMS, AIF & more
        </Typography>
      </Box>

      {/* Quick Screens */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Bolt sx={{ color: "#f59e0b" }} />
            <Typography variant="h6" fontWeight={700}>
              Quick Screens
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {quickScreens.map((qs) => (
              <Chip
                key={qs.id}
                label={qs.name}
                onClick={() => runQuickScreen(qs)}
                variant={activeQuickScreen === qs.id ? "filled" : "outlined"}
                color={activeQuickScreen === qs.id ? "primary" : "default"}
                sx={{
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: 2,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Asset Class Selector */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Select Asset Class
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {assetClasses.map((ac) => (
              <Paper
                key={ac.key}
                elevation={selectedAssetClass === ac.key ? 4 : 0}
                onClick={() => setSelectedAssetClass(ac.key)}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  borderRadius: 2,
                  border: `2px solid ${
                    selectedAssetClass === ac.key
                      ? ASSET_CLASS_COLORS[ac.key] || theme.palette.primary.main
                      : "transparent"
                  }`,
                  backgroundColor:
                    selectedAssetClass === ac.key
                      ? alpha(
                          ASSET_CLASS_COLORS[ac.key] ||
                            theme.palette.primary.main,
                          0.08,
                        )
                      : theme.palette.background.paper,
                  transition: "all 0.2s",
                  minWidth: 140,
                  textAlign: "center",
                  "&:hover": {
                    borderColor:
                      ASSET_CLASS_COLORS[ac.key] || theme.palette.primary.main,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Typography fontSize={28}>{ac.icon}</Typography>
                <Typography fontWeight={700} fontSize={14}>
                  {ac.label}
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  {ac.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Filters */}
      {selectedAssetClass && (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FilterList sx={{ color: "primary.main" }} />
                <Typography variant="h6" fontWeight={700}>
                  Filters
                </Typography>
                {filters.length > 0 && (
                  <Chip
                    label={`${filters.length} active`}
                    size="small"
                    color="primary"
                  />
                )}
              </Box>
              <IconButton
                size="small"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={showFilters}>
              {filters.map((filter, idx) => {
                const paramDef = params.find((p) => p.field === filter.field);
                return (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 1.5,
                      flexWrap: "wrap",
                    }}
                  >
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Field</InputLabel>
                      <Select
                        value={filter.field}
                        label="Field"
                        onChange={(e) =>
                          updateFilter(idx, { field: e.target.value })
                        }
                      >
                        {params.map((p) => (
                          <MenuItem key={p.field} value={p.field}>
                            {p.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Operator</InputLabel>
                      <Select
                        value={filter.operator}
                        label="Operator"
                        onChange={(e) =>
                          updateFilter(idx, {
                            operator: e.target
                              .value as ScreeningFilter["operator"],
                          })
                        }
                      >
                        {paramDef?.type === "select" ? (
                          <MenuItem value="eq">Equals</MenuItem>
                        ) : (
                          [
                            <MenuItem key="gt" value="gt">
                              Greater than
                            </MenuItem>,
                            <MenuItem key="lt" value="lt">
                              Less than
                            </MenuItem>,
                            <MenuItem key="gte" value="gte">
                              ≥
                            </MenuItem>,
                            <MenuItem key="lte" value="lte">
                              ≤
                            </MenuItem>,
                            <MenuItem key="eq" value="eq">
                              Equals
                            </MenuItem>,
                          ]
                        )}
                      </Select>
                    </FormControl>

                    {paramDef?.type === "select" && paramDef?.options ? (
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Value</InputLabel>
                        <Select
                          value={String(filter.value)}
                          label="Value"
                          onChange={(e) =>
                            updateFilter(idx, { value: e.target.value })
                          }
                        >
                          {paramDef.options.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        size="small"
                        type="number"
                        label="Value"
                        value={filter.value}
                        onChange={(e) =>
                          updateFilter(idx, { value: e.target.value })
                        }
                        sx={{ width: 160 }}
                      />
                    )}

                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeFilter(idx)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}

              <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
                <Button
                  startIcon={<Add />}
                  variant="outlined"
                  size="small"
                  onClick={addFilter}
                >
                  Add Filter
                </Button>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {params.map((p) => (
                      <MenuItem key={p.field} value={p.field}>
                        {p.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Order</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Order"
                    onChange={(e) =>
                      setSortOrder(e.target.value as "asc" | "desc")
                    }
                  >
                    <MenuItem value="desc">Descending</MenuItem>
                    <MenuItem value="asc">Ascending</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  startIcon={
                    loading ? <CircularProgress size={16} /> : <Search />
                  }
                  onClick={runScreening}
                  disabled={loading}
                  sx={{ fontWeight: 700 }}
                >
                  {loading ? "Screening..." : "Run Screen"}
                </Button>

                {filters.length > 0 && (
                  <Button
                    variant="text"
                    color="error"
                    size="small"
                    onClick={() => {
                      setFilters([]);
                      setResults([]);
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Results
                <Chip
                  label={`${totalResults} instruments`}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Tooltip title="Refresh">
                <IconButton onClick={runScreening} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  "& th, & td": {
                    py: 1.5,
                    px: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                  },
                  "& th": {
                    fontWeight: 700,
                    color: "text.secondary",
                    textAlign: "left",
                    position: "sticky",
                    top: 0,
                    backgroundColor: theme.palette.background.paper,
                  },
                  "& tr:hover td": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>#</th>
                    {getColumns().map((col) => (
                      <th
                        key={col.key}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          if (sortBy === col.key) {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy(col.key);
                            setSortOrder("desc");
                          }
                          setTimeout(runScreening, 100);
                        }}
                      >
                        {col.label}
                        {sortBy === col.key &&
                          (sortOrder === "asc" ? " ↑" : " ↓")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ color: theme.palette.text.secondary }}>
                        {idx + 1}
                      </td>
                      {getColumns().map((col) => {
                        const val = (row as Record<string, unknown>)[col.key];
                        const isChangeCol =
                          col.key.includes("change") ||
                          col.key.includes("percent");
                        const numVal = parseFloat(String(val));
                        const positive = !isNaN(numVal) && numVal >= 0;

                        return (
                          <td
                            key={col.key}
                            style={{
                              fontWeight: TEXT_FIELDS.has(col.key) ? 600 : 400,
                              color: isChangeCol
                                ? positive
                                  ? "#10b981"
                                  : "#ef4444"
                                : undefined,
                              maxWidth: 250,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {isChangeCol && !isNaN(numVal)
                              ? `${positive ? "+" : ""}${numVal.toFixed(2)}%`
                              : TEXT_FIELDS.has(col.key)
                                ? String(val ?? "—")
                                : formatValue(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Empty states */}
      {!loading && results.length === 0 && selectedAssetClass && (
        <Card sx={{ borderRadius: 3, textAlign: "center", py: 6 }}>
          <Search sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Configure your filters and click "Run Screen"
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Or try one of the Quick Screens above for instant results
          </Typography>
        </Card>
      )}

      {!selectedAssetClass && !initialLoading && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Select an asset class above to start screening across 50+ parameters.
          Use Quick Screens for instant popular filters.
        </Alert>
      )}
    </Box>
  );
};

export default Screening;
