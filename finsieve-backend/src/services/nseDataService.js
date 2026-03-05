/**
 * NSE Data Service
 * Fetches real-time market data from NSE India API
 */

const axios = require("axios");
const db = require("../config/database");

class NSEDataService {
  constructor() {
    this.baseURL = "https://www.nseindia.com/api";
    this.headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Referer: "https://www.nseindia.com/",
      Connection: "keep-alive",
    };

    // NSE to our database symbol mapping
    this.symbolMapping = {
      "NIFTY 50": "NIFTY",
      "NIFTY BANK": "NIFTYBANK",
      "NIFTY IT": "NIFTYIT",
      "NIFTY FMCG": "NIFTYFMCG",
      "NIFTY AUTO": "NIFTYAUTO",
      "NIFTY PHARMA": "NIFTYPHARMA",
      "NIFTY METAL": "NIFTYMETAL",
      "NIFTY REALTY": "NIFTYREALTY",
      "NIFTY ENERGY": "NIFTYENERGY",
      "NIFTY INFRA": "NIFTYINFRA",
    };
  }

  /**
   * Fetch all indices from NSE
   */
  async fetchAllIndices() {
    try {
      console.log("🔄 Fetching data from NSE...");

      const response = await axios.get(`${this.baseURL}/allIndices`, {
        headers: this.headers,
        timeout: 10000,
      });

      if (!response.data || !response.data.data) {
        throw new Error("Invalid response from NSE API");
      }

      console.log(`✅ Fetched ${response.data.data.length} indices from NSE`);
      return response.data.data;
    } catch (error) {
      console.error("❌ Error fetching NSE data:", error.message);

      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }

      throw error;
    }
  }

  /**
   * Map NSE data to our database format
   */
  mapNSEData(nseIndex) {
    const symbol =
      this.symbolMapping[nseIndex.index] || nseIndex.index.replace(/\s+/g, "");

    return {
      symbol: symbol,
      name: nseIndex.index,
      current_value: parseFloat(nseIndex.last),
      change: parseFloat(nseIndex.variation),
      change_percent: parseFloat(nseIndex.percentChange),
      previous_close: parseFloat(nseIndex.previousClose),
      open: parseFloat(nseIndex.open),
      high: parseFloat(nseIndex.high),
      low: parseFloat(nseIndex.low),
    };
  }

  /**
   * Update specific indices in database with NSE data
   */
  async updateIndicesFromNSE(indexNames = ["NIFTY 50", "NIFTY BANK"]) {
    try {
      const allIndices = await this.fetchAllIndices();

      // Filter only the indices we want to update
      const targetIndices = allIndices.filter((idx) =>
        indexNames.includes(idx.index),
      );

      if (targetIndices.length === 0) {
        console.log("⚠️  No matching indices found");
        return { success: false, updated: 0 };
      }

      let updated = 0;

      for (const nseIndex of targetIndices) {
        const data = this.mapNSEData(nseIndex);

        const query = `
          UPDATE global_indices 
          SET 
            current_value = $1,
            change = $2,
            change_percent = $3,
            previous_close = $4,
            open = $5,
            high = $6,
            low = $7,
            last_updated = CURRENT_TIMESTAMP
          WHERE symbol = $8
        `;

        const values = [
          data.current_value,
          data.change,
          data.change_percent,
          data.previous_close,
          data.open,
          data.high,
          data.low,
          data.symbol,
        ];

        const result = await db.query(query, values);

        if (result.rowCount > 0) {
          console.log(
            `✅ Updated ${data.symbol}: ${data.current_value} (${data.change > 0 ? "+" : ""}${data.change_percent}%)`,
          );
          updated++;
        } else {
          console.log(`⚠️  Symbol ${data.symbol} not found in database`);
        }
      }

      return {
        success: true,
        updated,
        message: `Updated ${updated} indices from NSE`,
      };
    } catch (error) {
      console.error("❌ Error updating indices from NSE:", error.message);
      return {
        success: false,
        updated: 0,
        error: error.message,
      };
    }
  }

  /**
   * Get specific index data from NSE
   */
  async getIndexData(indexName) {
    try {
      const allIndices = await this.fetchAllIndices();
      const index = allIndices.find((idx) => idx.index === indexName);

      if (!index) {
        throw new Error(`Index ${indexName} not found`);
      }

      return this.mapNSEData(index);
    } catch (error) {
      console.error(`❌ Error fetching ${indexName}:`, error.message);
      throw error;
    }
  }

  /**
   * Update all NSE indices in database
   */
  async updateAllNSEIndices() {
    const nseIndices = [
      "NIFTY 50",
      "NIFTY BANK",
      "NIFTY IT",
      "NIFTY FMCG",
      "NIFTY AUTO",
      "NIFTY PHARMA",
      "NIFTY METAL",
      "NIFTY REALTY",
      "NIFTY ENERGY",
      "NIFTY INFRA",
    ];

    return await this.updateIndicesFromNSE(nseIndices);
  }
}

module.exports = new NSEDataService();
