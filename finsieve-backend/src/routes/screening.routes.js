/**
 * Screening Routes
 * Cross-asset class screening engine
 * This is what makes Finsieve the Screener.in + TradingView killer
 */

import express from "express";
import screeningService from "../services/screening.service.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { decryptRequest } from "../middleware/encryption.middleware.js";

const router = express.Router();

// All screening routes require authentication
router.use(authenticate);

// ─── GET SCREENING PARAMETERS ──────────────────────────────
router.get("/params/:assetClass", (req, res) => {
  try {
    const { assetClass } = req.params;
    const params = screeningService.getScreeningParams(
      assetClass.toUpperCase(),
    );

    if (params.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No screening parameters available for: ${assetClass}`,
        supportedClasses: [
          "US_EQUITY",
          "CRYPTO",
          "COMMODITY",
          "BOND",
          "MUTUAL_FUND",
          "INDEX",
          "ETF",
          "SIF",
          "PMS",
          "AIF",
        ],
      });
    }

    res.json({ success: true, data: params, assetClass });
  } catch (error) {
    console.error("❌ Screening params error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to get screening parameters" });
  }
});

// ─── RUN SCREENING ─────────────────────────────────────────
router.post("/run", decryptRequest, async (req, res) => {
  try {
    const {
      assetClass,
      filters = [],
      sortBy,
      sortOrder = "desc",
      limit = 100,
      offset = 0,
    } = req.body;

    if (!assetClass) {
      return res
        .status(400)
        .json({ success: false, message: "assetClass is required" });
    }

    const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
    const safeOffset = Math.min(10000, Math.max(0, parseInt(offset, 10) || 0));

    const result = await screeningService.screen(
      assetClass.toUpperCase(),
      Array.isArray(filters) ? filters : [],
      sortBy,
      sortOrder,
      safeLimit,
      safeOffset,
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error("❌ Screening error:", error.message);
    res.status(500).json({ success: false, message: "Screening failed" });
  }
});

// ─── GET SCREENING (GET alternative) ───────────────────────
router.get("/run/:assetClass", async (req, res) => {
  try {
    const { assetClass } = req.params;
    const { sortBy, sortOrder = "desc", limit = 50, offset = 0 } = req.query;

    const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
    const safeOffset = Math.min(10000, Math.max(0, parseInt(offset, 10) || 0));

    const result = await screeningService.screen(
      assetClass.toUpperCase(),
      [],
      sortBy,
      sortOrder,
      safeLimit,
      safeOffset,
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error("❌ Screening GET error:", error.message);
    res.status(500).json({ success: false, message: "Screening failed" });
  }
});

// ─── QUICK SCREENS (PRE-BUILT) ─────────────────────────────
router.get("/quick", async (req, res) => {
  try {
    const quickScreens = await screeningService.getQuickScreens();
    res.json({ success: true, data: quickScreens, count: quickScreens.length });
  } catch (error) {
    console.error("❌ Quick screens error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to get quick screens" });
  }
});

// ─── RUN A QUICK SCREEN ────────────────────────────────────
router.get("/quick/:screenId", async (req, res) => {
  try {
    const { screenId } = req.params;
    const quickScreens = await screeningService.getQuickScreens();
    const screen = quickScreens.find((s) => s.id === screenId);

    if (!screen) {
      return res
        .status(404)
        .json({ success: false, message: "Quick screen not found" });
    }

    const result = await screeningService.screen(
      screen.assetClass,
      screen.filters,
      screen.sortBy,
      screen.sortOrder,
    );

    res.json({
      success: true,
      screenName: screen.name,
      ...result,
    });
  } catch (error) {
    console.error("❌ Quick screen run error:", error.message);
    res.status(500).json({ success: false, message: "Quick screen failed" });
  }
});

// ─── SUPPORTED ASSET CLASSES (ETF, SIF, PMS, AIF below Mutual Funds) ─────
router.get("/asset-classes", (req, res) => {
  res.json({
    success: true,
    data: [
      { key: "US_EQUITY", label: "US Equities", icon: "📈", description: "NYSE/NASDAQ stocks" },
      { key: "CRYPTO", label: "Cryptocurrency", icon: "₿", description: "Top 100 by market cap" },
      { key: "MUTUAL_FUND", label: "Mutual Funds", icon: "🏛️", description: "Indian AMFI registered schemes" },
      { key: "ETF", label: "ETFs", icon: "📊", description: "Indian ETFs — NSE/BSE, AUM, TER, returns" },
      { key: "SIF", label: "SIF", icon: "🎯", description: "Specialized Investment Funds (₹10L+)" },
      { key: "PMS", label: "PMS", icon: "💼", description: "Portfolio Management Services (₹50L+)" },
      { key: "AIF", label: "AIF", icon: "🏦", description: "Alternative Investment Funds (₹1Cr+)" },
      { key: "COMMODITY", label: "Commodities", icon: "🥇", description: "Gold, Oil, Agriculture & more" },
      { key: "BOND", label: "Bonds & Treasury", icon: "📋", description: "US Treasury yields" },
      { key: "INDEX", label: "Global Indices", icon: "🌍", description: "20+ global market indices" },
    ],
  });
});

// ─── ASSET-SPECIFIC SCREENING (convenience endpoints) ───────
router.post("/etfs", decryptRequest, async (req, res) => {
  try {
    const { filters = [], sortBy, sortOrder = "desc", limit = 100, offset = 0 } = req.body;
    const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
    const safeOffset = Math.min(10000, Math.max(0, parseInt(offset, 10) || 0));
    const result = await screeningService.screen("ETF", Array.isArray(filters) ? filters : [], sortBy, sortOrder, safeLimit, safeOffset);
    res.json({ success: true, ...result });
  } catch (e) {
    console.error("❌ ETF screening error:", e.message);
    res.status(500).json({ success: false, message: "ETF screening failed" });
  }
});

router.post("/sif", decryptRequest, async (req, res) => {
  try {
    const { filters = [], sortBy, sortOrder = "desc", limit = 100, offset = 0 } = req.body;
    const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
    const safeOffset = Math.min(10000, Math.max(0, parseInt(offset, 10) || 0));
    const result = await screeningService.screen("SIF", Array.isArray(filters) ? filters : [], sortBy, sortOrder, safeLimit, safeOffset);
    res.json({ success: true, ...result });
  } catch (e) {
    console.error("❌ SIF screening error:", e.message);
    res.status(500).json({ success: false, message: "SIF screening failed" });
  }
});

router.post("/pms", decryptRequest, async (req, res) => {
  try {
    const { filters = [], sortBy, sortOrder = "desc", limit = 100, offset = 0 } = req.body;
    const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
    const safeOffset = Math.min(10000, Math.max(0, parseInt(offset, 10) || 0));
    const result = await screeningService.screen("PMS", Array.isArray(filters) ? filters : [], sortBy, sortOrder, safeLimit, safeOffset);
    res.json({ success: true, ...result });
  } catch (e) {
    console.error("❌ PMS screening error:", e.message);
    res.status(500).json({ success: false, message: "PMS screening failed" });
  }
});

router.post("/aif", decryptRequest, async (req, res) => {
  try {
    const { filters = [], sortBy, sortOrder = "desc", limit = 100, offset = 0 } = req.body;
    const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
    const safeOffset = Math.min(10000, Math.max(0, parseInt(offset, 10) || 0));
    const result = await screeningService.screen("AIF", Array.isArray(filters) ? filters : [], sortBy, sortOrder, safeLimit, safeOffset);
    res.json({ success: true, ...result });
  } catch (e) {
    console.error("❌ AIF screening error:", e.message);
    res.status(500).json({ success: false, message: "AIF screening failed" });
  }
});

export default router;
