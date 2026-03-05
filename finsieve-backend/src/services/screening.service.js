/**
 * Screening Service
 * Cross-asset screening engine - the KILLER FEATURE that makes Finsieve better
 * than Screener.in, TradingView, and Morningstar combined
 *
 * Aggregates data from ALL free APIs and lets users filter across 7 asset classes
 */

import yahooFinanceService from "./yahooFinance.service.js";
import cryptoService from "./crypto.service.js";
import mutualFundService from "./mutualFund.service.js";
import nseEtfService from "./nseEtf.service.js";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 60, checkperiod: 65 });

class ScreeningService {
  constructor() {
    // Screening parameters per asset class
    this.screeningParams = {
      US_EQUITY: [
        { field: "current_value", label: "Price", type: "number" },
        { field: "change_percent", label: "Change %", type: "number" },
        { field: "market_cap", label: "Market Cap", type: "number" },
        { field: "pe_ratio", label: "P/E Ratio", type: "number" },
        { field: "volume", label: "Volume", type: "number" },
        {
          field: "fifty_two_week_high",
          label: "52W High",
          type: "number",
        },
        { field: "fifty_two_week_low", label: "52W Low", type: "number" },
        {
          field: "sector",
          label: "Sector",
          type: "select",
          options: [
            "Technology",
            "Healthcare",
            "Financials",
            "Consumer Discretionary",
            "Consumer Staples",
            "Energy",
            "Industrials",
            "Materials",
            "Utilities",
            "Real Estate",
            "Communication Services",
          ],
        },
      ],
      CRYPTO: [
        { field: "current_value", label: "Price (USD)", type: "number" },
        { field: "change_percent", label: "24h Change %", type: "number" },
        { field: "change_7d", label: "7d Change %", type: "number" },
        { field: "change_30d", label: "30d Change %", type: "number" },
        { field: "market_cap", label: "Market Cap", type: "number" },
        { field: "total_volume", label: "24h Volume", type: "number" },
        {
          field: "market_cap_rank",
          label: "Rank",
          type: "number",
        },
        {
          field: "ath_change_percent",
          label: "From ATH %",
          type: "number",
        },
      ],
      COMMODITY: [
        { field: "current_value", label: "Price", type: "number" },
        { field: "change_percent", label: "Change %", type: "number" },
        {
          field: "category",
          label: "Category",
          type: "select",
          options: ["Precious Metals", "Energy", "Agriculture", "Industrial"],
        },
      ],
      BOND: [
        { field: "current_value", label: "Yield", type: "number" },
        { field: "change", label: "Change", type: "number" },
        { field: "change_percent", label: "Change %", type: "number" },
        {
          field: "maturity",
          label: "Maturity",
          type: "select",
          options: ["3M", "2Y", "5Y", "10Y", "30Y"],
        },
      ],
      MUTUAL_FUND: [
        { field: "nav", label: "NAV", type: "number" },
        { field: "change_percent", label: "Change %", type: "number" },
        {
          field: "scheme_category",
          label: "Category",
          type: "select",
          options: [
            "Equity",
            "Debt",
            "Hybrid",
            "Index Funds",
            "ETF",
            "Solution Oriented",
          ],
        },
      ],
      INDEX: [
        { field: "current_value", label: "Value", type: "number" },
        { field: "change_percent", label: "Change %", type: "number" },
        {
          field: "country",
          label: "Country",
          type: "select",
          options: [
            "India",
            "United States",
            "United Kingdom",
            "Germany",
            "Japan",
            "Hong Kong",
            "China",
            "Australia",
            "Brazil",
            "Canada",
          ],
        },
      ],
      ETF: [
        { field: "aum", label: "AUM (₹)", type: "number" },
        { field: "aum_cr", label: "AUM (₹ Cr)", type: "number" },
        { field: "ter", label: "TER %", type: "number" },
        { field: "current_value", label: "Price", type: "number" },
        { field: "change_percent", label: "Change %", type: "number" },
        { field: "return_1y", label: "1Y Return %", type: "number" },
        { field: "return_3y", label: "3Y Return %", type: "number" },
        { field: "return_5y", label: "5Y Return %", type: "number" },
        { field: "tracking_error", label: "Tracking Error %", type: "number" },
        { field: "dividend_yield", label: "Dividend Yield %", type: "number" },
        {
          field: "category",
          label: "Category",
          type: "select",
          options: ["Equity", "Gold", "Debt", "International", "Smart Beta"],
        },
        { field: "launch_year", label: "Launch Year", type: "number" },
      ],
      SIF: [
        { field: "min_investment_lakh", label: "Min Investment (₹ Lakh)", type: "number" },
        { field: "strategy_type", label: "Strategy Type", type: "select", options: ["Long-Short", "Sector Rotation", "Multi-Asset", "Quant"] },
        { field: "risk_band", label: "Risk Band", type: "select", options: ["1", "2", "3", "4", "5"] },
        { field: "redemption_days", label: "Redemption Days", type: "number" },
        { field: "alpha_3y", label: "Alpha vs Benchmark (3Y)", type: "number" },
        { field: "max_drawdown", label: "Max Drawdown %", type: "number" },
        { field: "exit_load", label: "Exit Load %", type: "number" },
        { field: "aum_cr", label: "AUM (₹ Cr)", type: "number" },
      ],
      PMS: [
        { field: "aum_cr", label: "AUM (₹ Cr)", type: "number" },
        { field: "alpha_3y", label: "Alpha (3Y) %", type: "number" },
        { field: "sharpe_ratio", label: "Sharpe Ratio", type: "number" },
        { field: "max_drawdown", label: "Max Drawdown %", type: "number" },
        { field: "irr_inception", label: "IRR since Inception %", type: "number" },
        { field: "client_count", label: "Client Count", type: "number" },
        { field: "manager_exp_years", label: "Manager Experience (Years)", type: "number" },
      ],
      AIF: [
        { field: "category", label: "Category", type: "select", options: ["Category I", "Category II", "Category III"] },
        { field: "strategy", label: "Strategy", type: "select", options: ["PE", "Credit", "Hedge", "Real Estate", "Infrastructure"] },
        { field: "vintage_year", label: "Vintage Year", type: "number" },
        { field: "irr_target", label: "IRR Target %", type: "number" },
        { field: "distribution_yield", label: "Distribution Yield %", type: "number" },
        { field: "lock_in_years", label: "Lock-in (Years)", type: "number" },
        { field: "min_investment_cr", label: "Min Investment (₹ Cr)", type: "number" },
      ],
    };
  }

