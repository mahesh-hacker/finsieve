/**
 * Comparison Routes
 * Side-by-side comparison of up to 5 instruments across any asset class
 */

import express from "express";
import comparisonService from "../services/comparison.service.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// All comparison routes require authentication
router.use(authenticate);

// ─── COMPARE INSTRUMENTS ───────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { instruments } = req.body;

    if (!instruments || !Array.isArray(instruments)) {
      return res.status(400).json({
        success: false,
        message: "instruments array is required",
        example: {
          instruments: [
            { symbol: "AAPL", asset_class: "US_EQUITY" },
            { symbol: "bitcoin", asset_class: "CRYPTO" },
          ],
        },
      });
    }

    const result = await comparisonService.compareInstruments(instruments);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Comparison error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── SEARCH FOR COMPARISON ─────────────────────────────────
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'q' must be at least 2 characters",
      });
    }

    const results = await comparisonService.searchForComparison(q);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error("❌ Comparison search error:", error.message);
    res.status(500).json({ success: false, message: "Search failed" });
  }
});

export default router;
