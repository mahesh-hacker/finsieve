/**
 * Global Indices Routes
 * Live data for 20+ global stock market indices via Yahoo Finance
 */

import express from "express";
import yahooFinanceService from "../services/yahooFinance.service.js";

const router = express.Router();

// ─── ALL GLOBAL INDICES ────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const indices = await yahooFinanceService.getGlobalIndices();
    const { country } = req.query;

    let filtered = indices;
    if (country) {
      filtered = indices.filter(
        (i) => i.country.toLowerCase() === country.toLowerCase(),
      );
    }

    res.json({ success: true, data: filtered, count: filtered.length });
  } catch (error) {
    console.error("❌ Global indices error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch global indices" });
  }
});

// ─── INDICES BY REGION ─────────────────────────────────────
router.get("/region/:region", async (req, res) => {
  try {
    const { region } = req.params;
    const indices = await yahooFinanceService.getGlobalIndices();

    const regionMap = {
      asia: [
        "Japan",
        "Hong Kong",
        "China",
        "South Korea",
        "Taiwan",
        "Singapore",
        "Indonesia",
        "India",
      ],
      europe: ["United Kingdom", "Germany", "France", "Europe", "Spain"],
      americas: ["United States", "Canada", "Brazil", "Mexico"],
      pacific: ["Australia", "Singapore"],
    };

    const countries = regionMap[region.toLowerCase()] || [];
    const filtered = indices.filter((i) => countries.includes(i.country));

    res.json({ success: true, data: filtered, count: filtered.length, region });
  } catch (error) {
    console.error("❌ Indices by region error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch regional indices" });
  }
});

// ─── INDIAN INDICES (NSE broad + sectoral + GIFT India) ────
router.get("/india", async (req, res) => {
  try {
    const indices = await yahooFinanceService.getIndianIndices();
    res.json({ success: true, data: indices, count: indices.length });
  } catch (error) {
    console.error("❌ Indian indices error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch Indian indices" });
  }
});

// ─── HISTORICAL DATA FOR AN INDEX ──────────────────────────
router.get("/:symbol/history", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = "1mo", interval = "1d" } = req.query;

    // Map our symbol back to Yahoo symbol
    const allIndices = {
      ...yahooFinanceService.globalIndices,
      ...yahooFinanceService.usIndices,
    };
    let yahooSymbol = symbol;

    for (const [ySymbol, meta] of Object.entries(allIndices)) {
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
      `❌ Index history error for ${req.params.symbol}:`,
      error.message,
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch index history" });
  }
});

// ─── CURRENCIES / FOREX ────────────────────────────────────
router.get("/currencies", async (req, res) => {
  try {
    const currencies = await yahooFinanceService.getCurrencies();
    res.json({ success: true, data: currencies, count: currencies.length });
  } catch (error) {
    console.error("❌ Currencies error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch currency data" });
  }
});

export default router;
