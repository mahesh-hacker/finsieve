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
   * Apply filters to data
   */
  applyFilters(data, filters) {
    if (!filters || filters.length === 0) return data;

    return data.filter((item) => {
      return filters.every((filter) => {
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
   * Sort data
   */
  sortData(data, sortBy, sortOrder = "desc") {
    if (!sortBy) return data;

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
   * Main screening function
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
      // Fetch raw data
      let data = await this.fetchScreeningData(assetClass);

      // Apply filters
      data = this.applyFilters(data, filters);

      // Sort
      data = this.sortData(data, sortBy, sortOrder);

      // Get total before pagination
      const total = data.length;

      // Paginate
      data = data.slice(offset, offset + limit);

      return {
        data,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + data.length < total,
        },
        params: this.getScreeningParams(assetClass),
        filtersApplied: filters.length,
      };
    } catch (error) {
      console.error(`❌ Screening error for ${assetClass}:`, error.message);
      throw error;
    }
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
    ];
  }
}

export default new ScreeningService();
