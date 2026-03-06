/**
 * Indian Mutual Funds Service
 * Uses AMFI (Association of Mutual Funds in India) FREE API
 * Data source: https://www.amfiindia.com/
 * NAV updates daily after market close
 */

import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 3660 }); // 1 hour cache (NAV updates daily)

// AMCs to include in the popular list (major houses)
const PRIORITY_AMCS = [
  "sbi", "hdfc", "icici", "axis", "mirae", "nippon", "kotak",
  "parag parikh", "dsp", "aditya birla", "uti", "franklin",
  "motilal", "tata", "bandhan", "invesco", "pgim", "quant",
  "canara", "edelweiss", "navi", "groww", "360 one", "whiteoak",
];

// Extract fund house name from scheme name
function extractFundHouse(name) {
  const known = [
    "SBI Mutual Fund", "HDFC Mutual Fund", "ICICI Prudential Mutual Fund",
    "Axis Mutual Fund", "Mirae Asset Mutual Fund", "Nippon India Mutual Fund",
    "Kotak Mutual Fund", "Parag Parikh Mutual Fund", "DSP Mutual Fund",
    "Aditya Birla Sun Life Mutual Fund", "UTI Mutual Fund",
    "Franklin Templeton Mutual Fund", "Motilal Oswal Mutual Fund",
    "Tata Mutual Fund", "Bandhan Mutual Fund", "Invesco Mutual Fund",
    "PGIM India Mutual Fund", "Quant Mutual Fund", "Canara Robeco Mutual Fund",
    "Edelweiss Mutual Fund", "Navi Mutual Fund", "WhiteOak Capital Mutual Fund",
    "360 ONE Mutual Fund",
  ];
  const nl = name.toLowerCase();
  for (const h of known) {
    if (nl.startsWith(h.toLowerCase().split(" mutual")[0])) return h;
  }
  return name.split(" - ")[0].split(" Fund")[0] + " Mutual Fund";
}

// Map AMFI category string to clean label
function cleanCategory(cat) {
  if (!cat) return "Other";
  const c = cat.replace(/Open Ended Schemes\(|\)/g, "").replace(/Close Ended Schemes\(|\)/g, "").trim();
  // Shorten common categories
  if (c.includes("Large Cap")) return "Large Cap";
  if (c.includes("Mid Cap")) return "Mid Cap";
  if (c.includes("Small Cap")) return "Small Cap";
  if (c.includes("Flexi Cap") || c.includes("Multi Cap")) return "Flexi/Multi Cap";
  if (c.includes("ELSS") || c.includes("Tax")) return "ELSS";
  if (c.includes("Index") || c.includes("ETF")) return "Index/ETF";
  if (c.includes("Hybrid") || c.includes("Balanced") || c.includes("Aggressive")) return "Hybrid";
  if (c.includes("Debt") || c.includes("Liquid") || c.includes("Gilt") || c.includes("Credit")) return "Debt";
  if (c.includes("Equity")) return "Equity";
  if (c.includes("Sector") || c.includes("Thematic") || c.includes("Focused")) return "Sectoral/Thematic";
  return c.substring(0, 30);
}

class MutualFundService {
  constructor() {
    this.amfiURL = "https://www.amfiindia.com/spages/NAVAll.txt";
    this.mfAPIURL = "https://api.mfapi.in";
  }

