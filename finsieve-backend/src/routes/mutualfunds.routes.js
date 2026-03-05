/**
 * Mutual Fund Routes
 * Indian Mutual Funds via AMFI / mf-api
 */

import express from "express";
import mutualFundService from "../services/mutualFund.service.js";

const router = express.Router();

// ─── POPULAR FUNDS ─────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const funds = await mutualFundService.getPopularFunds();
    res.json({ success: true, data: funds, count: funds.length });
  } catch (error) {
    console.error("❌ Mutual funds error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch mutual funds" });
  }
});

// ─── SEARCH FUNDS ──────────────────────────────────────────
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q)
      return res
        .status(400)
        .json({ success: false, message: "Query parameter 'q' is required" });

    const results = await mutualFundService.searchFunds(q);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error("❌ MF search error:", error.message);
    res.status(500).json({ success: false, message: "Search failed" });
  }
});

// ─── FUND DETAIL ───────────────────────────────────────────
router.get("/:schemeCode", async (req, res) => {
  try {
    const { schemeCode } = req.params;
    const fund = await mutualFundService.getFundData(schemeCode);
    res.json({ success: true, data: fund });
  } catch (error) {
    console.error(
      `❌ MF detail error for ${req.params.schemeCode}:`,
      error.message,
    );
    res
      .status(404)
      .json({
        success: false,
        message: `Fund ${req.params.schemeCode} not found`,
      });
  }
});

// ─── FUND NAV HISTORY ──────────────────────────────────────
router.get("/:schemeCode/history", async (req, res) => {
  try {
    const { schemeCode } = req.params;
    const history = await mutualFundService.getFundHistory(schemeCode);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error(
      `❌ MF history error for ${req.params.schemeCode}:`,
      error.message,
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch fund history" });
  }
});

// ─── FUND RETURNS ──────────────────────────────────────────
router.get("/:schemeCode/returns", async (req, res) => {
  try {
    const { schemeCode } = req.params;
    const returns = await mutualFundService.calculateReturns(schemeCode);
    res.json({ success: true, data: returns });
  } catch (error) {
    console.error(
      `❌ MF returns error for ${req.params.schemeCode}:`,
      error.message,
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to calculate returns" });
  }
});

export default router;
