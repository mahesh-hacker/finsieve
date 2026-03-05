/**
 * Screening Routes
 * Cross-asset class screening engine
 * This is what makes Finsieve the Screener.in + TradingView killer
 */

import express from "express";
import screeningService from "../services/screening.service.js";
import { authenticate } from "../middleware/auth.middleware.js";

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
router.post("/run", async (req, res) => {
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

    const result = await screeningService.screen(
      assetClass.toUpperCase(),
      filters,
      sortBy,
      sortOrder,
      parseInt(limit),
      parseInt(offset),
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

    const result = await screeningService.screen(
      assetClass.toUpperCase(),
      [],
      sortBy,
      sortOrder,
      parseInt(limit),
      parseInt(offset),
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

// ─── SUPPORTED ASSET CLASSES ───────────────────────────────
router.get("/asset-classes", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        key: "US_EQUITY",
        label: "US Equities",
        icon: "📈",
        description: "NYSE/NASDAQ stocks",
      },
      {
        key: "CRYPTO",
        label: "Cryptocurrency",
        icon: "₿",
        description: "Top 100 by market cap",
      },
      {
        key: "MUTUAL_FUND",
        label: "Mutual Funds",
        icon: "🏛️",
        description: "Indian AMFI registered schemes",
      },
      {
        key: "COMMODITY",
        label: "Commodities",
        icon: "🥇",
        description: "Gold, Oil, Agriculture & more",
      },
      {
        key: "BOND",
        label: "Bonds & Treasury",
        icon: "📋",
        description: "US Treasury yields",
      },
      {
        key: "INDEX",
        label: "Global Indices",
        icon: "🌍",
        description: "20+ global market indices",
      },
    ],
  });
});

export default router;
