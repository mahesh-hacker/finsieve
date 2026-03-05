/**
 * Watchlist Routes
 * Full CRUD for user watchlists - authenticated endpoints
 */

import express from "express";
import watchlistService from "../services/watchlist.service.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// All watchlist routes require authentication
router.use(authenticate);

// ─── GET ALL WATCHLISTS ────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const watchlists = await watchlistService.getUserWatchlists(req.user.id);
    res.json({ success: true, data: watchlists, count: watchlists.length });
  } catch (error) {
    console.error("❌ Get watchlists error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to get watchlists" });
  }
});

// ─── CREATE WATCHLIST ──────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const watchlist = await watchlistService.createWatchlist(
      req.user.id,
      req.body,
    );
    res
      .status(201)
      .json({ success: true, data: watchlist, message: "Watchlist created" });
  } catch (error) {
    console.error("❌ Create watchlist error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to create watchlist" });
  }
});

// ─── GET WATCHLIST BY ID ───────────────────────────────────
router.get("/:watchlistId", async (req, res) => {
  try {
    const watchlist = await watchlistService.getWatchlistById(
      req.params.watchlistId,
      req.user.id,
    );
    res.json({ success: true, data: watchlist });
  } catch (error) {
    console.error("❌ Get watchlist error:", error.message);
    res
      .status(404)
      .json({
        success: false,
        message: error.message || "Watchlist not found",
      });
  }
});

// ─── UPDATE WATCHLIST ──────────────────────────────────────
router.put("/:watchlistId", async (req, res) => {
  try {
    const watchlist = await watchlistService.updateWatchlist(
      req.params.watchlistId,
      req.user.id,
      req.body,
    );
    res.json({ success: true, data: watchlist, message: "Watchlist updated" });
  } catch (error) {
    console.error("❌ Update watchlist error:", error.message);
    res.status(404).json({
      success: false,
      message: error.message || "Watchlist not found",
    });
  }
});

// ─── DELETE WATCHLIST ──────────────────────────────────────
router.delete("/:watchlistId", async (req, res) => {
  try {
    await watchlistService.deleteWatchlist(req.params.watchlistId, req.user.id);
    res.json({ success: true, message: "Watchlist deleted" });
  } catch (error) {
    console.error("❌ Delete watchlist error:", error.message);
    res.status(404).json({
      success: false,
      message: error.message || "Watchlist not found",
    });
  }
});

// ─── ADD ITEM TO WATCHLIST ─────────────────────────────────
router.post("/:watchlistId/items", async (req, res) => {
  try {
    const item = await watchlistService.addItem(
      req.params.watchlistId,
      req.user.id,
      req.body,
    );
    res
      .status(201)
      .json({ success: true, data: item, message: "Item added to watchlist" });
  } catch (error) {
    console.error("❌ Add item error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── REMOVE ITEM FROM WATCHLIST ────────────────────────────
router.delete("/:watchlistId/items/:itemId", async (req, res) => {
  try {
    await watchlistService.removeItem(
      req.params.watchlistId,
      req.params.itemId,
      req.user.id,
    );
    res.json({ success: true, message: "Item removed from watchlist" });
  } catch (error) {
    console.error("❌ Remove item error:", error.message);
    res.status(404).json({ success: false, message: error.message });
  }
});

// ─── GET ALL USER ITEMS ────────────────────────────────────
router.get("/items/all", async (req, res) => {
  try {
    const items = await watchlistService.getAllUserItems(req.user.id);
    res.json({ success: true, data: items, count: items.length });
  } catch (error) {
    console.error("❌ Get all items error:", error.message);
    res.status(500).json({ success: false, message: "Failed to get items" });
  }
});

// ─── CHECK IF IN WATCHLIST ─────────────────────────────────
router.get("/check/:symbol/:assetClass", async (req, res) => {
  try {
    const result = await watchlistService.isInWatchlist(
      req.user.id,
      req.params.symbol,
      req.params.assetClass,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Check watchlist error:", error.message);
    res.status(500).json({ success: false, message: "Check failed" });
  }
});

export default router;
