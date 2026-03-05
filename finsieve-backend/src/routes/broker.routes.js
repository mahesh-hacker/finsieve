/**
 * Broker Routes
 * Handles OAuth callbacks, token management, historical data, and quotes
 * for Upstox, Zerodha, and Angel One.
 *
 * Base path: /api/v1/broker
 *
 * Endpoints:
 *   GET  /upstox/auth                    → redirect to Upstox OAuth
 *   GET  /upstox/callback?code=...       → exchange code, store token
 *   GET  /upstox/status                  → connection status
 *   GET  /upstox/historical              → OHLCV candles
 *   GET  /upstox/intraday                → intraday candles
 *   GET  /upstox/quote                   → live quote
 *   GET  /upstox/search                  → instrument search
 *
 *   GET  /zerodha/auth                   → redirect to Kite login
 *   GET  /zerodha/callback?request_token → exchange token
 *   GET  /zerodha/historical             → OHLCV candles
 *   GET  /zerodha/quote                  → live quote
 *
 *   POST /angelone/login                 → login with credentials (TOTP)
 *   GET  /angelone/historical            → OHLCV candles
 *   GET  /angelone/quote                 → live quote
 *
 *   GET  /status                         → all broker connection status
 *   GET  /historical                     → smart router (tries Upstox → Zerodha → AngelOne)
 */

import { Router } from "express";
import upstoxService   from "../services/upstox.service.js";
import zerodhaService  from "../services/zerodha.service.js";
import angelOneService from "../services/angelone.service.js";
import marketDataBroadcaster from "../services/marketDataBroadcaster.service.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// ─── Helper ──────────────────────────────────────────────────────────────────
const ok  = (res, data)         => res.json({ success: true,  data });
const err = (res, msg, code=500) => res.status(code).json({ success: false, message: msg });

// ─── Upstox ──────────────────────────────────────────────────────────────────

/** Step 1: Redirect to Upstox login */
router.get("/upstox/auth", (req, res) => {
  if (!process.env.UPSTOX_CLIENT_ID) {
    return err(res, "UPSTOX_CLIENT_ID not configured in .env", 400);
  }
  res.redirect(upstoxService.getAuthUrl());
});

/** Step 2: OAuth callback – exchange code for access_token */
router.get("/upstox/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return err(res, "Missing authorization code", 400);

  try {
    const token = await upstoxService.exchangeCode(code);
    // In production: store token in DB associated with user session
    // After getting token, connect the WebSocket
    await upstoxService.connect();
    res.json({
      success: true,
      message: "Upstox connected successfully",
      // Don't expose the full token in response; store server-side
    });
  } catch (e) {
    err(res, e.message);
  }
});

/** Set Upstox access token manually (authenticated: prevents token hijacking) */
router.post("/upstox/token", authenticate, (req, res) => {
  const { access_token } = req.body;
  if (!access_token || typeof access_token !== "string" || access_token.length > 2048) {
    return err(res, "access_token required", 400);
  }
  upstoxService.setAccessToken(access_token);
  upstoxService.connect();
  ok(res, { message: "Token set, connecting..." });
});

router.get("/upstox/status", (req, res) => {
  ok(res, {
    connected:   upstoxService.isConnected(),
    hasToken:    !!upstoxService.accessToken,
    subscribers: upstoxService.subscribers.size,
  });
});

/**
 * Historical candles via Upstox
 * GET /upstox/historical?instrument_key=NSE_EQ%7CINE002A01018&interval=day&from=2024-01-01&to=2024-12-31
 */
router.get("/upstox/historical", async (req, res) => {
  const { instrument_key, interval = "day", from, to } = req.query;
  if (!instrument_key || !from || !to) {
    return err(res, "instrument_key, from, to are required", 400);
  }
  try {
    const candles = await upstoxService.getHistoricalCandles(instrument_key, interval, to, from);
    ok(res, candles);
  } catch (e) {
    err(res, e.message);
  }
});

/**
 * Intraday candles via Upstox
 * GET /upstox/intraday?instrument_key=NSE_EQ%7CINE002A01018&interval=1minute
 */
