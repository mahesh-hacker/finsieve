import axios from "axios";
import { query } from "../config/database.js";

/**
 * Real NSE Data Service
 * Fetches live market data from NSE India API
 */

class RealNSEDataService {
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

    this.cookies = "";
    this.lastSessionInit = null;

    // NSE index names to our symbol mapping (symbols aligned with DB seed / getMajorIndices)
    this.symbolMapping = {
      // Broad Market
      "NIFTY 50":              "NIFTY",
      "NIFTY NEXT 50":         "NIFTYNEXT50",
      "NIFTY 100":             "NIFTY100",
      "NIFTY 200":             "NIFTY200",
      "NIFTY 500":             "NIFTY500",
      "NIFTY TOTAL MARKET":    "NIFTYTOTALMARKET",
      // Market Cap
      "NIFTY MIDCAP 50":       "NIFTYMIDCAP50",
      "NIFTY MIDCAP 100":      "NIFTYMIDCAP",
      "NIFTY MIDCAP 150":      "NIFTYMIDCAP150",
      "NIFTY SMALLCAP 50":     "NIFTYSMLCAP50",
      "NIFTY SMALLCAP 100":    "NIFTYSMLCAP100",
      "NIFTY SMALLCAP 250":    "NIFTYSMLCAP250",
      "NIFTY MICROCAP 250":    "NIFTYMICROCAP250",
      "NIFTY LARGEMIDCAP 250": "NIFTYLARGEMID250",
      // Sectoral
      "NIFTY BANK":            "BANKNIFTY",
      "NIFTY PRIVATE BANK":    "NIFTYPVTBANK",
      "NIFTY PSU BANK":        "NIFTYPSUBANK",
      "NIFTY FINANCIAL SERVICES": "NIFTYFINSERV",
      "NIFTY IT":              "NIFTYIT",
      "NIFTY FMCG":            "NIFTYFMCG",
      "NIFTY AUTO":            "NIFTYAUTO",
      "NIFTY PHARMA":          "NIFTYPHARMA",
      "NIFTY HEALTHCARE INDEX":"NIFTYHEALTHCARE",
      "NIFTY METAL":           "NIFTYMETAL",
      "NIFTY REALTY":          "NIFTYREALTY",
      "NIFTY ENERGY":          "NIFTYENERGY",
      "NIFTY OIL AND GAS":     "NIFTYOILGAS",
      "NIFTY INFRA":           "NIFTYINFRA",
      "NIFTY INDIA DEFENCE":   "NIFTYDEFENCE",
      "NIFTY CONSUMER DURABLES":"NIFTYCONSDUR",
      "NIFTY CAPITAL MARKETS": "NIFTYCAPMARKETS",
      "NIFTY COMMODITIES":     "NIFTYCOMMO",
      "NIFTY MEDIA":           "NIFTYMEDIA",
      // Factor / Strategy
      "NIFTY ALPHA 50":        "NIFTYALPHA50",
      "NIFTY QUALITY 30":      "NIFTYQUALITY30",
      "NIFTY LOW VOLATILITY 50":"NIFTYLOVOL50",
      "NIFTY HIGH BETA 50":    "NIFTYHIBETA50",
      "NIFTY100 ESG":          "NIFTYESG",
      // Volatility
      "INDIA VIX":             "INDIAVIX",
    };
  }

  /**
   * Initialize session with NSE (required for cookies)
   */
  async initSession() {
    try {
      // Only init session once every 5 minutes
      if (
        this.lastSessionInit &&
        Date.now() - this.lastSessionInit < 5 * 60 * 1000
      ) {
        return;
      }

      const response = await axios.get("https://www.nseindia.com", {
        headers: this.headers,
        timeout: 25000, // Increased to 25s - NSE India API is slow
      });

      // Extract cookies from response
      if (response.headers["set-cookie"]) {
        this.cookies = response.headers["set-cookie"]
          .map((cookie) => cookie.split(";")[0])
          .join("; ");
      }

      this.lastSessionInit = Date.now();
      console.log("✅ NSE session initialized");
    } catch (error) {
      console.error("⚠️ Failed to init NSE session:", error.message);
    }
  }

  /**
   * Get current session cookies (for WebSocket or other NSE requests). Call initSession() first.
   */
  getCookies() {
    return this.cookies || "";
  }

  /**
   * Fetch all indices from NSE India
   */
  async fetchNSEIndices() {
    try {
      // Initialize session first
      await this.initSession();

      const headers = {
        ...this.headers,
        Cookie: this.cookies,
      };

      const response = await axios.get(`${this.baseURL}/allIndices`, {
        headers,
        timeout: 25000, // Increased to 25s - NSE India API is slow and unreliable
      });

      const data = response.data?.data ?? response.data;
      if (!data || !Array.isArray(data)) {
        throw new Error("Invalid response from NSE API");
      }
      return data;
    } catch (error) {
      console.error("❌ Error fetching NSE data:", error.message);
      throw error;
    }
  }

  /**
   * Parse NSE numeric value (may be string with commas, e.g. "24,500.50")
   */
  parseNseNumber(val) {
    if (val == null || val === "") return NaN;
    if (typeof val === "number" && !isNaN(val)) return val;
    const s = String(val).replace(/,/g, "").trim();
    const n = parseFloat(s);
    return isNaN(n) ? NaN : n;
  }

  /**
   * Find index in NSE response by name (API may use "index" or "indexName" or "name")
   */
  findIndexByName(nseData, nseName) {
    return nseData.find(
      (idx) =>
        (idx.index && String(idx.index).trim() === nseName) ||
        (idx.indexName && String(idx.indexName).trim() === nseName) ||
        (idx.name && String(idx.name).trim() === nseName),
    );
  }

  /**
   * Update NSE indices in database with real-time data
   * NSE API uses: indexName (or index), last, open, high, low, previousClose, percChange (or percentChange), variation
   */
  async updateNSEIndices() {
    try {
      const nseData = await this.fetchNSEIndices();

      let updated = 0;
      const errors = [];

      for (const [nseName, ourSymbol] of Object.entries(this.symbolMapping)) {
        const indexData = this.findIndexByName(nseData, nseName);

        if (!indexData) {
          continue;
        }

        try {
          const parse = (v) => this.parseNseNumber(v);

          const current_value = parse(indexData.last ?? indexData.lastPrice ?? indexData.close);
          const previous_close = parse(indexData.previousClose ?? indexData.prevClose);
          const open_value = parse(indexData.open);
          const high_value = parse(indexData.high);
          const low_value = parse(indexData.low);

          const change_percent = parse(indexData.percChange ?? indexData.percentChange ?? indexData.pChange);
          const change =
            !isNaN(change_percent) && !isNaN(previous_close)
              ? (previous_close * change_percent) / 100
              : parse(indexData.variation ?? indexData.change ?? indexData.netChange);
          const changeFinal = !isNaN(change) ? change : (current_value - previous_close);

          // Validate data before database insert
          if (isNaN(current_value) || current_value <= 0) {
            continue;
          }

          // Update or insert in database with optimized query (no RETURNING to save time)
          const updateQuery = `
            INSERT INTO global_indices (name, symbol, current_value, change, change_percent, previous_close, open, high, low, country, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'India', CURRENT_TIMESTAMP)
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

          const percentToStore = !isNaN(change_percent)
            ? change_percent
            : (!isNaN(previous_close) && previous_close !== 0
                ? ((current_value - previous_close) / previous_close) * 100
                : 0);

          const values = [
            nseName,
            ourSymbol,
            current_value,
            isNaN(changeFinal) ? 0 : changeFinal,
            percentToStore,
            previous_close,
            open_value,
            high_value,
            low_value,
          ];

          await query(updateQuery, values);
          updated++;
        } catch (error) {
          // Only add to errors array, don't log every second
          errors.push({ symbol: ourSymbol, error: error.message });
        }
      }

      return {
        success: true,
        updated,
        total: Object.keys(this.symbolMapping).length,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Error in updateNSEIndices:", error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get specific index data from NSE
   */
  async getIndexData(indexName) {
    try {
      const allIndices = await this.fetchNSEIndices();
      const index = this.findIndexByName(allIndices, indexName);

      if (!index) {
        throw new Error(`Index ${indexName} not found in NSE data`);
      }

      const ourSymbol = this.symbolMapping[indexName];
      const parse = (v) => this.parseNseNumber(v);
      const last = parse(index.last ?? index.lastPrice ?? index.close);
      const prevClose = parse(index.previousClose ?? index.prevClose);
      const pct = parse(index.percChange ?? index.percentChange ?? index.pChange);

      return {
        symbol: ourSymbol,
        name: indexName,
        current_value: last,
        change: last - prevClose,
        change_percent: !isNaN(pct) ? pct : (prevClose ? ((last - prevClose) / prevClose) * 100 : 0),
        open: parse(index.open),
        high: parse(index.high),
        low: parse(index.low),
        previous_close: prevClose,
      };
    } catch (error) {
      console.error(`❌ Error fetching ${indexName}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if NSE market is currently open
   * Trading hours: 9:15 AM to 3:30 PM IST (Monday to Friday)
   */
  /**
   * Remove stale duplicate index rows caused by symbol mismatches
   * (e.g. NIFTY50 vs NIFTY both mapping to "NIFTY 50").
   * Keeps the canonical symbol (the one with most recent last_updated).
   * Safe to call on every startup — no-op if no duplicates exist.
   */
  async deduplicateIndices() {
    try {
      const result = await query(`
        DELETE FROM global_indices
        WHERE id IN (
          SELECT id FROM (
            SELECT id,
                   ROW_NUMBER() OVER (
                     PARTITION BY LOWER(name), country
                     ORDER BY last_updated DESC
                   ) AS rn
            FROM global_indices
          ) ranked
          WHERE rn > 1
        )
      `);
      if (result.rowCount > 0) {
        console.log(`🧹 Removed ${result.rowCount} duplicate index row(s) from global_indices`);
      }
    } catch (err) {
      console.error("⚠️  deduplicateIndices error:", err.message);
    }
  }

  isMarketOpen() {
    const now = new Date();
    const istTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    );

    const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();

    // Check if it's a weekday
    if (day === 0 || day === 6) {
      return false;
    }

    // Check market hours (9:15 AM to 3:30 PM)
    const currentTime = hours * 60 + minutes;
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM

    return currentTime >= marketOpen && currentTime <= marketClose;
  }
}

export default new RealNSEDataService();
