/**
 * InvestBot chatbot routes
 * POST /api/v1/chatbot/message
 */
import express from "express";
import rateLimit from "express-rate-limit";
import { chatMessage } from "../controllers/chatbot.controller.js";
import { decryptRequest, encryptResponse } from "../middleware/encryption.middleware.js";

const router = express.Router();

const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many questions! Please wait a moment before asking again." },
  keyGenerator: (req) => req.ip || "unknown",
});

// POST /api/v1/chatbot/message
router.post("/message", chatbotLimiter, decryptRequest, encryptResponse, chatMessage);

export default router;
