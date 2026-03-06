/**
 * Crypto Routes
 * Full crypto market data via CoinGecko API
 */

import express from "express";
import cryptoService from "../services/crypto.service.js";

const router = express.Router();

// ─── TOP CRYPTOS ───────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { limit = 500, currency = "usd" } = req.query;
    const cryptos = await cryptoService.getTopCryptos(
      parseInt(limit),
      currency,
    );
    res.json({ success: true, data: cryptos, count: cryptos.length });
  } catch (error) {
    console.error("❌ Crypto list error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch cryptocurrencies" });
  }
});

// ─── MARKET OVERVIEW ───────────────────────────────────────
router.get("/overview", async (req, res) => {
  try {
    const overview = await cryptoService.getMarketOverview();
    res.json({ success: true, data: overview });
  } catch (error) {
    console.error("❌ Crypto overview error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch crypto market overview",
      });
  }
});

// ─── TRENDING CRYPTOS ──────────────────────────────────────
router.get("/trending", async (req, res) => {
  try {
    const trending = await cryptoService.getTrending();
    res.json({ success: true, data: trending, count: trending.length });
  } catch (error) {
    console.error("❌ Crypto trending error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch trending cryptos" });
  }
});

// ─── SEARCH CRYPTO ─────────────────────────────────────────
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q)
      return res
        .status(400)
        .json({ success: false, message: "Query parameter 'q' is required" });

    const results = await cryptoService.searchCrypto(q);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error("❌ Crypto search error:", error.message);
    res.status(500).json({ success: false, message: "Search failed" });
  }
});

// ─── CRYPTO DETAIL ─────────────────────────────────────────
router.get("/:coinId", async (req, res) => {
  try {
    const { coinId } = req.params;
    const detail = await cryptoService.getCryptoDetail(coinId);
    res.json({ success: true, data: detail });
  } catch (error) {
    console.error(
      `❌ Crypto detail error for ${req.params.coinId}:`,
      error.message,
    );
    res
      .status(404)
      .json({
        success: false,
        message: `Cryptocurrency ${req.params.coinId} not found`,
      });
  }
});

// ─── CRYPTO CHART DATA ─────────────────────────────────────
router.get("/:coinId/chart", async (req, res) => {
  try {
    const { coinId } = req.params;
    const { days = "7", currency = "usd" } = req.query;

    const chartData = await cryptoService.getCryptoChart(
      coinId,
      days,
      currency,
    );
    res.json({ success: true, data: chartData });
  } catch (error) {
    console.error(
      `❌ Crypto chart error for ${req.params.coinId}:`,
      error.message,
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch chart data" });
  }
});

export default router;
