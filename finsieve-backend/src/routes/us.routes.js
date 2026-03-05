/**
 * US Market Routes
 * Covers: US Indices, Top Stocks, Stock Detail, Search, Historical Data
 */

import express from "express";
import yahooFinanceService from "../services/yahooFinance.service.js";
import usIndicesUpdateService from "../services/usIndicesUpdate.service.js";

const router = express.Router();

// ─── MANUAL UPDATE US INDICES ──────────────────────────────
router.get("/update", async (req, res) => {
  try {
    console.log("📡 Manual US market data update triggered");

    const result = await usIndicesUpdateService.updateUSIndices();

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Updated ${result.updated} US indices`,
        data: {
          updated: result.updated,
          total: result.total,
          timestamp: result.timestamp,
          errors: result.errors,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to update US indices",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("❌ Error in US update endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// ─── US INDICES ────────────────────────────────────────────
router.get("/indices", async (req, res) => {
  try {
    const indices = await yahooFinanceService.getUSIndices();
    res.json({ success: true, data: indices, count: indices.length });
  } catch (error) {
    console.error("❌ US indices error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch US indices" });
  }
});

// ─── TOP US STOCKS ─────────────────────────────────────────
router.get("/stocks", async (req, res) => {
  try {
    const stocks = await yahooFinanceService.getTopUSStocks();
    res.json({ success: true, data: stocks, count: stocks.length });
  } catch (error) {
    console.error("❌ US stocks error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch US stocks" });
  }
});

// ─── SEARCH STOCKS ─────────────────────────────────────────
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q)
      return res
        .status(400)
        .json({ success: false, message: "Query parameter 'q' is required" });

    const results = await yahooFinanceService.searchUSStocks(q);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error("❌ US search error:", error.message);
    res.status(500).json({ success: false, message: "Search failed" });
  }
});

// ─── STOCK DETAIL ──────────────────────────────────────────
router.get("/stocks/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const detail = await yahooFinanceService.getStockDetail(
      symbol.toUpperCase(),
    );
    res.json({ success: true, data: detail });
  } catch (error) {
    console.error(
      `❌ Stock detail error for ${req.params.symbol}:`,
      error.message,
    );
    res.status(404).json({
      success: false,
      message: `Stock ${req.params.symbol} not found`,
    });
  }
});

// ─── HISTORICAL DATA ───────────────────────────────────────
router.get("/stocks/:symbol/history", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = "1mo", interval = "1d" } = req.query;

    const data = await yahooFinanceService.getHistoricalData(
      symbol.toUpperCase(),
      period,
      interval,
    );
    res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error(`❌ History error for ${req.params.symbol}:`, error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch historical data" });
  }
});

// ─── MARKET STATUS ─────────────────────────────────────────
router.get("/status", (req, res) => {
  const isOpen = yahooFinanceService.isUSMarketOpen();
  res.json({
    success: true,
    data: {
      market: "US",
      isOpen,
      status: isOpen ? "OPEN" : "CLOSED",
      tradingHours: "9:30 AM - 4:00 PM ET (Mon-Fri)",
    },
  });
});

export default router;