  /**
   * Fetch and parse AMFI NAVAll.txt — contains ALL Indian MF NAVs
   * Returns up to 80 popular Direct Plan Growth funds from major AMCs
   */
  async _getAMFIFundList() {
    const cacheKey = "amfi_parsed_list";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const response = await axios.get(this.amfiURL, { timeout: 30000 });
    const lines = response.data.split("\n");

    let category = "";
    const funds = [];

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      // Category header lines have no semicolons and start with "Open Ended"
      if (!line.includes(";")) {
        if (line.length > 5) category = line;
        continue;
      }

      const parts = line.split(";");
      if (parts.length < 5) continue;

      const code = parts[0].trim();
      const schemeName = parts[3]?.trim();
      const navStr = parts[4]?.trim();
      const navDate = parts[5]?.trim();

      // Scheme code must be numeric
      if (!/^\d+$/.test(code)) continue;

      const nav = parseFloat(navStr);
      if (!schemeName || isNaN(nav) || nav <= 0) continue;

      const nl = schemeName.toLowerCase();

      // Only Direct Plan Growth
      if (!nl.includes("direct")) continue;
      if (!nl.includes("growth") && !nl.includes(" gr ") && !nl.includes("-gr")) continue;
      if (nl.includes("idcw") || nl.includes("dividend") || nl.includes("bonus") ||
          nl.includes("weekly") || nl.includes("monthly") || nl.includes("quarterly") ||
          nl.includes("reinvestment")) continue;

      // Skip overnight, liquid, money market, credit risk (very low interest)
      const catL = category.toLowerCase();
      if (catL.includes("liquid") || catL.includes("overnight") ||
          catL.includes("money market") || catL.includes("ultra short")) continue;

      // Skip closed-ended
      if (catL.includes("close ended") || catL.includes("interval")) continue;

      // Only major AMCs
      const isPriority = PRIORITY_AMCS.some((amc) => nl.includes(amc));
      if (!isPriority) continue;

      funds.push({
        scheme_code: code,
        scheme_name: schemeName,
        fund_house: extractFundHouse(schemeName),
        scheme_category: cleanCategory(category),
        scheme_type: "Open Ended",
        nav,
        nav_date: navDate || null,
        change: 0,
        change_percent: 0,
        previous_nav: nav,
        last_updated: new Date().toISOString(),
      });
    }

