import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Refresh,
  AccountBalance,
} from "@mui/icons-material";
import mutualFundsService, {
  type MutualFund,
  type MutualFundReturns,
} from "../../services/mutualfunds/mutualFundsService";
import toast from "react-hot-toast";

const MutualFunds = () => {
  const theme = useTheme();
  const [funds, setFunds] = useState<MutualFund[]>([]);
  const [returnsMap, setReturnsMap] = useState<
    Record<string, MutualFundReturns>
  >({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      const res = await mutualFundsService.getPopularFunds() as { data?: MutualFund[] };
      if (res?.data) {
        setFunds(res.data);
        const returnsPromises = res.data
          .slice(0, 15)
          .map(async (f: MutualFund) => {
            try {
              const rRes = await mutualFundsService.getFundReturns(
                f.scheme_code,
              ) as { data?: MutualFundReturns };
              if (rRes?.data) return { code: f.scheme_code, data: rRes.data };
            } catch {
              /* ignore individual failures */
            }
            return null;
          });
        const results = await Promise.all(returnsPromises);
        const map: Record<string, MutualFundReturns> = {};
        results.forEach((r) => {
          if (r) map[r.code] = r.data;
        });
        setReturnsMap(map);
      }
    } catch (error) {
      console.error("Error fetching MF data:", error);
      if (isInitial) toast.error("Failed to load mutual fund data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 3600000); // hourly
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = funds.filter(
    (f) =>
      f.scheme_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.fund_house?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Group by fund house
  const fundHouses = [
    ...new Set(funds.map((f) => f.fund_house).filter(Boolean)),
  ];

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
          Loading mutual fund data...
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
            <AccountBalance sx={{ color: "#6366f1" }} /> Mutual Funds
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            AMFI Registered • Popular Indian Mutual Funds • NAV & Returns
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

      {/* Summary */}
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
        <Card
          sx={{
            background: `linear-gradient(135deg, ${alpha("#6366f1", 0.08)} 0%, transparent 100%)`,
            borderTop: "3px solid #6366f1",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              Total Funds
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
              {funds.length}
            </Typography>
          </CardContent>
        </Card>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${alpha("#10b981", 0.08)} 0%, transparent 100%)`,
            borderTop: "3px solid #10b981",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              NAV Up Today
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, mt: 0.5, color: "#10b981" }}
            >
              {funds.filter((f) => f.change_percent > 0).length}
            </Typography>
          </CardContent>
        </Card>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${alpha("#ef4444", 0.08)} 0%, transparent 100%)`,
            borderTop: "3px solid #ef4444",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              NAV Down Today
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, mt: 0.5, color: "#ef4444" }}
            >
              {funds.filter((f) => f.change_percent < 0).length}
            </Typography>
          </CardContent>
        </Card>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${alpha("#f59e0b", 0.08)} 0%, transparent 100%)`,
            borderTop: "3px solid #f59e0b",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              Fund Houses
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
              {fundHouses.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Search */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Popular Funds
        </Typography>
        <TextField
          size="small"
          placeholder="Search funds or AMC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 300 }}
        />
      </Box>

      {/* Fund Table */}
      <Card sx={{ overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="table"
            sx={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}
          >
            <Box
              component="thead"
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}
            >
              <Box component="tr">
                {[
                  "#",
                  "Fund Name",
                  "AMC",
                  "Category",
                  "NAV (₹)",
                  "1D Change",
                  "1Y Return",
                  "3Y CAGR",
                  "5Y CAGR",
                  "NAV Date",
                ].map((h) => (
                  <Box
                    component="th"
                    key={h}
                    sx={{
                      p: 1.5,
                      textAlign: "left",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {filtered.map((f, i) => {
                const pos = f.change_percent >= 0;
                const clr = pos ? "#10b981" : "#ef4444";
                const ret = returnsMap[f.scheme_code];
                const r1y = ret?.returns?.["1Y"];
                const r3y = ret?.returns?.["3Y"];
                const r5y = ret?.returns?.["5Y"];
                return (
                  <Box
                    component="tr"
                    key={f.scheme_code}
                    sx={{
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      },
                      transition: "background 0.15s",
                    }}
                  >
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        color: "text.secondary",
                        fontSize: "0.8rem",
                      }}
                    >
                      {i + 1}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontWeight: 600,
                        maxWidth: 300,
                        fontSize: "0.85rem",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 300,
                        }}
                      >
                        {f.scheme_name}
                      </Typography>
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: "0.8rem",
                        color: "text.secondary",
                      }}
                    >
                      {f.fund_house?.split(" ").slice(0, 2).join(" ")}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Chip
                        label={f.scheme_category || f.scheme_type || "—"}
                        size="small"
                        sx={{ fontSize: "0.65rem", height: 20 }}
                      />
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontWeight: 700,
                      }}
                    >
                      ₹{f.nav?.toFixed(2)}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Chip
                        label={`${pos ? "+" : ""}${f.change_percent?.toFixed(2)}%`}
                        size="small"
                        sx={{
                          bgcolor: alpha(clr, 0.1),
                          color: clr,
                          fontWeight: 700,
                          fontSize: "0.75rem",
                        }}
                        icon={
                          pos ? (
                            <TrendingUp sx={{ fontSize: 14 }} />
                          ) : (
                            <TrendingDown sx={{ fontSize: 14 }} />
                          )
                        }
                      />
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontWeight: 600,
                        color: r1y
                          ? r1y.absolute >= 0
                            ? "#10b981"
                            : "#ef4444"
                          : "text.secondary",
                        fontSize: "0.85rem",
                      }}
                    >
                      {r1y
                        ? `${r1y.absolute >= 0 ? "+" : ""}${r1y.absolute.toFixed(2)}%`
                        : "—"}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontWeight: 600,
                        color: r3y?.cagr
                          ? r3y.cagr >= 0
                            ? "#10b981"
                            : "#ef4444"
                          : "text.secondary",
                        fontSize: "0.85rem",
                      }}
                    >
                      {r3y?.cagr
                        ? `${r3y.cagr >= 0 ? "+" : ""}${r3y.cagr.toFixed(2)}%`
                        : "—"}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontWeight: 600,
                        color: r5y?.cagr
                          ? r5y.cagr >= 0
                            ? "#10b981"
                            : "#ef4444"
                          : "text.secondary",
                        fontSize: "0.85rem",
                      }}
                    >
                      {r5y?.cagr
                        ? `${r5y.cagr >= 0 ? "+" : ""}${r5y.cagr.toFixed(2)}%`
                        : "—"}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: "0.8rem",
                        color: "text.secondary",
                      }}
                    >
                      {f.nav_date || "—"}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
        {filtered.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              {searchQuery
                ? `No funds found matching "${searchQuery}"`
                : "No data available"}
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default MutualFunds;
