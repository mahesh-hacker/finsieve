import express from "express";
import realNSEDataService from "../services/realNSEData.service.js";
import nseStocksService from "../services/nseStocks.service.js";

const router = express.Router();

/**
 * @route   GET /api/v1/nse/update
 * @desc    Manually trigger NSE data update
 * @access  Public (should be protected in production)
 */
router.get("/update", async (req, res) => {
  try {
    console.log("📡 Manual NSE data update triggered");

    const result = await realNSEDataService.updateNSEIndices();

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Updated ${result.updated} NSE indices`,
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
        message: "Failed to update NSE data",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("❌ Error in NSE update endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/nse/status
 * @desc    Check NSE market status
 * @access  Public
 */
router.get("/status", async (req, res) => {
  try {
    const isOpen = realNSEDataService.isMarketOpen();

    const now = new Date();
    const istTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    );

    return res.status(200).json({
      success: true,
      data: {
        market: "NSE India",
        isOpen,
        status: isOpen ? "OPEN" : "CLOSED",
        tradingHours: "9:15 AM - 3:30 PM IST (Mon-Fri)",
        currentTime: istTime.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: true,
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
    });
  } catch (error) {
    console.error("❌ Error in NSE status endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/nse/debug
 * @desc    Get raw NSE data for debugging
 * @access  Public
 */
router.get("/debug", async (req, res) => {
  try {
    const rawData = await realNSEDataService.fetchNSEIndices();

    return res.status(200).json({
      success: true,
      data: rawData,
      count: rawData.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in NSE debug endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch NSE data",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/nse/index/:indexName
 * @desc    Get specific index data from NSE
 * @access  Public
 */
router.get("/index/:indexName", async (req, res) => {
  try {
    const { indexName } = req.params;

    // Map common names to NSE names
    const nameMap = {
      nifty: "NIFTY 50",
      nifty50: "NIFTY 50",
      banknifty: "NIFTY BANK",
      niftybank: "NIFTY BANK",
      niftyit: "NIFTY IT",
    };

    const nseIndexName = nameMap[indexName.toLowerCase()] || indexName;
    const indexData = await realNSEDataService.getIndexData(nseIndexName);

    return res.status(200).json({
      success: true,
      data: indexData,
    });
  } catch (error) {
    console.error(`❌ Error fetching index ${req.params.indexName}:`, error);
    return res.status(404).json({
      success: false,
      message: `Index ${req.params.indexName} not found`,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/nse/stocks/all
 * @desc    Get all NSE stocks
 * @access  Public
 */
router.get("/stocks/all", async (req, res) => {
  try {
    const stocks = await nseStocksService.getAllNSEStocks();

    return res.status(200).json({
      success: true,
      data: stocks,
      count: stocks.length,
    });
  } catch (error) {
    console.error("❌ Error fetching NSE stocks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch NSE stocks",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/nse/stocks/gainers
 * @desc    Get top gainers
 * @access  Public
 */
router.get("/stocks/gainers", async (req, res) => {
  try {
    const { index = "NIFTY 50" } = req.query;
    const data = await nseStocksService.getGainersLosers(index);

    return res.status(200).json({
      success: true,
      data: data.gainers,
      count: data.gainers.length,
    });
  } catch (error) {
    console.error("❌ Error fetching gainers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch gainers",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/nse/stocks/losers
 * @desc    Get top losers
 * @access  Public
 */
router.get("/stocks/losers", async (req, res) => {
  try {
    const { index = "NIFTY 50" } = req.query;
    const data = await nseStocksService.getGainersLosers(index);

    return res.status(200).json({
      success: true,
      data: data.losers,
      count: data.losers.length,
    });
  } catch (error) {
    console.error("❌ Error fetching losers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch losers",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/nse/stocks/volume
 * @desc    Get highest volume stocks
 * @access  Public
 */
router.get("/stocks/volume", async (req, res) => {
  try {
    const { index = "NIFTY 50" } = req.query;
    const stocks = await nseStocksService.getHighVolumeStocks(index);

    return res.status(200).json({
      success: true,
      data: stocks,
      count: stocks.length,
    });
  } catch (error) {
    console.error("❌ Error fetching high volume stocks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch high volume stocks",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/nse/stocks/52w-high
 * @desc    Get stocks near 52-week high
 * @access  Public
 */
router.get("/stocks/52w-high", async (req, res) => {
  try {
    const { index = "NIFTY 50" } = req.query;
    const stocks = await nseStocksService.get52WeekHighStocks(index);

    return res.status(200).json({
      success: true,
      data: stocks,
      count: stocks.length,
    });
  } catch (error) {
    console.error("❌ Error fetching 52W high stocks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch 52W high stocks",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/nse/stocks/52w-low
 * @desc    Get stocks near 52-week low
 * @access  Public
 */
router.get("/stocks/52w-low", async (req, res) => {
  try {
    const { index = "NIFTY 50" } = req.query;
    const stocks = await nseStocksService.get52WeekLowStocks(index);

    return res.status(200).json({
      success: true,
      data: stocks,
      count: stocks.length,
    });
  } catch (error) {
    console.error("❌ Error fetching 52W low stocks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch 52W low stocks",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/nse/stocks/quote/:symbol
 * @desc    Get stock quote by symbol
 * @access  Public
 */
router.get("/stocks/quote/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await nseStocksService.getStockQuote(symbol.toUpperCase());

    return res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error(`❌ Error fetching quote for ${req.params.symbol}:`, error);
    return res.status(404).json({
      success: false,
      message: `Quote for ${req.params.symbol} not found`,
      error: error.message,
    });
  }
});

export default router;
