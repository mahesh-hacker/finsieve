import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  alpha,
  useTheme,
  TextField,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  Paper,
  Alert,
} from "@mui/material";
import {
  Search,
  Close,
  CompareArrows,
  Add,
  BarChart,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";
import comparisonService, {
  type SearchResult,
  type ComparisonResult,
} from "../../services/comparison/comparisonService";
import toast from "react-hot-toast";

const ASSET_CLASS_LABELS: Record<string, string> = {
  US_EQUITY: "🇺🇸 US Equity",
  INDIAN_EQUITY: "🇮🇳 Indian Equity",
  CRYPTO: "🪙 Crypto",
  MUTUAL_FUND: "📊 Mutual Fund",
  COMMODITY: "🛢️ Commodity",
  BOND: "🏦 Bond",
  INDEX: "📈 Index",
};

const ASSET_CLASS_COLORS: Record<string, string> = {
  US_EQUITY: "#3b82f6",
  INDIAN_EQUITY: "#f97316",
  CRYPTO: "#f59e0b",
  MUTUAL_FUND: "#10b981",
  COMMODITY: "#ef4444",
  BOND: "#6366f1",
  INDEX: "#8b5cf6",
};

interface InstrumentData {
  symbol: string;
  name: string;
  assetClass: string;
  metrics: Record<string, unknown>;
  [key: string]: unknown;
}

interface SelectedInstrument {
  symbol: string;
  name: string;
  assetClass: string;
}

const Comparison = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SelectedInstrument[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);

  // Debounced search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await comparisonService.searchForComparison(query) as { data?: SearchResult[] };
      if (res?.data) setSearchResults(res.data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  }, []);

  // Add instrument to comparison
  const addInstrument = (result: SearchResult) => {
    if (selected.length >= 5) {
      toast.error("Maximum 5 instruments for comparison");
      return;
    }
    if (
      selected.some(
        (s) =>
          s.symbol === result.symbol && s.assetClass === result.asset_class,
      )
    ) {
      toast.error("Already added");
      return;
    }
    setSelected([
      ...selected,
      {
        symbol: result.symbol,
        name: result.name,
        assetClass: result.asset_class,
      },
    ]);
    setSearchQuery("");
    setSearchResults([]);
    toast.success(`Added ${result.symbol}`);
  };

  // Remove instrument
  const removeInstrument = (index: number) => {
    setSelected(selected.filter((_, i) => i !== index));
    setComparison(null);
  };

  // Run comparison
  const runComparison = useCallback(async () => {
    if (selected.length < 2) {
      toast.error("Select at least 2 instruments to compare");
      return;
    }
    setComparing(true);
    try {
      const res = await comparisonService.compareInstruments(
        selected.map((s) => ({
          symbol: s.symbol,
          asset_class: s.assetClass,
        })),
      );
      const d = res as { data?: ComparisonResult };
      if (d?.data) {
        setComparison(d.data);
        toast.success("Comparison ready!");
      }
    } catch (error) {
      console.error("Comparison error:", error);
      toast.error("Comparison failed");
    } finally {
      setComparing(false);
    }
  }, [selected]);

  // Format metric value
  const formatMetricValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    const num =
      typeof value === "string" ? parseFloat(value) : (value as number);
    if (isNaN(num)) return String(value);
    if (Math.abs(num) >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Find best/worst for a metric across instruments
  const getExtremes = (
    instruments: ComparisonResult["instruments"],
    key: string,
  ) => {
    const values = (instruments as InstrumentData[])
      .map((inst) => ({
        symbol: String(inst.symbol),
        val: parseFloat(String((inst.metrics as Record<string, unknown>)?.[key] ?? NaN)),
      }))
      .filter((v) => !isNaN(v.val));
    if (values.length === 0) return { best: "", worst: "" };
    values.sort((a, b) => b.val - a.val);
    return { best: values[0].symbol, worst: values[values.length - 1].symbol };
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <CompareArrows sx={{ fontSize: 36, color: "primary.main" }} />
          <Typography variant="h4" fontWeight={800}>
            Investment Comparison
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Compare up to 5 instruments side-by-side across any asset class —
          stocks vs crypto vs mutual funds? Why not.
        </Typography>
      </Box>

      {/* Selected Instruments */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Selected Instruments ({selected.length}/5)
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {selected.map((inst, idx) => (
              <Chip
                key={`${inst.symbol}-${inst.assetClass}`}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography fontSize={13} fontWeight={700}>
                      {inst.symbol}
                    </Typography>
                    <Typography
                      fontSize={11}
                      sx={{
                        color: ASSET_CLASS_COLORS[inst.assetClass] || "#888",
                        fontWeight: 600,
                      }}
                    >
                      {inst.assetClass.replace("_", " ")}
                    </Typography>
                  </Box>
                }
                onDelete={() => removeInstrument(idx)}
                sx={{
                  borderRadius: 2,
                  borderColor: ASSET_CLASS_COLORS[inst.assetClass] || "#888",
                  borderWidth: 2,
                  borderStyle: "solid",
                }}
              />
            ))}
            {selected.length < 5 && (
              <Chip
                label="+ Add instrument"
                variant="outlined"
                sx={{ borderStyle: "dashed", cursor: "default" }}
              />
            )}
          </Box>

          {/* Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search stocks, crypto, funds, commodities, bonds, indices..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searching ? (
                  <InputAdornment position="end">
                    <CircularProgress size={18} />
                  </InputAdornment>
                ) : searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{ mb: 1 }}
          />

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <Paper
              elevation={4}
              sx={{
                maxHeight: 300,
                overflow: "auto",
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {searchResults.map((result, idx) => (
                <Box
                  key={`${result.symbol}-${result.asset_class}-${idx}`}
                  onClick={() => addInstrument(result)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                    cursor: "pointer",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    },
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  <Box>
                    <Typography fontWeight={700} fontSize={14}>
                      {result.symbol}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      {result.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={
                        ASSET_CLASS_LABELS[result.asset_class] ||
                        result.asset_class
                      }
                      size="small"
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: alpha(
                          ASSET_CLASS_COLORS[result.asset_class] || "#888",
                          0.12,
                        ),
                        color: ASSET_CLASS_COLORS[result.asset_class] || "#888",
                      }}
                    />
                    <Add fontSize="small" color="primary" />
                  </Box>
                </Box>
              ))}
            </Paper>
          )}

          {/* Compare Button */}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={
                comparing ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <BarChart />
                )
              }
              onClick={runComparison}
              disabled={selected.length < 2 || comparing}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              {comparing ? "Comparing..." : "Compare Now"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparison && comparison.instruments.length > 0 && (
        <>
          {/* Summary Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: `repeat(${comparison.instruments.length}, 1fr)`,
              },
              gap: 2,
              mb: 3,
            }}
          >
            {(comparison.instruments as InstrumentData[]).map((inst) => {
              const changeVal = parseFloat(
                String(
                  (inst.metrics as Record<string, unknown>)?.change_percent ??
                    0,
                ),
              );
              const positive = changeVal >= 0;
              return (
                <Card
                  key={String(inst.symbol)}
                  sx={{
                    borderRadius: 3,
                    borderTop: `4px solid ${ASSET_CLASS_COLORS[String(inst.assetClass)] || theme.palette.primary.main}`,
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography fontWeight={800} fontSize={18}>
                        {String(inst.symbol)}
                      </Typography>
                      <Chip
                        label={String(inst.assetClass).replace("_", " ")}
                        size="small"
                        sx={{
                          fontSize: 10,
                          fontWeight: 700,
                          color:
                            ASSET_CLASS_COLORS[String(inst.assetClass)] ||
                            "#888",
                          backgroundColor: alpha(
                            ASSET_CLASS_COLORS[String(inst.assetClass)] ||
                              "#888",
                            0.1,
                          ),
                        }}
                      />
                    </Box>
                    <Typography
                      fontSize={13}
                      color="text.secondary"
                      noWrap
                      sx={{ mb: 1 }}
                    >
                      {String(inst.name)}
                    </Typography>
                    <Typography fontWeight={700} fontSize={24}>
                      {formatMetricValue(
                        (inst.metrics as Record<string, unknown>)
                          ?.current_value,
                      )}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mt: 0.5,
                      }}
                    >
                      {positive ? (
                        <TrendingUp sx={{ fontSize: 18, color: "#10b981" }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 18, color: "#ef4444" }} />
                      )}
                      <Typography
                        fontWeight={700}
                        fontSize={14}
                        color={positive ? "#10b981" : "#ef4444"}
                      >
                        {positive ? "+" : ""}
                        {changeVal.toFixed(2)}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {/* Detailed Metrics Table */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Detailed Metrics
              </Typography>
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
                      <th>Metric</th>
                      {(comparison.instruments as InstrumentData[]).map(
                        (inst) => (
                          <th key={String(inst.symbol)}>
                            {String(inst.symbol)}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Gather all unique metric keys across all instruments
                      const metricKeys = new Set<string>();
                      const typedInstruments =
                        comparison.instruments as InstrumentData[];
                      typedInstruments.forEach((inst) => {
                        if (inst.metrics) {
                          Object.keys(inst.metrics).forEach((k) =>
                            metricKeys.add(k),
                          );
                        }
                      });
                      const NICE_LABELS: Record<string, string> = {
                        current_value: "Price / Value",
                        change: "Change",
                        change_percent: "Change %",
                        market_cap: "Market Cap",
                        volume: "Volume",
                        pe_ratio: "P/E Ratio",
                        eps: "EPS",
                        dividend_yield: "Dividend Yield",
                        week52_high: "52W High",
                        week52_low: "52W Low",
                        sector: "Sector",
                        total_volume: "Total Volume",
                        change_7d: "7D Change",
                        market_cap_rank: "Rank",
                        nav: "NAV",
                        fund_house: "Fund House",
                        scheme_category: "Category",
                        category: "Category",
                        maturity: "Maturity",
                        country: "Country",
                        exchange: "Exchange",
                      };
                      return Array.from(metricKeys).map((key) => {
                        const extr = getExtremes(comparison.instruments, key);
                        return (
                          <tr key={key}>
                            <td style={{ fontWeight: 600 }}>
                              {NICE_LABELS[key] ||
                                key
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </td>
                            {typedInstruments.map((inst) => {
                              const val = (inst.metrics as Record<string, unknown>)?.[key];
                              const isBest = String(inst.symbol) === extr.best;
                              const isChange =
                                key.includes("change") ||
                                key.includes("percent");
                              const numVal = parseFloat(String(val));
                              const positive = !isNaN(numVal) && numVal >= 0;

                              return (
                                <td
                                  key={String(inst.symbol)}
                                  style={{
                                    fontWeight: isBest ? 700 : 400,
                                    color: isChange
                                      ? positive
                                        ? "#10b981"
                                        : "#ef4444"
                                      : undefined,
                                    backgroundColor: isBest
                                      ? alpha("#10b981", 0.06)
                                      : undefined,
                                  }}
                                >
                                  {isChange && !isNaN(numVal)
                                    ? `${positive ? "+" : ""}${numVal.toFixed(2)}%`
                                    : typeof val === "string" &&
                                        isNaN(parseFloat(val))
                                      ? val || "—"
                                      : formatMetricValue(val)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!comparison && selected.length === 0 && (
        <Card sx={{ borderRadius: 3, textAlign: "center", py: 8 }}>
          <CompareArrows sx={{ fontSize: 72, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Search and add instruments to start comparing
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Compare stocks vs crypto, mutual funds vs indices — any combination
            across asset classes
          </Typography>
        </Card>
      )}

      {selected.length > 0 && !comparison && !comparing && (
        <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
          Add at least 2 instruments and click "Compare Now" to see side-by-side
          metrics.
        </Alert>
      )}
    </Box>
  );
};

export default Comparison;
