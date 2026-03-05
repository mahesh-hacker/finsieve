/**
 * ChartModal
 *
 * Full-screen modal that slides up when the user clicks on any index card or
 * stock row. Shows TradingChart with live WS updates + OHLC + indicators.
 *
 * Usage:
 *   <ChartModal
 *     open={!!selected}
 *     symbol="NSE:RELIANCE"
 *     title="Reliance Industries"
 *     ltp={2450.5}
 *     change={12.3}
 *     changePercent={0.5}
 *     onClose={() => setSelected(null)}
 *   />
 */

import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogTitle,
  IconButton, Box, Typography, Chip,
  useTheme, useMediaQuery, Slide,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { Close } from "@mui/icons-material";
import TradingChart from "./TradingChart";
import type { Interval } from "./TradingChart";
import { resolveChartSymbol } from "./chartSymbols";

// ─── Slide-up transition ──────────────────────────────────────────────────────
const SlideUp = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
  (props, ref) => <Slide direction="up" ref={ref} {...props} />
);
SlideUp.displayName = "SlideUp";

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  open:           boolean;
  onClose:        () => void;
  symbol:         string;           // DB symbol, e.g. "NIFTY" or "RELIANCE"
  title:          string;
  country?:       string;
  ltp?:           number;
  change?:        number;
  changePercent?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ChartModal: React.FC<Props> = ({
  open, onClose, symbol, title, country,
  ltp: initialLtp, change: initialChange, changePercent: initialChangePct,
}) => {
  const theme     = useTheme();
  const isDark    = theme.palette.mode === "dark";
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [ltp,        setLtp]        = useState(initialLtp       ?? 0);
  const [change,     setChange]     = useState(initialChange     ?? 0);
  const [changePct,  setChangePct]  = useState(initialChangePct ?? 0);
  const [interval] = useState<Interval>("day");

  const chartSymbol = resolveChartSymbol(symbol, country);
  const isPositive  = change >= 0;
  const changeColor = isPositive ? "#10b981" : "#ef4444";

  const fmtPrice = (v: number) =>
    v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xl"
      fullWidth
      TransitionComponent={SlideUp}
      PaperProps={{
        sx: {
          bgcolor:      isDark ? "#0d1117" : "#f4f5f7",
          backgroundImage: "none",
          borderRadius: fullScreen ? 0 : 2,
          height:       fullScreen ? "100%" : "90vh",
          maxHeight:    "90vh",
        },
      }}
    >
      {/* ── Header ── */}
      <DialogTitle
        sx={{
          display:    "flex",
          alignItems: "center",
          gap:        2,
          py:         1.5,
          px:         2,
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          flexWrap:   "wrap",
        }}
      >
        {/* Symbol + price */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
              {chartSymbol}
            </Typography>
          </Box>
          {ltp > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                {fmtPrice(ltp)}
              </Typography>
              <Chip
                label={`${isPositive ? "+" : ""}${fmtPrice(change)} (${isPositive ? "+" : ""}${changePct.toFixed(2)}%)`}
                size="small"
                sx={{
                  bgcolor:    changeColor + "22",
                  color:      changeColor,
                  fontWeight: 700,
                  fontSize:   "0.7rem",
                }}
              />
            </Box>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" onClick={onClose} title="Close">
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Chart ── */}
      <DialogContent sx={{ p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <TradingChart
          symbol={chartSymbol}
          title={title}
          initialInterval={interval}
          darkMode={isDark}
          height={fullScreen ? window.innerHeight - 130 : 600}
          showOrderPanel={false}
          onPriceChange={(newLtp, newChange, newChangePct) => {
            setLtp(newLtp);
            setChange(newChange);
            setChangePct(newChangePct);
          }}
          style={{ flex: 1 }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ChartModal;
