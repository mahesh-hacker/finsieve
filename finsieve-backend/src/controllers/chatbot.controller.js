/**
 * InvestBot Chatbot Controller
 * Uses a rule-based investment engine — no external AI API required.
 */
import { processMessage } from "../services/investbot.service.js";

// Sanitize user input: strip HTML/script tags, limit length
const sanitize = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "")        // strip HTML
    .replace(/[<>'"`]/g, "")        // strip risky chars
    .slice(0, 800);                  // max 800 chars per message
};

export const chatMessage = async (req, res) => {
  try {
    const rawMessage = req.body.message;
    const rawHistory = req.body.history;

    if (!rawMessage || typeof rawMessage !== "string") {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const message = sanitize(rawMessage);
    if (!message) {
      return res.status(400).json({ success: false, message: "Invalid message content." });
    }

    // Validate and sanitize history (last 10 messages)
    const history = Array.isArray(rawHistory)
      ? rawHistory
          .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
          .slice(-10)
          .map(m => ({ role: m.role, content: sanitize(m.content) }))
      : [];

    // Fetch live market context (non-fatal)
    let marketContext = "";
    try {
      marketContext = await getLiveMarketContext(message);
    } catch {
      // proceed without live data
    }

    const botReply = processMessage(message, history, marketContext);

    return res.json({ success: true, message: botReply });

  } catch (err) {
    console.error("[chatbot] Error:", err.message);
    return res.status(500).json({ success: false, message: "An error occurred. Please try again." });
  }
};

// Fetch live market context from our own internal API
async function getLiveMarketContext(message) {
  const isInvestmentQuery = /(\d+k?|lakh|₹|rs\.?|return|invest|risk|portfolio|nifty|sensex|equity|fund|bond|gold)/i.test(message);
  if (!isInvestmentQuery) return "";

  try {
    const baseUrl = process.env.INTERNAL_API_URL || `http://localhost:${process.env.PORT || 3000}`;
    const resp = await fetch(`${baseUrl}/api/v1/market/major-indices`, {
      headers: { "x-internal-request": "true" },
      signal: AbortSignal.timeout(3000),
    });
    if (!resp.ok) return "";
    const data = await resp.json();
    if (data.success && Array.isArray(data.data)) {
      const indices = data.data.slice(0, 4).map(idx =>
        `${idx.symbol}: ${idx.current_value} (${idx.change_percent > 0 ? "+" : ""}${Number(idx.change_percent).toFixed(2)}%)`
      );
      return indices.length ? indices.join(", ") : "";
    }
  } catch {
    // non-fatal
  }
  return "";
}
