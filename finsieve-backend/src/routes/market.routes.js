import express from "express";
import * as marketController from "../controllers/market.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/v1/market/indices
 * @desc    Get all global indices with optional filters
 * @access  Public
 * @query   country - Filter by country
 * @query   search - Search by name or symbol
 * @query   limit - Number of results per page
 * @query   offset - Pagination offset
 */
router.get("/indices", marketController.getGlobalIndices);

/**
 * @route   GET /api/v1/market/indices/major
 * @desc    Get major/featured indices
 * @access  Public
 */
router.get("/indices/major", marketController.getMajorIndices);

/**
 * @route   GET /api/v1/market/indices/country/:country
 * @desc    Get indices by country
 * @access  Public
 */
router.get("/indices/country/:country", marketController.getIndicesByCountry);

/**
 * @route   GET /api/v1/market/status
 * @desc    Get market status (open/closed for all countries)
 * @access  Public
 */
router.get("/status", marketController.getMarketStatus);

/**
 * @route   POST /api/v1/market/update
 * @desc    Trigger live data update for open markets
 * @access  Protected (admin/enterprise only)
 */
router.post("/update", authenticate, marketController.updateLiveData);

/**
 * @route   GET /api/v1/market/indices/:symbol
 * @desc    Get single index by symbol
 * @access  Public
 */
router.get("/indices/:symbol", marketController.getIndexBySymbol);

/**
 * @route   GET /api/v1/market/historical
 * @desc    Get OHLCV historical data via Yahoo Finance (no broker auth needed)
 * @access  Public
 * @query   symbol   - Yahoo symbol e.g. "^NSEI", "RELIANCE.NS", "GC=F"
 * @query   interval - "1d" | "1wk" | "1mo" | "1m" | "5m" | "15m" | "30m" | "60m"
 * @query   from     - "YYYY-MM-DD"
 * @query   to       - "YYYY-MM-DD"
 */
router.get("/historical", marketController.getHistorical);

export default router;