  /**
   * Get available screening parameters for an asset class
   */
  getScreeningParams(assetClass) {
    return this.screeningParams[assetClass] || [];
  }

  /**
   * Fetch data for screening based on asset class
   */
  async fetchScreeningData(assetClass) {
    const cacheKey = `screening_data_${assetClass}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let data = [];

    try {
      switch (assetClass) {
        case "US_EQUITY": {
          const stocks = await yahooFinanceService.getTopUSStocks();
          data = stocks.map((s) => ({ ...s, asset_class: "US_EQUITY" }));
          break;
        }
        case "CRYPTO": {
          const cryptos = await cryptoService.getTopCryptos(100);
          data = cryptos.map((c) => ({ ...c, asset_class: "CRYPTO" }));
          break;
        }
        case "COMMODITY": {
          const commodities = await yahooFinanceService.getCommodities();
          data = commodities.map((c) => ({
            ...c,
            asset_class: "COMMODITY",
          }));
          break;
        }
        case "BOND": {
          const bonds = await yahooFinanceService.getBonds();
          data = bonds.map((b) => ({ ...b, asset_class: "BOND" }));
          break;
        }
        case "MUTUAL_FUND": {
          const funds = await mutualFundService.getPopularFunds();
          data = funds.map((f) => ({ ...f, asset_class: "MUTUAL_FUND" }));
          break;
        }
        case "INDEX": {
          const indices = await yahooFinanceService.getGlobalIndices();
          data = indices.map((i) => ({ ...i, asset_class: "INDEX" }));
          break;
        }
        case "ETF": {
          const etfs = await nseEtfService.getAllETFs();
          data = Array.isArray(etfs) ? etfs : [];
          break;
        }
        case "SIF": {
          data = await this.getStubSIF();
          break;
        }
        case "PMS": {
          data = await this.getStubPMS();
          break;
        }
        case "AIF": {
          data = await this.getStubAIF();
          break;
        }
        default:
          throw new Error(`Unsupported asset class: ${assetClass}`);
      }

      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(
        `❌ Error fetching screening data for ${assetClass}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Get allowed field names for an asset class (prevents prototype pollution / injection)
   */
  getAllowedFields(assetClass) {
    const params = this.getScreeningParams(assetClass);
    return new Set(params.map((p) => p.field));
  }

  /**
   * Apply filters to data (only allowed fields per asset class)
   */
  applyFilters(data, filters, assetClass) {
    if (!filters || filters.length === 0) return data;
    const allowed = this.getAllowedFields(assetClass);

    return data.filter((item) => {
      return filters.every((filter) => {
        if (!allowed.has(filter.field)) return true; // ignore unknown field
        const value = this.getNestedValue(item, filter.field);

        if (value === null || value === undefined) return false;

        switch (filter.operator) {
          case "eq":
            return (
              String(value).toLowerCase() === String(filter.value).toLowerCase()
            );
          case "gt":
            return parseFloat(value) > parseFloat(filter.value);
          case "lt":
            return parseFloat(value) < parseFloat(filter.value);
          case "gte":
            return parseFloat(value) >= parseFloat(filter.value);
          case "lte":
            return parseFloat(value) <= parseFloat(filter.value);
          case "between":
            if (Array.isArray(filter.value) && filter.value.length === 2) {
              const num = parseFloat(value);
              return (
                num >= parseFloat(filter.value[0]) &&
                num <= parseFloat(filter.value[1])
              );
            }
            return true;
          case "in":
            if (Array.isArray(filter.value)) {
              return filter.value.some(
                (v) => String(v).toLowerCase() === String(value).toLowerCase(),
              );
            }
            return true;
          case "contains":
            return String(value)
              .toLowerCase()
              .includes(String(filter.value).toLowerCase());
          default:
            return true;
        }
      });
    });
  }

  /**
   * Sort data (only allowed sortBy if provided allowedFields set)
   */
  sortData(data, sortBy, sortOrder = "desc", allowedFields = null) {
    if (!sortBy) return data;
    if (allowedFields && !allowedFields.has(sortBy)) return data;

    return [...data].sort((a, b) => {
      const aVal = this.getNestedValue(a, sortBy);
      const bVal = this.getNestedValue(b, sortBy);

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
      }

      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split(".").reduce((o, key) => o?.[key], obj);
  }

  /**
   * Main screening function (limit/offset clamped for DoS prevention)
   */
  async screen(
    assetClass,
    filters = [],
    sortBy,
    sortOrder = "desc",
    limit = 100,
    offset = 0,
  ) {
    try {
      const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
      const safeOffset = Math.min(10000, Math.max(0, parseInt(offset, 10) || 0));

      // Fetch raw data
      let data = await this.fetchScreeningData(assetClass);

      const allowed = this.getAllowedFields(assetClass);
      // Apply filters (only allowed fields)
      data = this.applyFilters(data, filters, assetClass);

      // Sort (only allowed sortBy)
      data = this.sortData(data, sortBy, sortOrder, allowed);

      // Get total before pagination
      const total = data.length;

      // Paginate
      data = data.slice(safeOffset, safeOffset + safeLimit);

      return {
        data,
        pagination: {
          total,
          limit: safeLimit,
          offset: safeOffset,
          hasMore: safeOffset + data.length < total,
        },
        params: this.getScreeningParams(assetClass),
        filtersApplied: filters.length,
      };
    } catch (error) {
      console.error(`❌ Screening error for ${assetClass}:`, error.message);
      throw error;
    }
  }

  /** Stub SIF data (replace with SIF360 / PMS Bazaar API when integrated) */
  async getStubSIF() {
    const list = [
      { name: "SBI Magnum Multi Cap", strategy_type: "Sector Rotation", risk_band: "3", redemption_days: 10, alpha_3y: 4.2, max_drawdown: -12, exit_load: 1, aum_cr: 1200, min_investment_lakh: 10 },
      { name: "Quant qSIF", strategy_type: "Long-Short", risk_band: "4", redemption_days: 30, alpha_3y: 6.1, max_drawdown: -18, exit_load: 0, aum_cr: 450, min_investment_lakh: 10 },
      { name: "Edelweiss Altiva", strategy_type: "Multi-Asset", risk_band: "2", redemption_days: 7, alpha_3y: 3.8, max_drawdown: -8, exit_load: 0.5, aum_cr: 800, min_investment_lakh: 10 },
    ];
    return list.map((r) => ({ ...r, asset_class: "SIF" }));
  }

  /** Stub PMS data (replace with PMSBazaar / PrimeDatabase API when integrated) */
  async getStubPMS() {
    const list = [
      { name: "Motilal Oswal PMS", aum_cr: 12000, alpha_3y: 5.2, sharpe_ratio: 1.4, max_drawdown: -14, irr_inception: 14, client_count: 450, manager_exp_years: 15 },
      { name: "ICICI Pru PMS", aum_cr: 8500, alpha_3y: 4.1, sharpe_ratio: 1.2, max_drawdown: -12, irr_inception: 12, client_count: 320, manager_exp_years: 12 },
      { name: "HDFC PMS", aum_cr: 9500, alpha_3y: 4.8, sharpe_ratio: 1.35, max_drawdown: -11, irr_inception: 13, client_count: 380, manager_exp_years: 18 },
    ];
    return list.map((r) => ({ ...r, asset_class: "PMS" }));
  }

  /** Stub AIF data (replace with SEBI AIF registry / VCCircle when integrated) */
  async getStubAIF() {
    const list = [
      { name: "Kotak AIF Category II", category: "Category II", strategy: "PE", vintage_year: 2021, irr_target: 18, distribution_yield: 12, lock_in_years: 5, min_investment_cr: 1 },
      { name: "ICICI AIF Credit", category: "Category II", strategy: "Credit", vintage_year: 2020, irr_target: 14, distribution_yield: 10, lock_in_years: 3, min_investment_cr: 1 },
      { name: "HDFC AIF Hedge", category: "Category III", strategy: "Hedge", vintage_year: 2022, irr_target: 15, distribution_yield: 0, lock_in_years: 1, min_investment_cr: 1 },
    ];
    return list.map((r) => ({ ...r, asset_class: "AIF" }));
  }

  /**
   * Quick screen - predefined popular screens
   */
  async getQuickScreens() {
    return [
      {
        id: "top_gainers_crypto",
        name: "🚀 Top Crypto Gainers (24h)",
        assetClass: "CRYPTO",
        filters: [{ field: "change_percent", operator: "gt", value: 0 }],
        sortBy: "change_percent",
        sortOrder: "desc",
      },
      {
        id: "top_losers_crypto",
        name: "📉 Top Crypto Losers (24h)",
        assetClass: "CRYPTO",
        filters: [{ field: "change_percent", operator: "lt", value: 0 }],
        sortBy: "change_percent",
        sortOrder: "asc",
      },
      {
        id: "high_volume_us",
        name: "📊 High Volume US Stocks",
        assetClass: "US_EQUITY",
        filters: [],
        sortBy: "volume",
        sortOrder: "desc",
      },
      {
        id: "large_cap_us",
        name: "🏢 Largest US Companies",
        assetClass: "US_EQUITY",
        filters: [],
        sortBy: "market_cap",
        sortOrder: "desc",
      },
      {
        id: "top_mf_gainers",
        name: "📈 Top Mutual Fund Gainers",
        assetClass: "MUTUAL_FUND",
        filters: [{ field: "change_percent", operator: "gt", value: 0 }],
        sortBy: "change_percent",
        sortOrder: "desc",
      },
      {
        id: "energy_commodities",
        name: "⛽ Energy Commodities",
        assetClass: "COMMODITY",
        filters: [{ field: "category", operator: "eq", value: "Energy" }],
        sortBy: "change_percent",
        sortOrder: "desc",
      },
      {
        id: "precious_metals",
        name: "🥇 Precious Metals",
        assetClass: "COMMODITY",
        filters: [
          { field: "category", operator: "eq", value: "Precious Metals" },
        ],
        sortBy: "change_percent",
        sortOrder: "desc",
      },
      {
        id: "etf_aum_100cr",
        name: "📊 ETFs AUM >₹100 Cr",
        assetClass: "ETF",
        filters: [{ field: "aum_cr", operator: "gte", value: 100 }],
        sortBy: "aum_cr",
        sortOrder: "desc",
      },
      {
        id: "etf_equity",
        name: "📈 Equity ETFs",
        assetClass: "ETF",
        filters: [{ field: "category", operator: "eq", value: "Equity" }],
        sortBy: "return_1y",
        sortOrder: "desc",
      },
      {
        id: "etf_gold",
        name: "🥇 Gold ETFs",
        assetClass: "ETF",
        filters: [{ field: "category", operator: "eq", value: "Gold" }],
        sortBy: "aum_cr",
        sortOrder: "desc",
      },
    ];
  }
}

export default new ScreeningService();
