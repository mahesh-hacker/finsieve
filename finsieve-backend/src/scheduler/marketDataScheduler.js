import liveMarketDataService from "../services/liveMarketData.service.js";

/**
 * Market Data Scheduler
 * Automatically updates market data during trading hours
 */

class MarketDataScheduler {
  constructor() {
    this.updateInterval = null;
    this.isRunning = false;
    this.updateFrequency = 10000; // Update every 10 seconds during market hours
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  Scheduler is already running");
      return;
    }

    console.log("🚀 Starting market data scheduler...");
    console.log(`⏱️  Update frequency: ${this.updateFrequency / 1000} seconds`);

    this.isRunning = true;

    // Run initial update
    this.runUpdate();

    // Schedule regular updates
    this.updateInterval = setInterval(() => {
      this.runUpdate();
    }, this.updateFrequency);

    console.log("✅ Market data scheduler started successfully");
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log("⚠️  Scheduler is not running");
      return;
    }

    console.log("🛑 Stopping market data scheduler...");

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isRunning = false;
    console.log("✅ Market data scheduler stopped");
  }

  /**
   * Run a single update cycle
   */
  async runUpdate() {
    try {
      const openMarkets = liveMarketDataService.getOpenMarkets();

      if (openMarkets.length === 0) {
        // No markets open, skip update but keep scheduler running
        const now = new Date();
        console.log(
          `ℹ️  [${now.toISOString()}] No markets currently open. Next check in ${this.updateFrequency / 1000}s`,
        );
        return;
      }

      // Update live data for open markets
      const result = await liveMarketDataService.updateLiveData();

      console.log(
        `✅ [${new Date().toISOString()}] Updated ${result.updated} indices from ${result.markets.join(", ")}`,
      );
    } catch (error) {
      console.error("❌ Error in scheduler update:", error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      updateFrequency: this.updateFrequency,
      openMarkets: liveMarketDataService.getOpenMarkets(),
      marketStatus: liveMarketDataService.getMarketStatus(),
    };
  }

  /**
   * Update the frequency of updates
   * @param {number} milliseconds - New update frequency in milliseconds
   */
  setUpdateFrequency(milliseconds) {
    const oldFrequency = this.updateFrequency;
    this.updateFrequency = milliseconds;

    console.log(
      `⚙️  Update frequency changed from ${oldFrequency / 1000}s to ${milliseconds / 1000}s`,
    );

    // Restart scheduler if it's running to apply new frequency
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

// Create singleton instance
const scheduler = new MarketDataScheduler();

export default scheduler;
