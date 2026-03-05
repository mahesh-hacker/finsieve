/**
 * Bonds & Treasury Routes
 * US Treasury Yields via Yahoo Finance
 */

import express from "express";
import yahooFinanceService from "../services/yahooFinance.service.js";

const router = express.Router();

// ─── ALL BONDS / TREASURY YIELDS ───────────────────────────
router.get("/", async (req, res) => {
  try {
    const bonds = await yahooFinanceService.getBonds();
    res.json({ success: true, data: bonds, count: bonds.length });
  } catch (error) {
    console.error("❌ Bonds error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bond data" });
  }
});

// ─── YIELD CURVE DATA ──────────────────────────────────────
router.get("/yield-curve", async (req, res) => {
  try {
    const bonds = await yahooFinanceService.getBonds();

    // Sort by maturity for yield curve
    const maturityOrder = ["3M", "2Y", "5Y", "10Y", "30Y"];
    const yieldCurve = maturityOrder
      .map((maturity) => {
        const bond = bonds.find((b) => b.maturity === maturity);
        return bond
          ? {
              maturity,
              yield_value: bond.yield_value || bond.current_value,
              name: bond.name,
              change: bond.change,
              change_percent: bond.change_percent,
            }
          : null;
      })
      .filter(Boolean);

    // Check for yield curve inversion (2Y > 10Y)
    const twoYear = yieldCurve.find((y) => y.maturity === "2Y");
    const tenYear = yieldCurve.find((y) => y.maturity === "10Y");
    const isInverted =
      twoYear && tenYear ? twoYear.yield_value > tenYear.yield_value : false;

    res.json({
      success: true,
      data: {
        curve: yieldCurve,
        isInverted,
        spread_2_10:
          tenYear && twoYear
            ? parseFloat((tenYear.yield_value - twoYear.yield_value).toFixed(3))
            : null,
      },
    });
  } catch (error) {
    console.error("❌ Yield curve error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch yield curve" });
  }
});

// ─── BOND HISTORY ──────────────────────────────────────────
router.get("/:symbol/history", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = "1y", interval = "1d" } = req.query;

    // Map our symbol to Yahoo symbol
    let yahooSymbol = symbol;
    for (const [ySymbol, meta] of Object.entries(yahooFinanceService.bonds)) {
      if (meta.symbol === symbol.toUpperCase()) {
        yahooSymbol = ySymbol;
        break;
      }
    }

    const data = await yahooFinanceService.getHistoricalData(
      yahooSymbol,
      period,
      interval,
    );
    res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error(
      `❌ Bond history error for ${req.params.symbol}:`,
      error.message,
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bond history" });
  }
});

export default router;
