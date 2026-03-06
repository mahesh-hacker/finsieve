/**
 * Bonds & G-Sec Routes
 * India Government Securities (G-Sec) yields
 * Data: RBI/FBIL reference rates (static with fallback)
 */

import express from "express";
import yahooFinanceService from "../services/yahooFinance.service.js";

const router = express.Router();

// ─── ALL INDIA G-SEC BONDS ─────────────────────────────────
router.get("/", (req, res) => {
  try {
    const bonds = yahooFinanceService.getIndiaBonds();
    res.json({ success: true, data: bonds, count: bonds.length });
  } catch (error) {
    console.error("❌ India bonds error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch bond data" });
  }
});

// ─── YIELD CURVE DATA ──────────────────────────────────────
router.get("/yield-curve", (req, res) => {
  try {
    const bonds = yahooFinanceService.getIndiaBonds();

    const maturityOrder = ["91D", "182D", "364D", "2Y", "5Y", "10Y", "30Y"];
    const yieldCurve = maturityOrder
      .map((maturity) => {
        const bond = bonds.find((b) => b.maturity === maturity);
        return bond
          ? { maturity, yield_value: bond.yield_value, name: bond.name, change: bond.change, change_percent: bond.change_percent }
          : null;
      })
      .filter(Boolean);

    // Inversion: check if 2Y yield > 10Y yield
    const twoYear = yieldCurve.find((y) => y.maturity === "2Y");
    const tenYear = yieldCurve.find((y) => y.maturity === "10Y");
    const isInverted = twoYear && tenYear ? twoYear.yield_value > tenYear.yield_value : false;

    res.json({
      success: true,
      data: {
        curve: yieldCurve,
        isInverted,
        spread_2_10: tenYear && twoYear
          ? parseFloat((tenYear.yield_value - twoYear.yield_value).toFixed(3))
          : null,
      },
    });
  } catch (error) {
    console.error("❌ Yield curve error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch yield curve" });
  }
});

export default router;
