import realNSEDataService from "../services/realNSEData.service.js";
import nseIndicesWebSocketService from "../services/nseIndicesWebSocket.service.js";
import { isMarketOpen, MARKET_HOURS } from "../config/marketHours.js";
import marketDataBroadcaster from "../services/marketDataBroadcaster.service.js";
import { getIndicesByCountry } from "../services/market.service.js";

/**
 * NSE Real-Time Data Scheduler
 * - REST: Fetches all Indian indices from NSE during market hours (9:15 AM - 3:30 PM IST) every 5s.
 * - WebSocket: Connects to wss://streamer.nseindia.com/streams/indices/high/nifty50 for live Nifty 50 ticks.
 */

class NSEDataScheduler {
  constructor() {
    this.updateInterval = null;
    this.marketCheckInterval = null;
    this.isRunning = false;
    this.updateFrequency = MARKET_HOURS.India?.updateFrequency ?? 5000; // 5s default
    this.lastUpdateTime = null;
    this.updateCount = 0;
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 5; // Reduce logging after 5 consecutive errors
  }

  /**
   * Start the scheduler (REST polling + Nifty 50 WebSocket when market open)
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  NSE Scheduler is already running");
      return;
    }

    console.log("🚀 Starting NSE Real-Time Data Scheduler...");
    console.log(
      `⚡ REST: every ${this.updateFrequency / 1000}s during market hours`,
    );
    console.log(`📡 WebSocket: Nifty 50 stream (streamer.nseindia.com)`);
    console.log(`🕐 Market hours: 9:15 AM - 3:30 PM IST (Mon-Fri)`);

    this.isRunning = true;

    // One-time cleanup: remove duplicate index rows (e.g. NIFTY vs NIFTY50)
    realNSEDataService.deduplicateIndices();

    // Seed all indices on startup regardless of market hours (NSE returns last-traded values)
    realNSEDataService.updateNSEIndices()
      .then((r) => console.log(`✅ Startup seed: ${r?.updated ?? 0}/${r?.total ?? 0} NSE indices populated`))
      .catch((e) => console.warn("⚠️  Startup seed failed (will retry when market opens):", e.message));

    nseIndicesWebSocketService.setMarketOpen(isMarketOpen("India"));

    // Start Nifty 50 WebSocket when market is open (with session cookies)
    const tryStartWebSocket = async () => {
      if (!isMarketOpen("India")) {
        nseIndicesWebSocketService.setMarketOpen(false);
        nseIndicesWebSocketService.disconnect();
        return;
      }
      nseIndicesWebSocketService.setMarketOpen(true);
      if (nseIndicesWebSocketService.isConnected()) return;
      await realNSEDataService.initSession();
      const cookies = realNSEDataService.getCookies();
      nseIndicesWebSocketService.connect({
        cookies,
        onlyWhenMarketOpen: true,
      });
    };
    tryStartWebSocket();

    // Check market open/closed every 60s to connect/disconnect WebSocket
    this.marketCheckInterval = setInterval(() => {
      const open = isMarketOpen("India");
      nseIndicesWebSocketService.setMarketOpen(open);
      if (open && !nseIndicesWebSocketService.isConnected()) {
        tryStartWebSocket();
      } else if (!open) {
        nseIndicesWebSocketService.disconnect();
      }
    }, 60000);

    // Run initial REST update immediately
    this.runUpdate();

    this.updateInterval = setInterval(() => {
      this.runUpdate();
    }, this.updateFrequency);

    console.log("✅ NSE data scheduler started successfully");
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log("⚠️  NSE Scheduler is not running");
      return;
    }

    console.log("🛑 Stopping NSE data scheduler...");

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.marketCheckInterval) {
      clearInterval(this.marketCheckInterval);
      this.marketCheckInterval = null;
    }
    nseIndicesWebSocketService.disconnect();

    this.isRunning = false;
    this.lastUpdateTime = null;
    console.log("✅ NSE data scheduler stopped");
  }

  /**
   * Run a single update cycle
   */
  async runUpdate() {
    try {
      // Check if NSE market is open
      const marketOpen = isMarketOpen("India");

      if (!marketOpen) {
        // Market closed - skip update and reset error counter
        this.consecutiveErrors = 0;
        return;
      }

      // Market is OPEN - fetch real-time data
      const result = await realNSEDataService.updateNSEIndices();

      if (result.success) {
        this.updateCount++;
        this.lastUpdateTime = new Date();
        this.consecutiveErrors = 0;

        // Push live index updates to all connected frontend clients via WebSocket
        if (marketDataBroadcaster.clients.size > 0) {
          try {
            const rows = await getIndicesByCountry("India");
            marketDataBroadcaster.broadcastAll({
              type:      "indices_update",
              country:   "India",
              data:      rows,
              timestamp: this.lastUpdateTime.toISOString(),
            });
          } catch { /* non-fatal */ }
        }

        // Log every 12th update (~1 min at 5s) to reduce noise
        const logInterval = Math.max(12, Math.ceil(60000 / this.updateFrequency));
        if (this.updateCount % logInterval === 0) {
          console.log(
            `✅ Update #${this.updateCount}: ${result.updated}/${result.total} indices updated`,
          );
        }

        if (
          result.errors &&
          result.errors.length > 0 &&
          this.updateCount % logInterval === 0
        ) {
          console.log(`⚠️  ${result.errors.length} errors encountered:`);
          result.errors.forEach((err) => {
            console.log(`   - ${err.symbol}: ${err.error}`);
          });
        }
      } else {
        this.consecutiveErrors++;

        // Only log first 5 consecutive errors to prevent spam
        if (this.consecutiveErrors <= this.maxConsecutiveErrors) {
          console.error(`❌ Failed to update NSE data: ${result.error}`);
        } else if (this.consecutiveErrors === this.maxConsecutiveErrors + 1) {
          console.error(
            `⚠️  Too many consecutive errors (${this.consecutiveErrors}). Suppressing further error logs until success...`,
          );
        }
      }
    } catch (error) {
      this.consecutiveErrors++;

      // Only log first 5 consecutive errors
      if (this.consecutiveErrors <= this.maxConsecutiveErrors) {
        console.error("❌ Error in NSE scheduler update:", error.message);
      }
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      updateFrequency: this.updateFrequency,
      lastUpdateTime: this.lastUpdateTime,
      updateCount: this.updateCount,
      isMarketOpen: realNSEDataService.isMarketOpen(),
      dataSource: "NSE India API (REST + Nifty 50 WebSocket)",
      nifty50WebSocket: nseIndicesWebSocketService.isConnected()
        ? { connected: true, lastUpdate: nseIndicesWebSocketService.getLastUpdate() }
        : { connected: false },
    };
  }

  /**
   * Set update frequency
   * @param {number} frequencyMs - Update frequency in milliseconds
   */
  setUpdateFrequency(frequencyMs) {
    if (frequencyMs < 100) {
      console.log(
        "⚠️  Minimum update frequency is 100ms (10x per second) for ultra-fast updates",
      );
      frequencyMs = 100;
    }

    this.updateFrequency = frequencyMs;
    console.log(
      `⚡ Update frequency set to ${frequencyMs}ms (${1000 / frequencyMs}x per second)`,
    );

    // Restart scheduler with new frequency if running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

const nseScheduler = new NSEDataScheduler();

export default nseScheduler;
