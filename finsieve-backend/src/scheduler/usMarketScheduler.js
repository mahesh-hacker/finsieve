import usIndicesUpdateService from "../services/usIndicesUpdate.service.js";

/**
 * US & Global Market Data Scheduler
 * Automatically updates US and global indices during trading hours
 */

class USMarketScheduler {
  constructor() {
    this.updateInterval = null;
    this.isRunning = false;
    this.updateFrequency = 10000; // Update every 10 seconds (10x per minute)
    this.lastUpdateTime = null;
    this.updateCount = 0;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️ US Market Scheduler is already running");
      return;
    }

    console.log("🚀 Starting US & Global Market Data Scheduler...");
    console.log(`⚡ Update frequency: ${this.updateFrequency / 1000} seconds`);
    console.log(`📡 Data source: Yahoo Finance API`);
    console.log(`🕐 US Market hours: 9:30 AM - 4:00 PM EST (Mon-Fri)`);

    this.isRunning = true;

    // Run initial update immediately
    this.runUpdate();

    // Schedule regular updates
    this.updateInterval = setInterval(() => {
      this.runUpdate();
    }, this.updateFrequency);

    console.log("✅ US market scheduler started successfully");
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log("⚠️ US Market Scheduler is not running");
      return;
    }

    console.log("🛑 Stopping US market scheduler...");

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isRunning = false;
    this.lastUpdateTime = null;
    console.log("✅ US market scheduler stopped");
  }

  /**
   * Run a single update cycle
   */
  async runUpdate() {
    try {
      // Always update - fetch Yahoo Finance data regardless of market hours
      // Yahoo Finance provides last known prices even when market is closed
      const result = await usIndicesUpdateService.updateAllMarkets();

      if (result.success) {
        this.updateCount++;
        this.lastUpdateTime = new Date();

        // Log every 6th update (once per minute with 10s interval)
        if (this.updateCount % 6 === 0) {
          const isMarketOpen = usIndicesUpdateService.isUSMarketOpen();
          const status = isMarketOpen ? "🟢 OPEN" : "🔴 CLOSED";
          console.log(
            `[${this.lastUpdateTime.toISOString()}] ${status} Updated ${result.totalUpdated} indices (US: ${result.us.updated}, Global: ${result.global.updated})`,
          );
        }
      } else {
        console.error("❌ Update failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Error in US market scheduler update:", error.message);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      updateFrequency: this.updateFrequency,
      updateCount: this.updateCount,
      lastUpdateTime: this.lastUpdateTime,
      isUSMarketOpen: usIndicesUpdateService.isUSMarketOpen(),
    };
  }

  /**
   * Force manual update
   */
  async forceUpdate() {
    console.log("🔄 Forcing manual update...");
    await this.runUpdate();
    console.log("✅ Manual update complete");
  }
}

export default new USMarketScheduler();
