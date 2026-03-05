import * as marketService from "../services/market.service.js";
import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
import {
  getAllMarketStatus,
  getOpenMarkets,
  getMarketTimingsIST,
} from "../config/marketHours.js";

/**
 * Get all global indices
 * GET /api/v1/market/indices
 */
export const getGlobalIndices = async (req, res) => {
  try {
    const { country, search, limit, offset } = req.query;

    const result = await marketService.getGlobalIndices({
      country,
      search,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    res.json({
      success: true,
      message: "Global indices retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get global indices controller error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve global indices",
    });
  }
};

/**
 * Get index by symbol
 * GET /api/v1/market/indices/:symbol
 */
export const getIndexBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;

    const index = await marketService.getIndexBySymbol(symbol);

    res.json({
      success: true,
      message: "Index retrieved successfully",
      data: index,
    });
  } catch (error) {
    console.error("Get index by symbol controller error:", error);

    if (error.message === "Index not found") {
      return res.status(404).json({
        success: false,
        message: "Index not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to retrieve index",
    });
  }
};

/**
 * Get indices by country
 * GET /api/v1/market/indices/country/:country
 */
export const getIndicesByCountry = async (req, res) => {
  try {
    const { country } = req.params;

    const indices = await marketService.getIndicesByCountry(country);

    res.json({
      success: true,
      message: "Indices retrieved successfully",
      data: indices,
    });
  } catch (error) {
    console.error("Get indices by country controller error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve indices",
    });
  }
};

/**
 * Get major indices
 * GET /api/v1/market/indices/major
 */
export const getMajorIndices = async (req, res) => {
  try {
    const indices = await marketService.getMajorIndices();

    res.json({
      success: true,
      message: "Major indices retrieved successfully",
      data: indices,
    });
  } catch (error) {
    console.error("Get major indices controller error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve major indices",
    });
  }
};

/**
 * Get market status (open/closed for all countries)
 * GET /api/v1/market/status
 */
export const getMarketStatus = async (req, res) => {
  try {
    const allStatus = getAllMarketStatus();
    const openMarkets = getOpenMarkets();
    const timingsIST = getMarketTimingsIST();

    res.json({
      success: true,
      message: "Market status retrieved successfully",
      data: {
        allMarkets: allStatus,
        openMarkets: openMarkets,
        openMarketsCount: openMarkets.length,
        marketTimingsIST: timingsIST,
        timestamp: new Date().toISOString(),
        istTime: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      },
    });
  } catch (error) {
    console.error("Get market status controller error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve market status",
    });
  }
};

/**
 * Trigger live data update
 * POST /api/v1/market/update
 */
export const updateLiveData = async (req, res) => {
  try {
    const { isMarketOpen } = await import("../config/marketHours.js");
    const globalMarketScheduler = (
      await import("../scheduler/globalMarketScheduler.js")
    ).default;
    const cryptoScheduler = (await import("../scheduler/cryptoScheduler.js"))
      .default;

    await globalMarketScheduler.forceUpdateAllOpenMarkets();
    await cryptoScheduler.forceUpdate();

    // When India market is open, refresh NSE indices and stocks
    if (isMarketOpen("India")) {
      try {
        const realNSEDataService = (
          await import("../services/realNSEData.service.js")
        ).default;
        await realNSEDataService.updateNSEIndices();
      } catch (nseErr) {
        console.error("NSE indices update failed:", nseErr.message);
      }
      try {
        const nseStocksScheduler = (
          await import("../scheduler/nseStocksScheduler.js")
        ).default;
        await nseStocksScheduler.runUpdate();
      } catch (stocksErr) {
        console.error("NSE stocks update failed:", stocksErr.message);
      }
    }

    res.json({
      success: true,
      message: "Live data update triggered successfully",
      data: {
        timestamp: new Date().toISOString(),
        openMarkets: getOpenMarkets(),
      },
    });
  } catch (error) {
    console.error("Update live data controller error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update live data",
    });
  }
};

// Allowed Yahoo Finance interval values (strict allowlist)
const ALLOWED_INTERVALS = new Set([
  "1m","2m","5m","15m","30m","60m","1h","90m","1d","1wk","1mo",
]);

// Yahoo symbol: allow letters, digits, ^, ., =, -, + and the colon used in
// internal formats.  Max 20 chars — enough for any real ticker.
const SYMBOL_RE = /^[A-Z0-9^.=\-+:]{1,20}$/i;

// Date: strict YYYY-MM-DD
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/v1/market/historical
 * Fetch OHLCV candles via Yahoo Finance (free, no OAuth needed).
 * Interval mapping: 1d/1wk/1mo → historical(); 1m/5m/15m/30m/60m → chart()
 */
export const getHistorical = async (req, res) => {
  const { symbol, interval = "1d", from, to } = req.query;

  // ── Input validation (strict allowlists to prevent injection) ──
  if (!symbol || !SYMBOL_RE.test(symbol)) {
    return res.status(400).json({ success: false, message: "Invalid or missing symbol" });
  }
  if (!from || !DATE_RE.test(from)) {
    return res.status(400).json({ success: false, message: "from must be YYYY-MM-DD" });
  }
  if (to && !DATE_RE.test(to)) {
    return res.status(400).json({ success: false, message: "to must be YYYY-MM-DD" });
  }
  if (!ALLOWED_INTERVALS.has(interval)) {
    return res.status(400).json({ success: false, message: "Invalid interval" });
  }

  try {
    const toDate = to || new Date().toISOString().split("T")[0];

    // Intraday intervals → use chart() module
    const intradayIntervals = { "1m": "1m", "2m": "2m", "5m": "5m", "15m": "15m", "30m": "30m", "60m": "60m", "1h": "60m", "90m": "90m" };

    let candles;

    if (intradayIntervals[interval]) {
      const result = await yahooFinance.chart(symbol, {
        period1: from,
        period2: toDate,
        interval: intradayIntervals[interval],
      }, { validateResult: false });

      const quotes = result?.quotes || [];
      candles = quotes
        .filter(q => q && q.open != null && q.close != null)
        .map(q => ({
          time:   Math.floor(new Date(q.date).getTime() / 1000),
          open:   q.open,
          high:   q.high,
          low:    q.low,
          close:  q.close,
          volume: q.volume ?? 0,
        }));
    } else {
      // Daily / weekly / monthly → historical()
      const yfInterval = interval === "1wk" ? "1wk" : interval === "1mo" ? "1mo" : "1d";
      const rows = await yahooFinance.historical(symbol, {
        period1: from,
        period2: toDate,
        interval: yfInterval,
      }, { validateResult: false });

      candles = (rows || [])
        .filter(r => r && r.open != null && r.close != null)
        .map(r => ({
          time:   Math.floor(new Date(r.date).getTime() / 1000),
          open:   r.open,
          high:   r.high,
          low:    r.low,
          close:  r.close,
          volume: r.volume ?? 0,
        }))
        .sort((a, b) => a.time - b.time);
    }

    if (!candles.length) {
      return res.json({ success: false, message: "No data returned from Yahoo Finance" });
    }

    res.json({ success: true, data: candles });
  } catch (error) {
    console.error("getHistorical error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getGlobalIndices,
  getIndexBySymbol,
  getIndicesByCountry,
  getMajorIndices,
  getMarketStatus,
  updateLiveData,
  getHistorical,
};