    // Limit to 80 — balanced mix across all categories
    const result = funds.slice(0, 80);
    console.log(`✅ AMFI parsed: ${result.length} Direct Plan Growth funds`);
    cache.set(cacheKey, result, 3600);
    return result;
  }

  /**
   * Get NAV data for a specific mutual fund using mf-api
   */
  async getFundData(schemeCode) {
    const cacheKey = `mf_${schemeCode}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.mfAPIURL}/mf/${schemeCode}`, {
        timeout: 10000,
      });

      const data = response.data;
      const latestNav = data.data?.[0];
      const previousNav = data.data?.[1];

      const currentNav = parseFloat(latestNav?.nav || 0);
      const prevNav = parseFloat(previousNav?.nav || currentNav);
      const change = currentNav - prevNav;
      const changePercent = prevNav > 0 ? (change / prevNav) * 100 : 0;

      const fund = {
        scheme_code: data.meta?.scheme_code || schemeCode,
        scheme_name: data.meta?.scheme_name || "Unknown Fund",
        fund_house: data.meta?.fund_house || "Unknown",
        scheme_type: data.meta?.scheme_type || "Unknown",
        scheme_category: data.meta?.scheme_category || "Unknown",
        nav: currentNav,
        previous_nav: prevNav,
        change: parseFloat(change.toFixed(4)),
        change_percent: parseFloat(changePercent.toFixed(2)),
        nav_date: latestNav?.date || null,
        previous_date: previousNav?.date || null,
        last_updated: new Date().toISOString(),
      };

      cache.set(cacheKey, fund);
      return fund;
    } catch (error) {
      console.error(
        `❌ Error fetching MF data for ${schemeCode}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Get NAV history for a fund
   */
  async getFundHistory(schemeCode) {
    const cacheKey = `mf_history_${schemeCode}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.mfAPIURL}/mf/${schemeCode}`, {
        timeout: 10000,
      });

      const data = response.data;

      const history = {
        meta: {
          scheme_code: data.meta?.scheme_code,
          scheme_name: data.meta?.scheme_name,
          fund_house: data.meta?.fund_house,
          scheme_type: data.meta?.scheme_type,
          scheme_category: data.meta?.scheme_category,
        },
        // Keep 5 years + buffer so 3Y/5Y CAGR can be computed
        data: (data.data || []).slice(0, 1900).map((entry) => ({
          date: entry.date,
          nav: parseFloat(entry.nav),
        })),
      };

      cache.set(cacheKey, history, 3600); // 1 hour cache
      return history;
    } catch (error) {
      console.error(
        `❌ Error fetching MF history for ${schemeCode}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Get all popular mutual funds with current NAV + 1D change
   * Data source: AMFI NAVAll.txt (80 Direct Growth funds from major AMCs)
   * 1D change enriched via mfapi.in concurrently
   */
  async getPopularFunds() {
    const cacheKey = "popular_mf";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log("📈 Fetching mutual funds from AMFI...");
      const amfiFunds = await this._getAMFIFundList();

      // Enrich with 1D change from mfapi.in (concurrent, best-effort)
      const enriched = await Promise.all(
        amfiFunds.map(async (fund) => {
          try {
            const res = await axios.get(`${this.mfAPIURL}/mf/${fund.scheme_code}`, { timeout: 8000 });
            const data = res.data;
            const meta = data.meta || {};
            const d0 = data.data?.[0];
            const d1 = data.data?.[1];
            const nav = parseFloat(d0?.nav || fund.nav);
            const prevNav = parseFloat(d1?.nav || nav);
            const change = nav - prevNav;
            const changePercent = prevNav > 0 ? (change / prevNav) * 100 : 0;
            return {
              ...fund,
              scheme_name: meta.scheme_name || fund.scheme_name,
              fund_house: meta.fund_house || fund.fund_house,
              scheme_type: meta.scheme_type || fund.scheme_type,
              scheme_category: meta.scheme_category || fund.scheme_category,
              nav,
              previous_nav: prevNav,
              change: parseFloat(change.toFixed(4)),
              change_percent: parseFloat(changePercent.toFixed(2)),
              nav_date: d0?.date || fund.nav_date,
            };
          } catch {
            return fund; // Keep AMFI data with change = 0
          }
        })
      );

      console.log(`✅ Loaded ${enriched.length} mutual funds`);
      cache.set(cacheKey, enriched);
      return enriched;
    } catch (error) {
      console.error("❌ Error fetching popular funds:", error.message);
      throw error;
    }
  }

  /**
   * Search mutual funds
   */
  async searchFunds(queryStr) {
    const cacheKey = `mf_search_${queryStr.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.mfAPIURL}/mf/search`, {
        params: { q: queryStr },
        timeout: 10000,
      });

      const results = (response.data || []).slice(0, 30).map((fund) => ({
        scheme_code: fund.schemeCode,
        scheme_name: fund.schemeName,
      }));

      cache.set(cacheKey, results, 300);
      return results;
    } catch (error) {
      console.error("❌ MF search error:", error.message);
      return [];
    }
  }

  /**
   * Calculate returns for a fund
   */
  async calculateReturns(schemeCode) {
    try {
      const history = await this.getFundHistory(schemeCode);
      const data = history.data;

      if (!data || data.length === 0) {
        return { error: "No data available" };
      }

      const currentNav = data[0].nav;
      // mfapi.in returns one record per calendar day (newest first)
      const periods = {
        "1M": 30,
        "3M": 90,
        "6M": 180,
        "1Y": 365,
        "3Y": 365 * 3,
        "5Y": 365 * 5,
      };

      const returns = {};

      for (const [period, days] of Object.entries(periods)) {
        if (data.length > days) {
          const pastNav = data[Math.min(days, data.length - 1)].nav;
          const absoluteReturn = ((currentNav - pastNav) / pastNav) * 100;

          // CAGR for periods > 1 year
          if (days > 252) {
            const years = days / 365;
            const cagr = (Math.pow(currentNav / pastNav, 1 / years) - 1) * 100;
            returns[period] = {
              absolute: parseFloat(absoluteReturn.toFixed(2)),
              cagr: parseFloat(cagr.toFixed(2)),
            };
          } else {
            returns[period] = {
              absolute: parseFloat(absoluteReturn.toFixed(2)),
            };
          }
        }
      }

      return {
        scheme_code: schemeCode,
        scheme_name: history.meta.scheme_name,
        current_nav: currentNav,
        returns,
      };
    } catch (error) {
      console.error(
        `❌ Error calculating returns for ${schemeCode}:`,
        error.message,
      );
      throw error;
    }
  }
}

export default new MutualFundService();
