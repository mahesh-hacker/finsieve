/**
 * NSE ETF Service
 * Fetches Indian ETF list and live data from NSE India (ETF segment).
 * Used by screening engine for ETF asset class.
 */

import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 }); // 5 min

const NSE_ETF_INDEX = "NIFTY 50"; // NSE API uses index names; ETF segment has its own indices
const BASE_URL = "https://www.nseindia.com/api";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://www.nseindia.com/",
};

class NSEETFService {
  constructor() {
    this.sessionCookies = null;
    this.lastSessionTime = null;
  }

  async initSession() {
    try {
      const now = Date.now();
      if (
        this.sessionCookies &&
        this.lastSessionTime &&
        now - this.lastSessionTime < 300000
      ) {
        return this.sessionCookies;
      }
      const res = await axios.get("https://www.nseindia.com", {
        headers: HEADERS,
        timeout: 10000,
      });
      if (res.headers["set-cookie"]) {
        this.sessionCookies = res.headers["set-cookie"];
        this.lastSessionTime = now;
      }
      return this.sessionCookies;
    } catch (e) {
      console.error("NSE ETF session init error:", e.message);
      return null;
    }
  }

  /**
   * Fetch all ETFs from NSE (equity ETF segment)
   * NSE API: /api/equity-stockIndices?index=SECURITIES%20IN%20F%26O or ETF-specific
   */
  async getAllETFs() {
    const cacheKey = "nse_etf_list";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      await this.initSession();
      // NSE market data page for ETFs uses various indices; try etf-stock-indices or equity-stockIndices
      const response = await axios.get(
        `${BASE_URL}/etf-stock-indices?index=ETFs`,
        {
          headers: {
            ...HEADERS,
            Cookie: this.sessionCookies ? this.sessionCookies.join("; ") : "",
          },
          timeout: 15000,
        },
      );

      if (!response.data || !Array.isArray(response.data)) {
        return this.getFallbackETFs();
      }

      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      const formatted = this.formatETFData(data);
      cache.set(cacheKey, formatted);
      return formatted;
    } catch (e) {
      console.error("NSE ETF fetch error:", e.message);
      return this.getFallbackETFs();
    }
  }

  /**
   * Fallback: return curated list of Indian ETFs with placeholder metrics when NSE is unavailable
   */
  getFallbackETFs() {
    const known = [
      { symbol: "NIFTYBEES", name: "Nippon India Nifty 50 ETF", category: "Equity", ter: 0.05, aum_cr: 45000 },
      { symbol: "GOLDBEES", name: "Nippon India Gold ETF", category: "Gold", ter: 0.5, aum_cr: 8500 },
      { symbol: "SILVERBEES", name: "Nippon India Silver ETF", category: "Gold", ter: 0.6, aum_cr: 1200 },
      { symbol: "LIQUIDBEES", name: "Nippon India Liquid ETF", category: "Debt", ter: 0.2, aum_cr: 32000 },
      { symbol: "HDFCGOLD", name: "HDFC Gold ETF", category: "Gold", ter: 0.5, aum_cr: 4200 },
      { symbol: "SBIGOLD", name: "SBI Gold ETF", category: "Gold", ter: 0.5, aum_cr: 3800 },
      { symbol: "KOTAKGOLD", name: "Kotak Gold ETF", category: "Gold", ter: 0.55, aum_cr: 2100 },
      { symbol: "ICICINIFTY", name: "ICICI Prudential Nifty 50 ETF", category: "Equity", ter: 0.05, aum_cr: 12000 },
      { symbol: "UTINIFTY", name: "UTI Nifty 50 ETF", category: "Equity", ter: 0.05, aum_cr: 8500 },
      { symbol: "HDFCNIFTY", name: "HDFC Nifty 50 ETF", category: "Equity", ter: 0.05, aum_cr: 6200 },
      { symbol: "BANKBEES", name: "Nippon India Bank ETF", category: "Equity", ter: 0.5, aum_cr: 9500 },
      { symbol: "JUNIORBEES", name: "Nippon India Nifty Jr ETF", category: "Equity", ter: 0.5, aum_cr: 3200 },
      { symbol: "MIDCPNIFTY", name: "Nippon India Midcap 150 ETF", category: "Equity", ter: 0.5, aum_cr: 1800 },
      { symbol: "NETF", name: "Nippon India ETF Hang Seng BeES", category: "International", ter: 0.8, aum_cr: 450 },
      { symbol: "NASDAQ100", name: "Motilal Oswal NASDAQ 100 ETF", category: "International", ter: 0.56, aum_cr: 5200 },
    ];
    const now = Date.now();
    return known.map((e, i) => ({
      symbol: e.symbol,
      name: e.name,
      category: e.category,
      ter: e.ter,
      aum_cr: e.aum_cr,
      aum: e.aum_cr * 1e7,
      current_value: 100 + (i % 5) * 10,
      change_percent: (i % 3 - 1) * 0.5,
      return_1y: 8 + (i % 6),
      return_3y: 10 + (i % 5),
      return_5y: 11 + (i % 4),
      tracking_error: 0.1 + (i % 10) / 100,
      dividend_yield: (i % 4) * 0.3,
      launch_year: 2015,
      asset_class: "ETF",
    }));
  }

  formatETFData(raw) {
    if (!Array.isArray(raw)) return this.getFallbackETFs();
    const now = Date.now();
    return raw.map((r) => {
      const last = parseFloat(r.last) || parseFloat(r.ltp) || 0;
      const open = parseFloat(r.open) || last;
      const change = last - open;
      const changePercent = open ? (change / open) * 100 : 0;
      return {
        symbol: r.symbol || r.tradingSymbol || r.identifier || "",
        name: r.symbol || r.tradingSymbol || r.identifier || "",
        category: r.category || "Equity",
        ter: parseFloat(r.ter) || 0.5,
        aum_cr: parseFloat(r.aum) / 1e7 || 100,
        aum: parseFloat(r.aum) || 1e9,
        current_value: last,
        change_percent: changePercent,
        return_1y: parseFloat(r.return_1y) || 0,
        return_3y: parseFloat(r.return_3y) || 0,
        return_5y: parseFloat(r.return_5y) || 0,
        tracking_error: parseFloat(r.tracking_error) || 0.2,
        dividend_yield: parseFloat(r.dividend_yield) || 0,
        launch_year: r.launch_year ? parseInt(r.launch_year, 10) : new Date().getFullYear(),
        asset_class: "ETF",
      };
    });
  }
}

export default new NSEETFService();
