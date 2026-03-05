/**
 * Assets API — list and details for ETF, SIF, PMS, AIF
 * GET /api/v1/assets/:type/list
 * GET /api/v1/assets/:type/:id/details
 */

import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import screeningService from "../services/screening.service.js";
import nseEtfService from "../services/nseEtf.service.js";

const router = express.Router();
router.use(authenticate);

const ASSET_TYPES = ["etf", "sif", "pms", "aif"];

router.get("/:type/list", async (req, res) => {
  try {
    const type = (req.params.type || "").toLowerCase();
    if (!ASSET_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Use: etf, sif, pms, aif",
      });
    }
    const assetClass = type.toUpperCase();
    const result = await screeningService.screen(assetClass, [], null, "desc", 500, 0);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (e) {
    console.error("Assets list error:", e.message);
    res.status(500).json({ success: false, message: "Failed to fetch list" });
  }
});

router.get("/:type/:id/details", async (req, res) => {
  try {
    const type = (req.params.type || "").toLowerCase();
    const id = req.params.id;
    if (!ASSET_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }
    const assetClass = type.toUpperCase();
    const result = await screeningService.screen(assetClass, [], null, "desc", 500, 0);
    const item = result.data.find(
      (d) => String(d.symbol || d.name || "").toLowerCase() === String(id).toLowerCase() || String(d.id) === id,
    );
    if (!item) {
      return res.status(404).json({ success: false, message: "Asset not found" });
    }
    if (type === "etf") {
      const etfs = await nseEtfService.getAllETFs();
      const full = etfs.find(
        (e) => String(e.symbol).toLowerCase() === String(id).toLowerCase(),
      ) || item;
      return res.json({ success: true, data: full });
    }
    res.json({ success: true, data: item });
  } catch (e) {
    console.error("Asset details error:", e.message);
    res.status(500).json({ success: false, message: "Failed to fetch details" });
  }
});

export default router;
