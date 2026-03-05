/**
 * Cryptocurrency Market Scheduler
 * Runs 24/7 with 10-second updates
 * Crypto markets never close!
 */

import cryptoService from "../services/crypto.service.js";

class CryptoScheduler {
  constructor() {
    this.interval = null;
    this.isRunning = false;
    this.updateCount = 0;
    this.updateFrequency = 10000; // 10 seconds
  }

  /**
   * Start the crypto scheduler
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  Crypto Scheduler is already running");
      return;
    }

    console.log("\n₿ Starting Cryptocurrency Scheduler...");
    console.log("⏱️  Update Frequency: 10 seconds (24/7)");
    this.isRunning = true;

    // Initial update
    this.updateCryptoData();

    // Schedule recurring updates
    this.interval = setInterval(() => {
      this.updateCryptoData();
    }, this.updateFrequency);

    console.log("✅ Crypto Scheduler started successfully");
  }

  /**
   * Update cryptocurrency data
   */
  async updateCryptoData() {
    try {
      this.updateCount++;

      // Log every 6th update (once per minute with 10s frequency)
      const shouldLog = this.updateCount % 6 === 0;

      if (shouldLog) {
        console.log(
          `\n₿ Updating cryptocurrency data... (Update #${this.updateCount})`,
        );
      }

      // Get top cryptocurrencies
      const cryptoData = await cryptoService.getTopCryptos(50);

      if (shouldLog) {
        console.log(`✅ Updated ${cryptoData.length} cryptocurrencies`);

        // Log top 3 cryptos with prices
        if (cryptoData.length > 0) {
          console.log("   Top Cryptos:");
          cryptoData.slice(0, 3).forEach((crypto, index) => {
            const priceChange = crypto.price_change_percentage_24h || 0;
            const emoji = priceChange >= 0 ? "📈" : "📉";
            console.log(
              `   ${index + 1}. ${crypto.symbol.toUpperCase().padEnd(6)} $${crypto.current_price.toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              )} ${emoji} ${priceChange.toFixed(2)}%`,
            );
          });
        }
      }
    } catch (error) {
      console.error("❌ Error updating crypto data:", error.message);
    }
  }

  /**
   * Force update crypto data
   */
  async forceUpdate() {
    console.log("\n🔄 Force updating cryptocurrency data...");
    await this.updateCryptoData();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      updateCount: this.updateCount,
      updateFrequency: this.updateFrequency,
      marketStatus: "OPEN 24/7",
      lastUpdateTime: new Date().toISOString(),
    };
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log("⚠️  Crypto Scheduler is not running");
      return;
    }

    console.log("\n🛑 Stopping Crypto Scheduler...");

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;
    console.log("✅ Crypto Scheduler stopped");
  }
}

// Create singleton instance
const cryptoScheduler = new CryptoScheduler();

export default cryptoScheduler;