router.get("/upstox/intraday", async (req, res) => {
  const { instrument_key, interval = "1minute" } = req.query;
  if (!instrument_key) return err(res, "instrument_key required", 400);
  try {
    const candles = await upstoxService.getIntradayCandles(instrument_key, interval);
    ok(res, candles);
  } catch (e) {
    err(res, e.message);
  }
});

/**
 * Live quote via Upstox
 * GET /upstox/quote?keys=NSE_EQ%7CINE002A01018,NSE_INDEX%7CNifty+50
 */
router.get("/upstox/quote", async (req, res) => {
  const keys = (req.query.keys ?? "").split(",").filter(Boolean);
  if (!keys.length) return err(res, "keys query param required", 400);
  try {
    const data = await upstoxService.getMarketQuote(keys);
    ok(res, data);
  } catch (e) {
    err(res, e.message);
  }
});

/**
 * Instrument search via Upstox
 * GET /upstox/search?q=RELIANCE&exchange=NSE_EQ
 */
router.get("/upstox/search", async (req, res) => {
  const { q, exchange = "" } = req.query;
  if (!q) return err(res, "q required", 400);
  try {
    const results = await upstoxService.searchInstruments(q, exchange);
    ok(res, results);
  } catch (e) {
    err(res, e.message);
  }
});

// ─── Zerodha ─────────────────────────────────────────────────────────────────

/** Step 1: Redirect to Kite login */
router.get("/zerodha/auth", (req, res) => {
  if (!process.env.ZERODHA_API_KEY) {
    return err(res, "ZERODHA_API_KEY not configured in .env", 400);
  }
  res.redirect(zerodhaService.getAuthUrl());
});

/** Step 2: Exchange request_token for access_token */
router.get("/zerodha/callback", async (req, res) => {
  const { request_token, status } = req.query;
  if (status === "error") return err(res, "User denied Zerodha auth", 400);
  if (!request_token)     return err(res, "Missing request_token", 400);

  try {
    await zerodhaService.exchangeToken(request_token);
    zerodhaService.connect();
    ok(res, { message: "Zerodha connected successfully" });
  } catch (e) {
    err(res, e.message);
  }
});

router.post("/zerodha/token", authenticate, (req, res) => {
  const { access_token } = req.body;
  if (!access_token || typeof access_token !== "string" || access_token.length > 2048) {
    return err(res, "access_token required", 400);
  }
  zerodhaService.setAccessToken(access_token);
  zerodhaService.connect();
  ok(res, { message: "Token set, connecting..." });
});

/**
 * Historical candles via Zerodha
 * GET /zerodha/historical?token=738561&interval=day&from=2024-01-01&to=2024-12-31
 */
router.get("/zerodha/historical", async (req, res) => {
  const { token, interval = "day", from, to, continuous = "0" } = req.query;
  if (!token || !from || !to) return err(res, "token, from, to required", 400);
  try {
    const candles = await zerodhaService.getHistoricalData(
      parseInt(token), interval, from, to, continuous === "1"
    );
    ok(res, candles);
  } catch (e) {
    err(res, e.message);
  }
});

/** GET /zerodha/quote?instruments=NSE:RELIANCE,MCX:GOLD */
router.get("/zerodha/quote", async (req, res) => {
  const instruments = (req.query.instruments ?? "").split(",").filter(Boolean);
  if (!instruments.length) return err(res, "instruments required", 400);
  try {
    const data = await zerodhaService.getQuote(instruments);
    ok(res, data);
  } catch (e) {
    err(res, e.message);
  }
});

// ─── Angel One ───────────────────────────────────────────────────────────────

/** Login using server-side credentials + TOTP (no OAuth redirect) */
router.post("/angelone/login", async (req, res) => {
  if (!process.env.ANGELONE_API_KEY) {
    return err(res, "ANGELONE_API_KEY not configured", 400);
  }
  try {
    await angelOneService.login();
    angelOneService.connect();
    ok(res, { message: "Angel One logged in and WebSocket connecting" });
  } catch (e) {
    err(res, e.message);
  }
});

/**
 * Historical candles via Angel One
 * GET /angelone/historical?exchange=NSE&token=2885&interval=ONE_DAY&from=2024-01-01+09:00&to=2024-12-31+15:30
 */
