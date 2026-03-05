/**
 * Global Market Scheduler
 * Intelligent scheduler that runs updates based on actual market hours
 * Optimizes API calls by only fetching data when markets are open
 */

import {
  isMarketOpen,
  getAllMarketStatus,
  MARKET_HOURS,
} from "../config/marketHours.js";
import usIndicesUpdateService from "../services/usIndicesUpdate.service.js";
import marketDataBroadcaster from "../services/marketDataBroadcaster.service.js";
import { getGlobalIndices } from "../services/market.service.js";

class GlobalMarketScheduler {
  constructor() {
    this.intervals = {};
    this.isRunning = false;
    this.marketStatus = {};
  }

  /**
   * Start the global market scheduler
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  Global Market Scheduler is already running");
      return;
    }

    console.log("\n🌍 Starting Global Market Scheduler...");
    this.isRunning = true;

    // Initialize market status
    this.updateMarketStatus();

    // Schedule updates ONCE for US indices
    this.scheduleMarket("United States", () =>
      usIndicesUpdateService.updateUSIndices(),
    );

    // Schedule updates ONCE for all global indices (not per country!)
    // This prevents duplicate API calls for European/Asian markets
    this.scheduleGlobalIndices();

    // Update market status every minute
    this.statusInterval = setInterval(() => {
      this.updateMarketStatus();
    }, 60000); // Check status every 60 seconds

    this.logInitialStatus();
  }

  /**
   * Schedule updates for a specific market
   * @param {string} country - Country name
   * @param {Function} updateFn - Update function to call
   */
  scheduleMarket(country, updateFn) {
    const market = MARKET_HOURS[country];
    if (!market) {
      console.log(`⚠️  Unknown market: ${country}`);
      return;
    }

    const frequency = market.updateFrequency;
    let updateCount = 0;

    this.intervals[country] = setInterval(async () => {
      const isOpen = isMarketOpen(country);

      if (isOpen) {
        try {
          updateCount++;

          // Only log every 12th update (1 minute for 5s frequency)
          const shouldLog = updateCount % 12 === 0;

          if (shouldLog) {
            console.log(`\n🔄 Updating ${market.name}...`);
          }

          await updateFn();

          if (shouldLog) {
            console.log(`✅ ${market.name} updated successfully`);
          }
        } catch (error) {
          console.error(`❌ Error updating ${market.name}:`, error.message);
        }
      } else {
        // Market closed - log status change
        if (this.marketStatus[country] !== "CLOSED") {
          console.log(`🔴 ${market.name} is now CLOSED`);
          this.marketStatus[country] = "CLOSED";
        }
      }
    }, frequency);
  }

  /**
   * Schedule global indices update (once for all markets)
   * This prevents duplicate API calls - one update serves all markets
   */
  scheduleGlobalIndices() {
    const frequency = 30000; // 30 seconds (reduced from 5s to prevent DB overload)
    let updateCount = 0;

    this.intervals["GlobalIndices"] = setInterval(async () => {
      // Check if ANY European or Asian market is open
      const europeanMarkets = ["United Kingdom", "Germany", "France"];
      const asianMarkets = ["Japan", "Hong Kong", "China", "Australia"];
      const allMarkets = [...europeanMarkets, ...asianMarkets];

      const anyMarketOpen = allMarkets.some((country) => isMarketOpen(country));

      if (anyMarketOpen) {
        try {
          updateCount++;

          // Log every 2nd update (once per minute with 30s frequency)
          const shouldLog = updateCount % 2 === 0;

          if (shouldLog) {
            const openMarkets = allMarkets.filter((c) => isMarketOpen(c));
            console.log(
              `\n🌍 Updating global indices (${openMarkets.join(", ")} OPEN)...`,
            );
          }

          await usIndicesUpdateService.updateGlobalIndices();

          if (shouldLog) {
            console.log(`✅ Global indices updated successfully`);
          }

          // Push to all connected frontend clients
          if (marketDataBroadcaster.clients.size > 0) {
            try {
              const result = await getGlobalIndices({ limit: 100 });
              marketDataBroadcaster.broadcastAll({
                type:      "indices_update",
                country:   "all",
                data:      result.data,
                timestamp: new Date().toISOString(),
              });
            } catch { /* non-fatal */ }
          }
        } catch (error) {
          console.error(`❌ Error updating global indices:`, error.message);
        }
      }
    }, frequency);
  }

