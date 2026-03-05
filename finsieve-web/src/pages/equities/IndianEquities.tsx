import { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
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
} from "@mui/material";
import {
  ArrowBack,
  OpenInNew,
} from "@mui/icons-material";
import { SECTORS, SECTOR_ICONS, getStocksBySector, type IndianStock } from "../../data/indianStocksData";

const IndianEquities = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const stockCount = (sector: string) => getStocksBySector(sector).length;

  const openNSE = (symbol: string) =>
    window.open(`https://www.nseindia.com/get-quotes/equity?symbol=${symbol}`, "_blank", "noopener");

  if (selectedSector) {
    const stocks = getStocksBySector(selectedSector);
    return (
      <Box sx={{ pb: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Tooltip title="Back to Sectors">
            <IconButton onClick={() => setSelectedSector(null)} size="small" sx={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
              <ArrowBack sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {SECTOR_ICONS[selectedSector]} {selectedSector}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {stocks.length} stocks · NSE &amp; BSE
            </Typography>
          </Box>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.05)" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1" }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1" }}>NSE Symbol</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1" }}>BSE Code</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1" }}>Market Cap</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1" }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "#6366f1", width: 40 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stocks.map((stock: IndianStock) => (
                <TableRow
                  key={stock.symbol}
                  hover
                  sx={{ "&:last-child td": { border: 0 }, cursor: "default" }}
                >
                  <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{stock.name}</TableCell>
                  <TableCell>
                    <Chip label={stock.symbol} size="small" sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: 11, bgcolor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)", color: "#6366f1" }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{stock.bse}</TableCell>
                  <TableCell>
                    <Chip
                      label={stock.cap}
                      size="small"
                      sx={{
                        fontSize: 10,
                        fontWeight: 600,
                        bgcolor: stock.cap === "Large Cap"
                          ? alpha("#10b981", 0.1)
                          : alpha("#f59e0b", 0.1),
                        color: stock.cap === "Large Cap" ? "#10b981" : "#f59e0b",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: "text.secondary", maxWidth: 280 }}>{stock.desc}</TableCell>
                  <TableCell>
                    <Tooltip title="View on NSE">
                      <IconButton size="small" onClick={() => openNSE(stock.symbol)}>
                        <OpenInNew sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Indian Equities
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          NSE &amp; BSE · {SECTORS.length} sectors · Select a sector to browse stocks
        </Typography>
      </Box>

      {/* Sector Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        {SECTORS.map((sector) => {
          const count = stockCount(sector);
          const icon = SECTOR_ICONS[sector] ?? "📊";
          return (
            <Card
              key={sector}
              elevation={0}
              sx={{
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                borderRadius: 2,
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: alpha("#6366f1", 0.4),
                  boxShadow: `0 4px 24px ${alpha("#6366f1", 0.12)}`,
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardActionArea onClick={() => setSelectedSector(sector)} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography sx={{ fontSize: 28, mb: 1, lineHeight: 1 }}>{icon}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4, mb: 0.5 }}>
                    {sector}
                  </Typography>
                  <Chip
                    label={`${count} stocks`}
                    size="small"
                    sx={{
                      fontSize: 10,
                      fontWeight: 600,
                      height: 20,
                      bgcolor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                      color: "#6366f1",
                    }}
                  />
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default IndianEquities;
