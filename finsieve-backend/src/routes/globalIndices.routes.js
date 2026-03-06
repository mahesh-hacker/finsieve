/**
 * Global Indices Routes
 * Live data for 20+ global stock market indices via Yahoo Finance
 */

import express from "express";
import yahooFinanceService from "../services/yahooFinance.service.js";
import { getIndicesByCountry } from "../services/market.service.js";

// ─── Static metadata for Indian indices (exchange + category) ───────────────
// Enriches DB rows (which lack exchange/category) with display metadata.
const INDIA_INDEX_META = {
  // Broad Market
  NIFTY:             { exchange: "NSE", category: "Broad Market" },
  NIFTYNEXT50:       { exchange: "NSE", category: "Broad Market" },
  NIFTY100:          { exchange: "NSE", category: "Broad Market" },
  NIFTY200:          { exchange: "NSE", category: "Broad Market" },
  NIFTY500:          { exchange: "NSE", category: "Broad Market" },
  NIFTYTOTALMARKET:  { exchange: "NSE", category: "Broad Market" },
  NIFTYMIDCAP50:     { exchange: "NSE", category: "Broad Market" },
  NIFTYMIDCAP:       { exchange: "NSE", category: "Broad Market" },
  NIFTYMIDCAP150:    { exchange: "NSE", category: "Broad Market" },
  NIFTYSMLCAP50:     { exchange: "NSE", category: "Broad Market" },
  NIFTYSMLCAP100:    { exchange: "NSE", category: "Broad Market" },
  NIFTYSMLCAP250:    { exchange: "NSE", category: "Broad Market" },
  NIFTYMICROCAP250:  { exchange: "NSE", category: "Broad Market" },
  NIFTYLARGEMID250:  { exchange: "NSE", category: "Broad Market" },
  SENSEX:            { exchange: "BSE", category: "Broad Market" },
  // Sectoral
  BANKNIFTY:         { exchange: "NSE", category: "Sectoral" },
  NIFTYPVTBANK:      { exchange: "NSE", category: "Sectoral" },
  NIFTYPSUBANK:      { exchange: "NSE", category: "Sectoral" },
  NIFTYFINSERV:      { exchange: "NSE", category: "Sectoral" },
  NIFTYIT:           { exchange: "NSE", category: "Sectoral" },
  NIFTYFMCG:         { exchange: "NSE", category: "Sectoral" },
  NIFTYAUTO:         { exchange: "NSE", category: "Sectoral" },
  NIFTYPHARMA:       { exchange: "NSE", category: "Sectoral" },
  NIFTYHEALTHCARE:   { exchange: "NSE", category: "Sectoral" },
  NIFTYMETAL:        { exchange: "NSE", category: "Sectoral" },
  NIFTYREALTY:       { exchange: "NSE", category: "Sectoral" },
  NIFTYENERGY:       { exchange: "NSE", category: "Sectoral" },
  NIFTYOILGAS:       { exchange: "NSE", category: "Sectoral" },
  NIFTYINFRA:        { exchange: "NSE", category: "Sectoral" },
  NIFTYDEFENCE:      { exchange: "NSE", category: "Sectoral" },
  NIFTYCONSDUR:      { exchange: "NSE", category: "Sectoral" },
  NIFTYCAPMARKETS:   { exchange: "NSE", category: "Sectoral" },
  NIFTYCOMMO:        { exchange: "NSE", category: "Sectoral" },
  NIFTYMEDIA:        { exchange: "NSE", category: "Sectoral" },
  // Factor / Strategy
  NIFTYALPHA50:      { exchange: "NSE", category: "Broad Market" },
  NIFTYQUALITY30:    { exchange: "NSE", category: "Broad Market" },
  NIFTYLOVOL50:      { exchange: "NSE", category: "Broad Market" },
  NIFTYHIBETA50:     { exchange: "NSE", category: "Broad Market" },
  NIFTYESG:          { exchange: "NSE", category: "Broad Market" },
  // Volatility
  INDIAVIX:          { exchange: "NSE", category: "Volatility" },
};

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
// Primary: DB (updated every 5s by NSE scheduler) → fallback: Yahoo Finance
router.get("/india", async (req, res) => {
  try {
    // 1. Try DB first — fresh data every 5s from NSE scheduler
    let rows = [];
    try {
      rows = await getIndicesByCountry("India");
    } catch { /* DB unavailable, will fall back */ }

    if (rows.length > 0) {
      // Enrich DB rows with static exchange/category metadata
      const enriched = rows.map((row) => {
        const meta = INDIA_INDEX_META[row.symbol] ?? { exchange: "NSE", category: "Broad Market" };
        return {
          ...row,
          exchange:  meta.exchange,
          category:  meta.category,
          currency:  "INR",
          volume:    row.volume ?? 0,
        };
      });

      // Append GIFT India entries using live NIFTY/BANKNIFTY as proxy
      const nifty     = rows.find((r) => r.symbol === "NIFTY");
      const banknifty = rows.find((r) => r.symbol === "BANKNIFTY");
      const giftEntries = [];
      if (nifty) {
        giftEntries.push({
          ...nifty,
          symbol:   "GIFTNIFTY",
          name:     "GIFT NIFTY 50",
          exchange: "NSE IFSC",
          category: "GIFT India",
          currency: "USD",
          note:     "USD-denominated futures on NSE IFSC (GIFT City). Values mirror domestic NSE NIFTY 50.",
        });
      }
      if (banknifty) {
        giftEntries.push({
          ...banknifty,
          symbol:   "GIFTBANKNIFTY",
          name:     "GIFT Bank Nifty",
          exchange: "NSE IFSC",
          category: "GIFT India",
          currency: "USD",
          note:     "USD-denominated futures on NSE IFSC (GIFT City). Values mirror domestic NSE Bank Nifty.",
        });
      }

      const allIndices = [...enriched, ...giftEntries];
      return res.json({ success: true, data: allIndices, count: allIndices.length });
    }

    // 2. Fallback: Yahoo Finance
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
