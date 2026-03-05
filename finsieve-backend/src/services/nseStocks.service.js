/**
 * NSE Stocks Service
 * Fetches real-time stock data from NSE India API
 * Provides: All NSE stocks, Top Gainers, Top Losers, High Volume, 52W High/Low
 */

import axios from "axios";

class NSEStocksService {
  constructor() {
    this.baseURL = "https://www.nseindia.com/api";
    this.headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Referer: "https://www.nseindia.com/",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    };
    this.sessionCookies = null;
    this.lastSessionTime = null;
  }

  /**
   * Initialize NSE session (required for some APIs)
   */
  async initSession() {
    try {
      const now = Date.now();
      // Reuse session if less than 5 minutes old
      if (
        this.sessionCookies &&
        this.lastSessionTime &&
        now - this.lastSessionTime < 300000
      ) {
        return this.sessionCookies;
      }

      const response = await axios.get("https://www.nseindia.com", {
        headers: this.headers,
        timeout: 10000,
      });

      if (response.headers["set-cookie"]) {
        this.sessionCookies = response.headers["set-cookie"];
        this.lastSessionTime = now;
      }

      return this.sessionCookies;
    } catch (error) {
      console.error("❌ Error initializing NSE session:", error.message);
      return null;
    }
  }

  /**
   * Fetch all equity stocks from NSE
   */
  async getAllNSEStocks() {
    try {
      await this.initSession();

      const response = await axios.get(
        `${this.baseURL}/equity-stockIndices?index=SECURITIES%20IN%20F%26O`,
        {
          headers: {
            ...this.headers,
            Cookie: this.sessionCookies ? this.sessionCookies.join("; ") : "",
          },
          timeout: 15000,
        },
      );

      if (!response.data || !response.data.data) {
        throw new Error("Invalid response from NSE API");
      }

      return this.formatStockData(response.data.data);
    } catch (error) {
      console.error("❌ Error fetching NSE stocks:", error.message);
      throw error;
    }
  }

  /**
   * Fetch top gainers and losers for an index
   */
  async getGainersLosers(indexName = "NIFTY 50") {
    try {
      await this.initSession();

      // Format index name for URL
      const formattedIndex = encodeURIComponent(indexName);

      const response = await axios.get(
        `${this.baseURL}/live-analysis-variations?index=${formattedIndex}`,
        {
          headers: {
            ...this.headers,
            Cookie: this.sessionCookies ? this.sessionCookies.join("; ") : "",
          },
          timeout: 15000,
        },
      );

      if (!response.data) {
        throw new Error("Invalid response from NSE API");
      }

      const data = response.data;
      const gainersRaw = data.NIFTY?.data || data.advances || [];
      const losersRaw = data.NIFTY?.declines || data.declines || [];

      return {
        gainers: this.formatStockData(Array.isArray(gainersRaw) ? gainersRaw : []),
        losers: this.formatStockData(Array.isArray(losersRaw) ? losersRaw : []),
      };
    } catch (error) {
      console.error(
        `❌ Error fetching gainers/losers for ${indexName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Fetch stocks with highest volume
   */
  async getHighVolumeStocks(indexName = "NIFTY 50") {
    try {
      await this.initSession();

      const formattedIndex = encodeURIComponent(indexName);

      const response = await axios.get(
        `${this.baseURL}/live-analysis-volume-gainers?index=${formattedIndex}`,
        {
          headers: {
            ...this.headers,
            Cookie: this.sessionCookies ? this.sessionCookies.join("; ") : "",
          },
          timeout: 15000,
        },
      );

      if (!response.data || !response.data.data) {
        throw new Error("Invalid response from NSE API");
      }

      return this.formatStockData(response.data.data);
    } catch (error) {
      console.error(
        `❌ Error fetching high volume stocks for ${indexName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Fetch 52-week high stocks
   */
  async get52WeekHighStocks(indexName = "NIFTY 50") {
    try {
      await this.initSession();

      const formattedIndex = encodeURIComponent(indexName);

      const response = await axios.get(
        `${this.baseURL}/live-analysis-oi-spurts?index=${formattedIndex}`,
        {
          headers: {
            ...this.headers,
            Cookie: this.sessionCookies ? this.sessionCookies.join("; ") : "",
          },
          timeout: 15000,
        },
      );

      if (!response.data || !response.data.data) {
        throw new Error("Invalid response from NSE API");
      }

      // Filter stocks near 52-week high (within 5% of 52W high)
      const stocks = this.formatStockData(response.data.data);
      return stocks.filter((stock) => {
        if (stock.yearHigh && stock.lastPrice) {
          const percentFrom52WHigh =
            ((stock.lastPrice - stock.yearHigh) / stock.yearHigh) * 100;
          return percentFrom52WHigh > -5; // Within 5% of 52W high
        }
        return false;
      });
    } catch (error) {
      console.error(
        `❌ Error fetching 52W high stocks for ${indexName}:`,
        error.message,
      );
      // Return empty array instead of throwing to gracefully handle error
      return [];
    }
  }

  /**
   * Fetch 52-week low stocks
   */
  async get52WeekLowStocks(indexName = "NIFTY 50") {
    try {
      await this.initSession();

      const formattedIndex = encodeURIComponent(indexName);

      const response = await axios.get(
        `${this.baseURL}/live-analysis-oi-spurts?index=${formattedIndex}`,
        {
          headers: {
            ...this.headers,
            Cookie: this.sessionCookies ? this.sessionCookies.join("; ") : "",
          },
          timeout: 15000,
        },
      );

      if (!response.data || !response.data.data) {
        throw new Error("Invalid response from NSE API");
      }

      // Filter stocks near 52-week low (within 5% of 52W low)
      const stocks = this.formatStockData(response.data.data);
      return stocks.filter((stock) => {
        if (stock.yearLow && stock.lastPrice) {
          const percentFrom52WLow =
            ((stock.lastPrice - stock.yearLow) / stock.yearLow) * 100;
          return percentFrom52WLow < 5; // Within 5% of 52W low
        }
        return false;
      });
    } catch (error) {
      console.error(
        `❌ Error fetching 52W low stocks for ${indexName}:`,
        error.message,
      );
      // Return empty array instead of throwing to gracefully handle error
      return [];
    }
  }

  /**
   * Format stock data to standard structure
   */
  formatStockData(rawData) {
    if (!Array.isArray(rawData)) return [];

    return rawData.map((stock) => ({
      symbol: stock.symbol || stock.meta?.symbol || "N/A",
      companyName: stock.meta?.companyName || stock.symbol || "N/A",
      lastPrice: parseFloat(stock.lastPrice || stock.ltp || 0),
      change: parseFloat(stock.change || 0),
      pChange: parseFloat(stock.pChange || stock.percentChange || 0),
      volume: parseInt(stock.totalTradedVolume || stock.volume || 0),
      marketCap: parseFloat(stock.meta?.marketCap || 0),
      pe: parseFloat(stock.meta?.pdSymbolPe || stock.pe || 0),
      yearHigh: parseFloat(stock.yearHigh || stock.high52 || 0),
      yearLow: parseFloat(stock.yearLow || stock.low52 || 0),
      open: parseFloat(stock.open || 0),
      dayHigh: parseFloat(stock.dayHigh || stock.high || 0),
      dayLow: parseFloat(stock.dayLow || stock.low || 0),
      previousClose: parseFloat(stock.previousClose || stock.close || 0),
    }));
  }

  /**
   * Get stock quote by symbol
   */
  async getStockQuote(symbol) {
    try {
      await this.initSession();

      const response = await axios.get(
        `${this.baseURL}/quote-equity?symbol=${symbol}`,
        {
          headers: {
            ...this.headers,
            Cookie: this.sessionCookies ? this.sessionCookies.join("; ") : "",
          },
          timeout: 15000,
        },
      );

      if (!response.data) {
        throw new Error("Invalid response from NSE API");
      }

      const data = response.data;
      const priceInfo = data.priceInfo || {};
      const metadata = data.metadata || {};

      return {
        symbol: metadata.symbol || symbol,
        companyName: metadata.companyName || symbol,
        lastPrice: parseFloat(priceInfo.lastPrice || 0),
        change: parseFloat(priceInfo.change || 0),
        pChange: parseFloat(priceInfo.pChange || 0),
        volume: parseInt(data.totalTradedVolume || 0),
        marketCap: parseFloat(metadata.marketCap || 0),
        pe: parseFloat(data.pe || 0),
        yearHigh: parseFloat(priceInfo.intraDayHighLow?.max || 0),
        yearLow: parseFloat(priceInfo.intraDayHighLow?.min || 0),
        open: parseFloat(priceInfo.open || 0),
        dayHigh: parseFloat(priceInfo.intraDayHighLow?.max || 0),
        dayLow: parseFloat(priceInfo.intraDayHighLow?.min || 0),
        previousClose: parseFloat(priceInfo.previousClose || 0),
      };
    } catch (error) {
      console.error(`❌ Error fetching quote for ${symbol}:`, error.message);
      throw error;
    }
  }
}

export default new NSEStocksService();
