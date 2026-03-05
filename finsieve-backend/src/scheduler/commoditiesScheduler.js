/**
 * Commodities Market Scheduler
 * Updates based on CME trading hours (8:00 AM - 5:00 PM EST)
 * Includes Gold, Silver, Crude Oil, Natural Gas, etc.
 */

import { isMarketOpen } from "../config/marketHours.js";

class CommoditiesScheduler {
  constructor() {
    this.interval = null;
    this.statusInterval = null;
    this.isRunning = false;
    this.updateCount = 0;
    this.updateFrequency = 10000; // 10 seconds
    this.isMarketOpen = false;
  }

  /**
   * Start the commodities scheduler
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  Commodities Scheduler is already running");
      return;
    }

    console.log("\n🛢️  Starting Commodities Scheduler...");
    console.log("⏰  Market Hours: 8:00 AM - 5:00 PM EST (CME)");
    console.log("⏱️  Update Frequency: 10 seconds (when market is open)");
    this.isRunning = true;

    // Check initial market status
    this.checkMarketStatus();

    // Schedule recurring updates
    this.interval = setInterval(() => {
      this.updateCommoditiesData();
    }, this.updateFrequency);

    // Check market status every minute
    this.statusInterval = setInterval(() => {
      this.checkMarketStatus();
    }, 60000);

    console.log("✅ Commodities Scheduler started successfully");
  }

  /**
   * Check if commodities market is open
   */
  checkMarketStatus() {
    const wasOpen = this.isMarketOpen;
    this.isMarketOpen = isMarketOpen("Commodities");

    // Log status changes
    if (wasOpen !== this.isMarketOpen) {
      const emoji = this.isMarketOpen ? "🟢" : "🔴";
      const status = this.isMarketOpen ? "OPEN" : "CLOSED";
      console.log(`\n${emoji} Commodities Market is now ${status}`);
    }
  }

  /**
   * Update commodities data
   */
  async updateCommoditiesData() {
    // Only update if market is open
    if (!this.isMarketOpen) {
      return;
    }

    try {
      this.updateCount++;

      // Log every 6th update (once per minute with 10s frequency)
      const shouldLog = this.updateCount % 6 === 0;

      if (shouldLog) {
        console.log(
          `\n🛢️  Updating commodities data... (Update #${this.updateCount})`,
        );
      }

      // TODO: Implement actual commodities data fetching
      // This is a placeholder - you'll need to integrate with a commodities API
      const commodities = await this.fetchCommoditiesData();

      if (shouldLog && commodities.length > 0) {
        console.log(`✅ Updated ${commodities.length} commodities`);

        // Log major commodities with prices
        console.log("   Major Commodities:");
        commodities.slice(0, 5).forEach((commodity) => {
          const priceChange = commodity.change || 0;
          const emoji = priceChange >= 0 ? "📈" : "📉";
          console.log(
            `   • ${commodity.name.padEnd(15)} $${commodity.price.toFixed(2)} ${emoji} ${priceChange.toFixed(2)}%`,
          );
        });
      }
    } catch (error) {
      console.error("❌ Error updating commodities data:", error.message);
    }
  }

  /**
   * Fetch commodities data from API
   * @returns {Promise<Array>} - Array of commodity data
   */
  async fetchCommoditiesData() {
    // TODO: Replace with actual API integration
    // Options: Yahoo Finance, Alpha Vantage, Commodities API, etc.

    // Placeholder data structure
    return [
      { name: "Gold", symbol: "GC=F", price: 2055.8, change: 0.45 },
      { name: "Silver", symbol: "SI=F", price: 23.15, change: -0.32 },
      { name: "Crude Oil", symbol: "CL=F", price: 78.92, change: 1.23 },
      { name: "Natural Gas", symbol: "NG=F", price: 2.87, change: -1.15 },
      { name: "Copper", symbol: "HG=F", price: 3.82, change: 0.67 },
    ];
  }

  /**
   * Force update commodities data
   */
  async forceUpdate() {
    console.log("\n🔄 Force updating commodities data...");
    this.isMarketOpen = true; // Temporarily enable updates
    await this.updateCommoditiesData();
    this.isMarketOpen = isMarketOpen("Commodities"); // Restore actual status
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isMarketOpen: this.isMarketOpen,
      marketStatus: this.isMarketOpen ? "OPEN" : "CLOSED",
      updateCount: this.updateCount,
      updateFrequency: this.updateFrequency,
      marketHours: "8:00 AM - 5:00 PM EST",
      lastUpdateTime: new Date().toISOString(),
    };
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log("⚠️  Commodities Scheduler is not running");
      return;
    }

    console.log("\n🛑 Stopping Commodities Scheduler...");

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }

    this.isRunning = false;
    console.log("✅ Commodities Scheduler stopped");
  }
}

// Create singleton instance
const commoditiesScheduler = new CommoditiesScheduler();

export default commoditiesScheduler;
