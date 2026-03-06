/**
 * Indian Mutual Funds Service
 * Uses AMFI (Association of Mutual Funds in India) FREE API
 * Data source: https://www.amfiindia.com/
 * NAV updates daily after market close
 */

import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 3660 }); // 1 hour cache (NAV updates daily)

class MutualFundService {
  constructor() {
    this.amfiURL = "https://www.amfiindia.com/spages/NAVAll.txt";
    this.mfAPIURL = "https://api.mfapi.in"; // mf-api.in - free MF API for India

    // AMC (Asset Management Company) categories
    this.categories = [
      "Equity",
      "Debt",
      "Hybrid",
      "Solution Oriented",
      "Other",
      "Index Funds",
      "ETF",
    ];

    // Popular mutual funds (scheme codes from AMFI)
    this.popularFunds = [
      { code: "120503", name: "SBI Bluechip Fund - Direct Plan Growth" },
      {
        code: "119551",
        name: "HDFC Mid-Cap Opportunities Fund - Direct Plan Growth",
      },
      { code: "118834", name: "Axis Bluechip Fund - Direct Plan Growth" },
      {
        code: "120716",
        name: "Mirae Asset Large Cap Fund - Direct Plan Growth",
      },
      { code: "120586", name: "SBI Small Cap Fund - Direct Plan Growth" },
      {
        code: "122639",
        name: "Parag Parikh Flexi Cap Fund - Direct Plan Growth",
      },
      {
        code: "119364",
        name: "ICICI Prudential Bluechip Fund - Direct Plan Growth",
      },
      {
        code: "118989",
        name: "Kotak Standard Multicap Fund - Direct Plan Growth",
      },
      { code: "119578", name: "HDFC Flexi Cap Fund - Direct Plan Growth" },
      {
        code: "118516",
        name: "Aditya Birla Sun Life Frontline Equity Fund - Direct Plan Growth",
      },
      {
        code: "119597",
        name: "HDFC Index Fund - NIFTY 50 Plan - Direct Plan Growth",
      },
      { code: "145552", name: "UTI Nifty 50 Index Fund - Direct Plan Growth" },
      {
        code: "119237",
        name: "ICICI Prudential Liquid Fund - Direct Plan Growth",
      },
      { code: "120837", name: "SBI Equity Hybrid Fund - Direct Plan Growth" },
      {
        code: "125497",
        name: "Nippon India Small Cap Fund - Direct Plan Growth",
      },
    ];
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
   * Get popular mutual funds with current NAV
   */
  async getPopularFunds() {
    const cacheKey = "popular_mf";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log("📈 Fetching popular mutual fund NAVs...");

      const promises = this.popularFunds.map(async (fund) => {
        try {
          return await this.getFundData(fund.code);
        } catch (err) {
          console.error(`⚠️ Failed to fetch ${fund.name}:`, err.message);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const funds = results.filter((r) => r !== null);

      console.log(`✅ Fetched ${funds.length} mutual funds`);
      cache.set(cacheKey, funds);
      return funds;
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