router.get("/angelone/historical", async (req, res) => {
  const { exchange = "NSE", token, interval = "ONE_DAY", from, to } = req.query;
  if (!token || !from || !to) return err(res, "token, from, to required", 400);
  try {
    const candles = await angelOneService.getCandleData(exchange, token, interval, from, to);
    ok(res, candles);
  } catch (e) {
    err(res, e.message);
  }
});

// ─── Unified smart router ─────────────────────────────────────────────────────

/**
 * Smart historical data endpoint – tries best available broker.
 * GET /historical?symbol=NSE:RELIANCE&interval=day&from=2024-01-01&to=2024-12-31
 *
 * Symbol format: "EXCHANGE:TRADINGSYMBOL"
 * Supported intervals: 1minute, 5minute, 15minute, 30minute, 60minute, day, week, month
 */
router.get("/historical", async (req, res) => {
  const { symbol, interval = "day", from, to } = req.query;
  if (!symbol || !from || !to) return err(res, "symbol, from, to required", 400);

  const [exchange, tradingSymbol] = symbol.toUpperCase().split(":");

  // Interval mapping per broker
  const intervalMap = {
    upstox: {
      "1minute": "1minute", "5minute": "5minute",  "15minute": "15minute",
      "30minute": "30minute", "60minute": "60minute", "day": "day",
      "week": "week", "month": "month",
    },
    zerodha: {
      "1minute": "minute",  "5minute": "5minute",  "15minute": "15minute",
      "30minute": "30minute", "60minute": "60minute", "day": "day",
      "week": "week", "month": "month",
    },
    angelone: {
      "1minute": "ONE_MINUTE", "5minute": "FIVE_MINUTE", "15minute": "FIFTEEN_MINUTE",
      "30minute": "THIRTY_MINUTE", "60minute": "ONE_HOUR", "day": "ONE_DAY",
    },
  };

  // ── Try Upstox ──
  if (upstoxService.accessToken) {
    try {
      // Build Upstox instrument key from symbol
      const { UPSTOX_INSTRUMENTS } = await import("./upstox.service.js").catch(() => ({}));
      // Use a simple mapping or accept instrument_key directly
      const instrKey = req.query.instrument_key;
      if (instrKey) {
        const candles = await upstoxService.getHistoricalCandles(
          instrKey, intervalMap.upstox[interval] ?? interval, to, from
        );
        return ok(res, { candles, source: "upstox" });
      }
    } catch (e) {
      console.warn("Upstox historical failed, trying Zerodha:", e.message);
    }
  }

  // ── Try Zerodha ──
  if (zerodhaService.accessToken) {
    try {
      const token = req.query.zerodha_token;
      if (token) {
        const candles = await zerodhaService.getHistoricalData(
          parseInt(token), intervalMap.zerodha[interval] ?? interval, from, to
        );
        return ok(res, { candles, source: "zerodha" });
      }
    } catch (e) {
      console.warn("Zerodha historical failed, trying Angel One:", e.message);
    }
  }

  // ── Try Angel One ──
  if (angelOneService.jwtToken) {
    try {
      const angelToken = req.query.angel_token;
      if (angelToken) {
        const candles = await angelOneService.getCandleData(
          exchange, angelToken, intervalMap.angelone[interval] ?? "ONE_DAY", from, to
        );
        return ok(res, { candles, source: "angelone" });
      }
    } catch (e) {
      console.warn("Angel One historical failed:", e.message);
    }
  }

  err(res, "No broker available or broker tokens not set in request params. " +
       "Provide instrument_key (Upstox), zerodha_token, or angel_token.", 503);
});

/** GET /status – all broker + broadcaster status */
router.get("/status", (req, res) => {
  ok(res, {
    broadcaster: marketDataBroadcaster.getStatus(),
    upstox:   { connected: upstoxService.isConnected(),   hasToken: !!upstoxService.accessToken   },
    zerodha:  { connected: zerodhaService.isConnected(),  hasToken: !!zerodhaService.accessToken  },
    angelone: { connected: angelOneService.isConnected(), hasToken: !!angelOneService.jwtToken    },
  });
});

export default router;
