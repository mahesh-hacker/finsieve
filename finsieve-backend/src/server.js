import express from "express";
import http from "http";
import crypto from "crypto";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { testConnection } from "./config/database.js";
import marketDataBroadcaster from "./services/marketDataBroadcaster.service.js";

// Import schedulers
import nseDataScheduler from "./scheduler/nseDataScheduler.js";
import nseStocksScheduler from "./scheduler/nseStocksScheduler.js";
import globalMarketScheduler from "./scheduler/globalMarketScheduler.js";
import cryptoScheduler from "./scheduler/cryptoScheduler.js";
import commoditiesScheduler from "./scheduler/commoditiesScheduler.js";
import mutualFundsScheduler from "./scheduler/mutualFundsScheduler.js";

// Load environment variables
dotenv.config();

// Create Express app and HTTP server (needed to share port with WebSocket)
const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// ── Request tracing ID ─────────────────────
app.use((req, _res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  next();
});

// ── Security headers (Helmet) ──────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],   // MUI needs inline styles
      imgSrc:      ["'self'", "data:", "https:"],
      connectSrc:  ["'self'", "wss:", "ws:"],
      fontSrc:     ["'self'", "https:"],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding charts
}));

// ── CORS ────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : (process.env.NODE_ENV === "production"
      ? []  // No fallback in production — must set env var
      : ["http://localhost:5173", "http://localhost:5174"]);

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  throw new Error("FATAL: ALLOWED_ORIGINS must be set in production");
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ── Global rate limiter (all routes) ────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 500,                   // 500 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
  skip: (req) => req.path === "/health",  // Don't rate-limit health checks
});
app.use(globalLimiter);

// ── Auth endpoints: strict rate limiter ─────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                    // 20 auth attempts per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts, please try again in 15 minutes." },
});

// Body parsing — 100kb is sufficient for any JSON API payload; prevents memory DoS
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Cookie parser
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get("/health", async (req, res) => {
  const dbConnected = await testConnection();

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: dbConnected ? "connected" : "disconnected",
  });
});

// API info endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Finsieve API",
    version: process.env.API_VERSION || "v1",
    description: "360° Investment Intelligence Platform",
    documentation: "/api/docs",
    health: "/health",
    status: "running",
  });
});

// ============================================
// API ROUTES
// ============================================

// Import routes
import authRoutes from "./routes/auth.routes.js";
import marketRoutes from "./routes/market.routes.js";
import nseRoutes from "./routes/nse.routes.js";
import usRoutes from "./routes/us.routes.js";
import globalIndicesRoutes from "./routes/globalIndices.routes.js";
import cryptoRoutes from "./routes/crypto.routes.js";
import commoditiesRoutes from "./routes/commodities.routes.js";
import bondsRoutes from "./routes/bonds.routes.js";
import mutualFundsRoutes from "./routes/mutualfunds.routes.js";
import screeningRoutes from "./routes/screening.routes.js";
import comparisonRoutes from "./routes/comparison.routes.js";
import watchlistRoutes from "./routes/watchlist.routes.js";
import brokerRoutes from "./routes/broker.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import assetsRoutes from "./routes/assets.routes.js";

// Use routes
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/market", marketRoutes);
app.use("/api/v1/nse", nseRoutes);
app.use("/api/v1/us", usRoutes);
app.use("/api/v1/global-indices", globalIndicesRoutes);
app.use("/api/v1/crypto", cryptoRoutes);
app.use("/api/v1/commodities", commoditiesRoutes);
app.use("/api/v1/bonds", bondsRoutes);
app.use("/api/v1/mutual-funds", mutualFundsRoutes);
app.use("/api/v1/screening", screeningRoutes);
app.use("/api/v1/assets", assetsRoutes);
app.use("/api/v1/comparison", comparisonRoutes);
app.use("/api/v1/watchlists", watchlistRoutes);
app.use("/api/v1/broker", brokerRoutes);
app.use("/api/v1/chatbot", chatbotRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler — do not echo req.path to avoid path reflection
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Global error handler — only log message+stack server-side; never expose stack to clients
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message    = statusCode < 500 ? (err.message || "Bad Request") : "Internal Server Error";

  // Log full details server-side only
  console.error(`[${req.id}] ${req.method} ${req.path} → ${statusCode}:`, err.message);
  if (statusCode >= 500) console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    message,
    // Expose stack only in development (never in production)
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    // Test database connection
    console.log("🔍 Testing database connection...");
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error("❌ Failed to connect to database");
      console.error("⚠️  Server will start but database operations will fail");
      console.error(
        "📝 Please check your .env configuration and DATABASE_SETUP.md",
      );
    }

    // Start listening (using http.Server so WS can share the same port)
    server.listen(PORT, () => {
      console.log("\n✨ ================================");
      console.log(`🚀 Finsieve API Server Running`);
      console.log("✨ ================================");
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(
        `🗄️  Database: ${dbConnected ? "✅ Connected" : "❌ Not Connected"}`,
      );
      console.log(`📡 Market WS:  ws://localhost:${PORT}/ws/market`);
      console.log("✨ ================================\n");

      // Attach market data broadcaster WebSocket to the HTTP server
      marketDataBroadcaster.attach(server, "/ws/market");
      console.log("✅ Market Data WebSocket broadcaster attached");

      // All users get the same live update frequency (no tier gating)
      // NSE indices: 5s, NSE stocks: 8s — real-time for everyone

      // ============================================
      // START ALL SCHEDULERS
      // ============================================

      console.log("🌍 ================================");
      console.log("📡 STARTING MARKET DATA SCHEDULERS");
      console.log("🌍 ================================\n");

      // 1. NSE India - Indices (5s REST + Nifty 50 WebSocket)
      console.log("🇮🇳 Starting NSE India Scheduler...");
      nseDataScheduler.start();

      // 2. NSE India - Stocks (gainers/losers/volume/52W every 8s)
      console.log("🇮🇳 Starting NSE Stocks Scheduler...");
      nseStocksScheduler.start();

      // 3. Global Markets - Intelligent scheduling based on market hours
      console.log("\n🌍 Starting Global Market Scheduler...");
      globalMarketScheduler.start();

      // 4. Cryptocurrency - 24/7 updates (10 seconds)
      console.log("\n₿ Starting Cryptocurrency Scheduler...");
      cryptoScheduler.start();

      // 5. Commodities - Market hours based (10 seconds)
      console.log("\n🛢️  Starting Commodities Scheduler...");
      commoditiesScheduler.start();

      // 6. Mutual Funds - Daily updates (6 PM IST)
      console.log("\n📊 Starting Mutual Funds Scheduler...");
      mutualFundsScheduler.start();

      console.log("\n🌍 ================================");
      console.log("✅ ALL SCHEDULERS STARTED");
      console.log("🌍 ================================\n");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n👋 ${signal} received, shutting down gracefully...`);

  // Stop accepting new connections first
  server.close(() => {
    console.log("🛑 Stopping all schedulers...");
    nseDataScheduler.stop();
    nseStocksScheduler.stop();
    globalMarketScheduler.stop();
    cryptoScheduler.stop();
    commoditiesScheduler.stop();
    mutualFundsScheduler.stop();
    console.log("✅ All schedulers stopped. Exiting.");
    process.exit(0);
  });

  // Force exit if server hasn't closed in 10s
  setTimeout(() => {
    console.error("⚠️  Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

// Start the server
startServer();

export default app;