  /**
   * Update European market indices
   * @param {string} country - European country
   */
  async updateEuropeanMarket(country) {
    // European markets are part of global indices update
    await usIndicesUpdateService.updateGlobalIndices();
  }

  /**
   * Update Asian market indices
   * @param {string} country - Asian country
   */
  async updateAsianMarket(country) {
    // Asian markets are part of global indices update
    await usIndicesUpdateService.updateGlobalIndices();
  }

  /**
   * Update market status for all markets
   */
  updateMarketStatus() {
    const status = getAllMarketStatus();

    for (const [country, info] of Object.entries(status)) {
      const previousStatus = this.marketStatus[country];
      const currentStatus = info.status;

      // Log status changes
      if (previousStatus !== currentStatus) {
        const emoji = currentStatus === "OPEN" ? "🟢" : "🔴";
        console.log(`\n${emoji} ${info.name} is now ${currentStatus}`);
        console.log(`   Local Time: ${info.localTime}`);
      }

      this.marketStatus[country] = currentStatus;
    }
  }

  /**
   * Log initial status of all markets
   */
  logInitialStatus() {
    console.log("\n📊 Current Market Status:");
    console.log("═".repeat(60));

    const status = getAllMarketStatus();
    const regions = {
      "Asia-Pacific": ["India", "Japan", "Hong Kong", "China", "Australia"],
      Europe: ["United Kingdom", "Germany", "France"],
      Americas: ["United States", "Canada"],
    };

    for (const [region, countries] of Object.entries(regions)) {
      console.log(`\n${region}:`);
      countries.forEach((country) => {
        if (status[country]) {
          const emoji = status[country].isOpen ? "🟢" : "🔴";
          const freq = status[country].updateFrequency / 1000;
          console.log(
            `  ${emoji} ${status[country].name.padEnd(30)} ${status[country].status.padEnd(8)} (${freq}s updates)`,
          );
        }
      });
    }

    console.log("\n═".repeat(60));
  }

  /**
   * Get current scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeMarkets: Object.keys(this.intervals),
      marketStatus: this.marketStatus,
      allMarkets: getAllMarketStatus(),
    };
  }

  /**
   * Force update all open markets
   */
  async forceUpdateAllOpenMarkets() {
    console.log("\n🔄 Force updating all open markets...");

    const openMarkets = Object.keys(this.marketStatus).filter(
      (country) => this.marketStatus[country] === "OPEN",
    );

    console.log(`📊 Found ${openMarkets.length} open markets:`, openMarkets);

    for (const country of openMarkets) {
      try {
        if (country === "United States") {
          await usIndicesUpdateService.updateUSIndices();
        } else {
          await usIndicesUpdateService.updateGlobalIndices();
        }
        console.log(`✅ Updated ${country}`);
      } catch (error) {
        console.error(`❌ Failed to update ${country}:`, error.message);
      }
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log("⚠️  Global Market Scheduler is not running");
      return;
    }

    console.log("\n🛑 Stopping Global Market Scheduler...");

    // Clear all market intervals
    for (const [country, interval] of Object.entries(this.intervals)) {
      clearInterval(interval);
      console.log(`   ✓ Stopped ${country} scheduler`);
    }

    // Clear status interval
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }

    this.intervals = {};
    this.isRunning = false;
    console.log("✅ Global Market Scheduler stopped");
  }
}

// Create singleton instance
const globalMarketScheduler = new GlobalMarketScheduler();

export default globalMarketScheduler;
