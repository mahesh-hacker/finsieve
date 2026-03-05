import { query } from "../config/database.js";

/**
 * Live Market Data Service
 * Fetches real-time market data from external APIs and updates the database
 */

class LiveMarketDataService {
  constructor() {
    // Market hours for different regions (in UTC)
    this.marketHours = {
      India: {
        // IST: 9:15 AM - 3:30 PM = UTC: 3:45 AM - 10:00 AM
        open: { hour: 3, minute: 45 },
        close: { hour: 10, minute: 0 },
        timezone: "Asia/Kolkata",
      },
      "United States": {
        // EST: 9:30 AM - 4:00 PM = UTC: 2:30 PM - 9:00 PM (winter)
        // EDT: 9:30 AM - 4:00 PM = UTC: 1:30 PM - 8:00 PM (summer)
        open: { hour: 14, minute: 30 },
        close: { hour: 21, minute: 0 },
        timezone: "America/New_York",
      },
      "United Kingdom": {
        // GMT: 8:00 AM - 4:30 PM = UTC: 8:00 AM - 4:30 PM
        open: { hour: 8, minute: 0 },
        close: { hour: 16, minute: 30 },
        timezone: "Europe/London",
      },
      Japan: {
        // JST: 9:00 AM - 3:00 PM = UTC: 12:00 AM - 6:00 AM
        open: { hour: 0, minute: 0 },
        close: { hour: 6, minute: 0 },
        timezone: "Asia/Tokyo",
      },
      "Hong Kong": {
        // HKT: 9:30 AM - 4:00 PM = UTC: 1:30 AM - 8:00 AM
        open: { hour: 1, minute: 30 },
        close: { hour: 8, minute: 0 },
        timezone: "Asia/Hong_Kong",
      },
    };
  }

  /**
   * Check if a specific market is currently open
   * @param {string} country - Country name
   * @returns {boolean} - True if market is open
   */
  isMarketOpen(country) {
    const marketHour = this.marketHours[country];
    if (!marketHour) return false;

    const now = new Date();
    const currentUTCHour = now.getUTCHours();
    const currentUTCMinute = now.getUTCMinutes();
    const currentDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday

    // Skip weekends
    if (currentDay === 0 || currentDay === 6) return false;

    const currentMinutes = currentUTCHour * 60 + currentUTCMinute;
    const openMinutes = marketHour.open.hour * 60 + marketHour.open.minute;
    const closeMinutes = marketHour.close.hour * 60 + marketHour.close.minute;

    // Handle markets that cross midnight
    if (closeMinutes < openMinutes) {
      return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  /**
   * Get list of currently open markets
   * @returns {string[]} - Array of country names with open markets
   */
  getOpenMarkets() {
    return Object.keys(this.marketHours).filter((country) =>
      this.isMarketOpen(country),
    );
  }

  /**
   * Fetch live data from Yahoo Finance API (Free alternative)
   * Note: This is a simplified example. In production, use a proper market data provider
   * like Alpha Vantage, Twelve Data, or a paid service for reliable data
   */
  async fetchLiveDataFromAPI(symbol) {
    try {
      // For demo purposes, generate realistic random fluctuations
      // In production, replace this with actual API calls
      const randomChange = (Math.random() - 0.5) * 2; // -1% to +1%

      return {
        symbol,
        changePercent: randomChange,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`Error fetching live data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Update database with live market data
   * This method simulates price updates based on market conditions
   */
  async updateLiveData() {
    try {
      const openMarkets = this.getOpenMarkets();

      if (openMarkets.length === 0) {
        console.log("ℹ️  No markets currently open. Skipping update.");
        return { updated: 0, markets: [] };
      }

      console.log(
        `🔄 Updating live data for markets: ${openMarkets.join(", ")}`,
      );

      // Get all indices from open markets
      const result = await query(
        `SELECT * FROM global_indices WHERE country = ANY($1)`,
        [openMarkets],
      );

      const updatedCount = result.rows.length;

      for (const index of result.rows) {
        // Simulate realistic price movement (in production, fetch from API)
        const previousClose = parseFloat(index.previous_close);

        // Random price change between -1% and +1%
        const changePercent = (Math.random() - 0.5) * 2;

        // Calculate new value based on previous close
        // This ensures: newValue = previousClose × (1 + changePercent/100)
        const newValue = previousClose * (1 + changePercent / 100);
        const change = newValue - previousClose;

        // Verify: change/previousClose × 100 should equal changePercent

        // Update the database
        await query(
          `UPDATE global_indices 
           SET current_value = $1,
               change = $2,
               change_percent = $3,
               last_updated = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [
            newValue.toFixed(2),
            change.toFixed(2),
            changePercent.toFixed(2),
            index.id,
          ],
        );
      }

      console.log(
        `✅ Updated ${updatedCount} indices from ${openMarkets.length} market(s)`,
      );

      return {
        updated: updatedCount,
        markets: openMarkets,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("❌ Error updating live data:", error);
      throw error;
    }
  }

  /**
   * Update specific index with live data
   * @param {string} symbol - Index symbol to update
   */
  async updateIndexData(symbol) {
    try {
      // Get current index data
      const result = await query(
        `SELECT * FROM global_indices WHERE symbol = $1`,
        [symbol],
      );

      if (result.rows.length === 0) {
        throw new Error(`Index ${symbol} not found`);
      }

      const index = result.rows[0];

      // Check if market is open
      if (!this.isMarketOpen(index.country)) {
        console.log(
          `ℹ️  Market closed for ${index.country}. Using last known values.`,
        );
        return index;
      }

      // Fetch live data (in production, use real API)
      const liveData = await this.fetchLiveDataFromAPI(symbol);

      if (!liveData) {
        return index; // Return existing data if fetch fails
      }

      const previousClose = parseFloat(index.previous_close);
      const newValue = previousClose * (1 + liveData.changePercent / 100);
      const change = newValue - previousClose;

      // Update database
      await query(
        `UPDATE global_indices 
         SET current_value = $1,
             change = $2,
             change_percent = $3,
             last_updated = CURRENT_TIMESTAMP
         WHERE symbol = $4`,
        [
          newValue.toFixed(2),
          change.toFixed(2),
          liveData.changePercent.toFixed(2),
          symbol,
        ],
      );

      console.log(`✅ Updated ${symbol} with live data`);

      // Return updated data
      const updatedResult = await query(
        `SELECT * FROM global_indices WHERE symbol = $1`,
        [symbol],
      );

      return updatedResult.rows[0];
    } catch (error) {
      console.error(`❌ Error updating ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get market status for all countries
   */
  getMarketStatus() {
    const status = {};

    for (const country of Object.keys(this.marketHours)) {
      status[country] = {
        isOpen: this.isMarketOpen(country),
        timezone: this.marketHours[country].timezone,
        hours: this.marketHours[country],
      };
    }

    return status;
  }
}

export default new LiveMarketDataService();
