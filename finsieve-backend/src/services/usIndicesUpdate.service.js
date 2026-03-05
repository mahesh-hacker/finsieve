import yahooFinanceService from "./yahooFinance.service.js";
import { query } from "../config/database.js";

/**
 * US Indices Update Service
 * Fetches real-time US indices data from Yahoo Finance and updates the database
 */

class USIndicesUpdateService {
  constructor() {
    this.isUpdating = false;
  }

  /**
   * Update US indices in database with real Yahoo Finance data
   */
  async updateUSIndices() {
    if (this.isUpdating) {
      console.log("⚠️ US indices update already in progress, skipping...");
      return { success: false, message: "Update already in progress" };
    }

    try {
      this.isUpdating = true;
      console.log("🇺🇸 Updating US indices from Yahoo Finance...");

      // Fetch real-time data from Yahoo Finance
      const indices = await yahooFinanceService.getUSIndices();

      let updated = 0;
      const errors = [];

      for (const index of indices) {
        try {
          // Update or insert in database
          const updateQuery = `
            INSERT INTO global_indices (
              symbol, name, country, current_value, change, change_percent,
              previous_close, open, high, low, last_updated
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
            ON CONFLICT (symbol) DO UPDATE SET
              current_value = EXCLUDED.current_value,
              change = EXCLUDED.change,
              change_percent = EXCLUDED.change_percent,
              previous_close = EXCLUDED.previous_close,
              open = EXCLUDED.open,
              high = EXCLUDED.high,
              low = EXCLUDED.low,
              last_updated = EXCLUDED.last_updated
            RETURNING symbol, current_value, change_percent;
          `;

          const values = [
            index.symbol,
            index.name,
            index.country,
            index.current_value,
            index.change,
            index.change_percent,
            index.previous_close,
            index.open,
            index.high,
            index.low,
          ];

          const result = await query(updateQuery, values);

          if (result.rows.length > 0) {
            updated++;
          }
        } catch (error) {
          console.error(`❌ Error updating ${index.symbol}:`, error.message);
          errors.push({ symbol: index.symbol, error: error.message });
        }
      }

      console.log(`✅ Updated ${updated} US indices successfully`);

      return {
        success: true,
        updated,
        total: indices.length,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Error in updateUSIndices:", error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Update global indices (non-India, non-US) from Yahoo Finance
   */
  async updateGlobalIndices() {
    try {
      console.log("🌍 Updating global indices from Yahoo Finance...");

      // Fetch real-time data from Yahoo Finance
      const indices = await yahooFinanceService.getGlobalIndices();

      let updated = 0;

      for (const index of indices) {
        try {
          const updateQuery = `
            INSERT INTO global_indices (
              symbol, name, country, current_value, change, change_percent,
              previous_close, open, high, low, last_updated
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
            ON CONFLICT (symbol) DO UPDATE SET
              current_value = EXCLUDED.current_value,
              change = EXCLUDED.change,
              change_percent = EXCLUDED.change_percent,
              previous_close = EXCLUDED.previous_close,
              open = EXCLUDED.open,
              high = EXCLUDED.high,
              low = EXCLUDED.low,
              last_updated = EXCLUDED.last_updated;
          `;

          const values = [
            index.symbol,
            index.name,
            index.country,
            index.current_value,
            index.change,
            index.change_percent,
            index.previous_close,
            index.open,
            index.high,
            index.low,
          ];

          await query(updateQuery, values);
          updated++;
        } catch (error) {
          console.error(`❌ Error updating ${index.symbol}:`, error.message);
        }
      }

      console.log(`✅ Updated ${updated} global indices successfully`);

      return {
        success: true,
        updated,
        total: indices.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Error in updateGlobalIndices:", error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Update all markets (US + Global, excluding India which has its own service)
   */
  async updateAllMarkets() {
    try {
      console.log("🌐 Updating all market indices...");

      const [usResult, globalResult] = await Promise.all([
        this.updateUSIndices(),
        this.updateGlobalIndices(),
      ]);

      const totalUpdated =
        (usResult.updated || 0) + (globalResult.updated || 0);

      console.log(`✅ Updated ${totalUpdated} total indices`);

      return {
        success: true,
        us: usResult,
        global: globalResult,
        totalUpdated,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Error in updateAllMarkets:", error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check if US market is currently open
   */
  isUSMarketOpen() {
    return yahooFinanceService.isUSMarketOpen();
  }
}

export default new USIndicesUpdateService();
