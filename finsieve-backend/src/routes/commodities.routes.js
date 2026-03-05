/**
 * Commodities Routes
 * Gold, Silver, Oil, Natural Gas, Agriculture via Yahoo Finance
 */

import express from "express";
import yahooFinanceService from "../services/yahooFinance.service.js";

const router = express.Router();

// ─── ALL COMMODITIES ───────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const commodities = await yahooFinanceService.getCommodities();
    res.json({ success: true, data: commodities, count: commodities.length });
  } catch (error) {
    console.error("❌ Commodities error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch commodities" });
  }
});

// ─── COMMODITIES BY CATEGORY ───────────────────────────────
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const commodities =
      await yahooFinanceService.getCommoditiesByCategory(category);
    res.json({
      success: true,
      data: commodities,
      count: commodities.length,
      category,
    });
  } catch (error) {
    console.error("❌ Commodities by category error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch commodities by category",
      });
  }
});

// ─── COMMODITY HISTORY ─────────────────────────────────────
router.get("/:symbol/history", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = "1mo", interval = "1d" } = req.query;

    // Map our symbol back to Yahoo symbol
    let yahooSymbol = symbol;
    for (const [ySymbol, meta] of Object.entries(
      yahooFinanceService.commodities,
    )) {
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
      `❌ Commodity history error for ${req.params.symbol}:`,
      error.message,
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch commodity history" });
  }
});

export default router;
