/**
 * Mutual Funds Scheduler
 * Updates once daily when NAV is published (around 6:00 PM IST)
 * NAV (Net Asset Value) is published after market close
 */

class MutualFundsScheduler {
  constructor() {
    this.interval = null;
    this.isRunning = false;
    this.updateCount = 0;
    this.lastUpdateDate = null;

    // NAV is typically published around 6:00 PM IST
    this.updateHour = 18; // 6 PM IST
    this.updateMinute = 0;
  }

  /**
   * Start the mutual funds scheduler
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  Mutual Funds Scheduler is already running");
      return;
    }

    console.log("\n📊 Starting Mutual Funds Scheduler...");
    console.log("⏰  Update Time: 6:00 PM IST (daily)");
    console.log("📝  NAV updates published after market close");
    this.isRunning = true;

    // Check if we should update now
    this.checkAndUpdate();

    // Check every hour if it's time to update
    this.interval = setInterval(() => {
      this.checkAndUpdate();
    }, 3600000); // Check every 1 hour

    console.log("✅ Mutual Funds Scheduler started successfully");
  }

  /**
   * Check if it's time to update and perform update
   */
  async checkAndUpdate() {
    const now = new Date();
    const istTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    );

    const currentHour = istTime.getHours();
    const currentDate = istTime.toDateString();

    // Only update if:
    // 1. It's between 6:00 PM and 11:59 PM IST
    // 2. We haven't updated today yet
    const shouldUpdate =
      currentHour >= this.updateHour && this.lastUpdateDate !== currentDate;

    if (shouldUpdate) {
      await this.updateMutualFundsData();
      this.lastUpdateDate = currentDate;
    }
  }

  /**
   * Update mutual funds data
   */
  async updateMutualFundsData() {
    try {
      this.updateCount++;

      console.log(
        `\n📊 Updating Mutual Funds NAV data... (Daily Update #${this.updateCount})`,
      );
      console.log(
        `⏰ IST Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
      );

      // TODO: Implement actual mutual funds API integration
      // Options: AMFI API, NSE Mutual Funds API, etc.
      const fundsData = await this.fetchMutualFundsData();

      console.log(`✅ Updated ${fundsData.length} mutual funds`);

      // Log top performing funds
      if (fundsData.length > 0) {
        console.log("   Top Performing Funds (1Y returns):");
        fundsData.slice(0, 5).forEach((fund, index) => {
          const returns = fund.returns_1y || 0;
          const emoji = returns >= 15 ? "🚀" : returns >= 10 ? "📈" : "📊";
          console.log(
            `   ${index + 1}. ${fund.name.substring(0, 40).padEnd(40)} NAV: ₹${fund.nav.toFixed(2)} ${emoji} ${returns.toFixed(2)}%`,
          );
        });
      }
    } catch (error) {
      console.error("❌ Error updating mutual funds data:", error.message);
    }
  }

  /**
   * Fetch mutual funds data from API
   * @returns {Promise<Array>} - Array of mutual fund data
   */
  async fetchMutualFundsData() {
    // TODO: Replace with actual API integration
    // AMFI (Association of Mutual Funds in India) provides NAV data
    // API: https://www.amfiindia.com/spages/NAVAll.txt

    // Placeholder data structure
    return [
      {
        name: "HDFC Mid-Cap Opportunities Fund - Growth",
        nav: 245.67,
        returns_1y: 18.45,
        returns_3y: 22.15,
        returns_5y: 19.87,
        aum: 25000, // AUM in crores
      },
      {
        name: "SBI Small Cap Fund - Regular Plan - Growth",
        nav: 156.32,
        returns_1y: 21.67,
        returns_3y: 24.89,
        returns_5y: 20.45,
        aum: 15000,
      },
      {
        name: "ICICI Prudential Bluechip Fund - Growth",
        nav: 98.45,
        returns_1y: 14.23,
        returns_3y: 16.78,
        returns_5y: 15.34,
        aum: 35000,
      },
      {
        name: "Axis Long Term Equity Fund - Growth",
        nav: 87.23,
        returns_1y: 16.89,
        returns_3y: 18.45,
        returns_5y: 17.23,
        aum: 28000,
      },
      {
        name: "Mirae Asset Large Cap Fund - Growth",
        nav: 112.56,
        returns_1y: 13.45,
        returns_3y: 15.67,
        returns_5y: 14.89,
        aum: 22000,
      },
    ];
  }

  /**
   * Force update mutual funds data
   */
  async forceUpdate() {
    console.log("\n🔄 Force updating mutual funds data...");
    await this.updateMutualFundsData();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    const istTime = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    return {
      isRunning: this.isRunning,
      updateCount: this.updateCount,
      lastUpdateDate: this.lastUpdateDate,
      nextUpdateTime: "6:00 PM IST (daily)",
      currentISTTime: istTime,
      updateFrequency: "Once Daily",
    };
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log("⚠️  Mutual Funds Scheduler is not running");
      return;
    }

    console.log("\n🛑 Stopping Mutual Funds Scheduler...");

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;
    console.log("✅ Mutual Funds Scheduler stopped");
  }
}

// Create singleton instance
const mutualFundsScheduler = new MutualFundsScheduler();

export default mutualFundsScheduler;
