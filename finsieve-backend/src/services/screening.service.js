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

  /** Stub SIF data (Specialized Investment Funds — SEBI category; replace with SIF360 API when available) */
  async getStubSIF() {
    // strategy_type values map to SIF_STRATEGIES in SifScreener: "Multi-Asset","Long Short","Quantitative","Sector"
    const BENCHMARK_1Y = 14.2; // Nifty 50 approx 1Y return
    const BENCHMARK_3Y = 13.1; // Nifty 50 approx 3Y CAGR
    const list = [
      { name: "SBI Magnum Multi Cap SIF",        fund_house: "SBI Mutual Fund",      strategy: "Sector",           risk_band: "Moderately High", strategy_type: "Sector Rotation", redemption_days: 10,  alpha_3y: 4.2,  max_drawdown: -12.4, exit_load: 1.0,  aum_cr: 1200,  min_investment_lakh: 10, sharpe: 1.18 },
      { name: "Quant qSIF Long Short",           fund_house: "Quant Mutual Fund",    strategy: "Long Short",       risk_band: "High",             strategy_type: "Long-Short",      redemption_days: 30,  alpha_3y: 6.1,  max_drawdown: -18.2, exit_load: 0.0,  aum_cr: 450,   min_investment_lakh: 10, sharpe: 1.42 },
      { name: "Edelweiss Altiva Multi-Asset",    fund_house: "Edelweiss MF",         strategy: "Multi-Asset",      risk_band: "Moderate",         strategy_type: "Multi-Asset",     redemption_days: 7,   alpha_3y: 3.8,  max_drawdown: -8.0,  exit_load: 0.5,  aum_cr: 800,   min_investment_lakh: 10, sharpe: 1.05 },
      { name: "Nippon India SIF Quantitative",   fund_house: "Nippon India MF",      strategy: "Quantitative",     risk_band: "High",             strategy_type: "Quant",           redemption_days: 21,  alpha_3y: 5.4,  max_drawdown: -16.1, exit_load: 0.0,  aum_cr: 620,   min_investment_lakh: 10, sharpe: 1.32 },
      { name: "HDFC Flexi SIF",                  fund_house: "HDFC Mutual Fund",     strategy: "Sector",           risk_band: "Moderately High",  strategy_type: "Sector Rotation", redemption_days: 10,  alpha_3y: 4.8,  max_drawdown: -13.2, exit_load: 0.5,  aum_cr: 980,   min_investment_lakh: 10, sharpe: 1.24 },
      { name: "Mirae Asset SIF Long Short",      fund_house: "Mirae Asset MF",       strategy: "Long Short",       risk_band: "High",             strategy_type: "Long-Short",      redemption_days: 45,  alpha_3y: 7.2,  max_drawdown: -22.4, exit_load: 0.0,  aum_cr: 340,   min_investment_lakh: 10, sharpe: 1.52 },
      { name: "Kotak Multi-Factor SIF",          fund_house: "Kotak Mutual Fund",    strategy: "Quantitative",     risk_band: "Moderately High",  strategy_type: "Quant",           redemption_days: 15,  alpha_3y: 4.4,  max_drawdown: -11.8, exit_load: 1.0,  aum_cr: 560,   min_investment_lakh: 10, sharpe: 1.20 },
      { name: "ICICI Pru Sector Rotation SIF",   fund_house: "ICICI Prudential MF",  strategy: "Sector",           risk_band: "Moderately High",  strategy_type: "Sector Rotation", redemption_days: 10,  alpha_3y: 5.1,  max_drawdown: -14.6, exit_load: 0.5,  aum_cr: 740,   min_investment_lakh: 10, sharpe: 1.30 },
      { name: "Axis Multi-Asset SIF",            fund_house: "Axis Mutual Fund",     strategy: "Multi-Asset",      risk_band: "Moderate",         strategy_type: "Multi-Asset",     redemption_days: 5,   alpha_3y: 3.2,  max_drawdown: -7.4,  exit_load: 0.5,  aum_cr: 1100,  min_investment_lakh: 10, sharpe: 0.98 },
      { name: "DSP Quantitative SIF",            fund_house: "DSP Mutual Fund",      strategy: "Quantitative",     risk_band: "High",             strategy_type: "Quant",           redemption_days: 21,  alpha_3y: 5.8,  max_drawdown: -17.2, exit_load: 0.0,  aum_cr: 280,   min_investment_lakh: 10, sharpe: 1.38 },
      { name: "Franklin India Long Short SIF",   fund_house: "Franklin Templeton MF", strategy: "Long Short",      risk_band: "High",             strategy_type: "Long-Short",      redemption_days: 30,  alpha_3y: 5.6,  max_drawdown: -15.8, exit_load: 1.0,  aum_cr: 420,   min_investment_lakh: 10, sharpe: 1.35 },
      { name: "Aditya Birla SL Flexicap SIF",    fund_house: "Aditya Birla Sun Life", strategy: "Multi-Asset",    risk_band: "Moderate",         strategy_type: "Multi-Asset",     redemption_days: 7,   alpha_3y: 3.6,  max_drawdown: -9.2,  exit_load: 0.5,  aum_cr: 890,   min_investment_lakh: 10, sharpe: 1.02 },
      { name: "UTI Alpha Momentum SIF",          fund_house: "UTI Mutual Fund",      strategy: "Quantitative",     risk_band: "High",             strategy_type: "Quant",           redemption_days: 30,  alpha_3y: 8.1,  max_drawdown: -24.1, exit_load: 0.0,  aum_cr: 180,   min_investment_lakh: 10, sharpe: 1.65 },
      { name: "Tata Low Volatility SIF",         fund_house: "Tata Mutual Fund",     strategy: "Quantitative",     risk_band: "Low",              strategy_type: "Quant",           redemption_days: 5,   alpha_3y: 2.4,  max_drawdown: -5.8,  exit_load: 0.5,  aum_cr: 650,   min_investment_lakh: 10, sharpe: 0.85 },
      { name: "Sundaram Market Neutral SIF",     fund_house: "Sundaram Mutual Fund", strategy: "Long Short",       risk_band: "Moderately High",  strategy_type: "Long-Short",      redemption_days: 15,  alpha_3y: 4.6,  max_drawdown: -10.4, exit_load: 0.0,  aum_cr: 320,   min_investment_lakh: 10, sharpe: 1.22 },
    ];
    return list.map((r) => ({
      ...r,
      asset_class: "SIF",
      // Computed aliases for frontend
      alpha: r.alpha_3y,
      min_investment: r.min_investment_lakh,
      redemption: `${r.redemption_days} days`,
      returns_1y: parseFloat((BENCHMARK_1Y + r.alpha_3y * 0.7).toFixed(1)),
      returns_3y: parseFloat((BENCHMARK_3Y + r.alpha_3y).toFixed(1)),
    }));
  }

  /** Stub PMS data (Portfolio Management Services; replace with PMSBazaar / PrimeDatabase API when available) */
  async getStubPMS() {
    const BENCHMARK_1Y = 14.2;
    const BENCHMARK_3Y = 13.1;
    const list = [
      { name: "Motilal Oswal India Opportunity PMS",        manager: "Motilal Oswal AMC",        strategy: "Multi-Cap",       aum_cr: 12000, alpha_3y: 5.2,  sharpe_ratio: 1.42, max_drawdown: -14.2, irr_inception: 14.8, client_count: 450, manager_exp_years: 15, min_investment_lakh: 50 },
      { name: "ICICI Prudential Dynamic PMS",               manager: "ICICI Prudential AMC",     strategy: "Growth",          aum_cr: 8500,  alpha_3y: 4.1,  sharpe_ratio: 1.18, max_drawdown: -12.4, irr_inception: 12.1, client_count: 320, manager_exp_years: 12, min_investment_lakh: 50 },
      { name: "HDFC AMC PMS Growth Opportunities",          manager: "HDFC AMC",                 strategy: "Growth",          aum_cr: 9500,  alpha_3y: 4.8,  sharpe_ratio: 1.35, max_drawdown: -11.8, irr_inception: 13.4, client_count: 380, manager_exp_years: 18, min_investment_lakh: 50 },
      { name: "Kotak PMS India Value",                      manager: "Kotak Securities",         strategy: "Value",           aum_cr: 6200,  alpha_3y: 5.8,  sharpe_ratio: 1.52, max_drawdown: -16.4, irr_inception: 15.2, client_count: 280, manager_exp_years: 14, min_investment_lakh: 50 },
      { name: "Axis Securities PMS Bluechip",               manager: "Axis Securities",          strategy: "Growth",          aum_cr: 4800,  alpha_3y: 4.2,  sharpe_ratio: 1.28, max_drawdown: -11.2, irr_inception: 12.8, client_count: 210, manager_exp_years: 11, min_investment_lakh: 50 },
      { name: "Nippon India PMS Multi Asset",               manager: "Nippon India AMC",         strategy: "Multi-Cap",       aum_cr: 3200,  alpha_3y: 3.8,  sharpe_ratio: 1.14, max_drawdown: -9.8,  irr_inception: 11.6, client_count: 180, manager_exp_years: 16, min_investment_lakh: 50 },
      { name: "SBI Funds Management PMS Quant",             manager: "SBI Funds Management",     strategy: "Quant",           aum_cr: 7100,  alpha_3y: 5.4,  sharpe_ratio: 1.46, max_drawdown: -13.8, irr_inception: 14.1, client_count: 320, manager_exp_years: 20, min_investment_lakh: 50 },
      { name: "ASK Investment Managers Growth",             manager: "ASK Investment Managers",  strategy: "Growth",          aum_cr: 14500, alpha_3y: 6.2,  sharpe_ratio: 1.64, max_drawdown: -15.2, irr_inception: 16.4, client_count: 680, manager_exp_years: 22, min_investment_lakh: 50 },
      { name: "Ambit Capital PMS",                          manager: "Ambit Capital",            strategy: "Value",           aum_cr: 4200,  alpha_3y: 4.6,  sharpe_ratio: 1.32, max_drawdown: -12.8, irr_inception: 13.1, client_count: 240, manager_exp_years: 14, min_investment_lakh: 50 },
      { name: "Carnelian Capital PMS",                      manager: "Carnelian Capital",        strategy: "Mid & Small Cap", aum_cr: 2800,  alpha_3y: 7.1,  sharpe_ratio: 1.72, max_drawdown: -18.4, irr_inception: 17.8, client_count: 120, manager_exp_years: 12, min_investment_lakh: 50 },
      { name: "Marcellus Investment Consistent Compounder", manager: "Marcellus Investment",     strategy: "Growth",          aum_cr: 6800,  alpha_3y: 5.8,  sharpe_ratio: 1.56, max_drawdown: -10.2, irr_inception: 15.4, client_count: 340, manager_exp_years: 16, min_investment_lakh: 50 },
      { name: "Mirae Asset PMS India Leaders",              manager: "Mirae Asset Investment",   strategy: "Multi-Cap",       aum_cr: 3400,  alpha_3y: 4.4,  sharpe_ratio: 1.24, max_drawdown: -12.1, irr_inception: 12.6, client_count: 155, manager_exp_years: 10, min_investment_lakh: 50 },
      { name: "Tata Asset Management PMS",                  manager: "Tata Asset Management",    strategy: "Growth",          aum_cr: 5200,  alpha_3y: 4.1,  sharpe_ratio: 1.20, max_drawdown: -11.6, irr_inception: 12.4, client_count: 260, manager_exp_years: 14, min_investment_lakh: 50 },
      { name: "Alchemy Capital PMS",                        manager: "Alchemy Capital",          strategy: "Contra",          aum_cr: 3800,  alpha_3y: 6.4,  sharpe_ratio: 1.58, max_drawdown: -14.8, irr_inception: 16.1, client_count: 190, manager_exp_years: 18, min_investment_lakh: 50 },
      { name: "Emkay Investment Managers PMS",              manager: "Emkay Investment Mgrs",    strategy: "Mid & Small Cap", aum_cr: 2100,  alpha_3y: 5.2,  sharpe_ratio: 1.38, max_drawdown: -13.4, irr_inception: 14.0, client_count: 110, manager_exp_years: 11, min_investment_lakh: 50 },
    ];
    return list.map((r) => ({
      ...r,
      asset_class: "PMS",
      // Computed aliases for frontend
      alpha: r.alpha_3y,
      sharpe: r.sharpe_ratio,
      irr_3y: r.irr_inception,
      clients: r.client_count,
      experience_years: r.manager_exp_years,
      min_investment: r.min_investment_lakh,
      returns_1y: parseFloat((BENCHMARK_1Y + r.alpha_3y * 0.7).toFixed(1)),
      returns_3y: parseFloat((BENCHMARK_3Y + r.alpha_3y).toFixed(1)),
    }));
  }

  /** Stub AIF data (Alternative Investment Funds; replace with SEBI AIF registry / VCCircle API when available) */
  async getStubAIF() {
    const list = [
      { name: "Kotak Alternate Asset AIF Cat II",          manager: "Kotak Investment Advisors",    category: "Category II",  strategy: "PE",             vintage_year: 2021, irr_target: 18.0, irr_achieved: 16.4, distribution_yield: 12.0, lock_in_years: 5, min_investment_cr: 1, aum_cr: 2400 },
      { name: "ICICI Pru Credit Opportunities AIF",        manager: "ICICI Prudential AMC",         category: "Category II",  strategy: "Credit",         vintage_year: 2020, irr_target: 14.0, irr_achieved: 13.2, distribution_yield: 10.0, lock_in_years: 3, min_investment_cr: 1, aum_cr: 1800 },
      { name: "HDFC Capital AIF Category III Hedge",       manager: "HDFC Capital Advisors",        category: "Category III", strategy: "Hedge",          vintage_year: 2022, irr_target: 15.0, irr_achieved: 14.1, distribution_yield: 0.0,  lock_in_years: 1, min_investment_cr: 1, aum_cr: 950  },
      { name: "Axis Alternatives AIF Real Estate",         manager: "Axis Capital",                 category: "Category II",  strategy: "Real Estate",    vintage_year: 2021, irr_target: 16.0, irr_achieved: 14.8, distribution_yield: 8.0,  lock_in_years: 4, min_investment_cr: 1, aum_cr: 1200 },
      { name: "SBI Opportunities Fund AIF",                manager: "SBI CAP Ventures",             category: "Category I",   strategy: "Infrastructure", vintage_year: 2020, irr_target: 12.0, irr_achieved: 11.4, distribution_yield: 7.0,  lock_in_years: 7, min_investment_cr: 1, aum_cr: 3200 },
      { name: "Motilal Oswal AIF India Credit",            manager: "Motilal Oswal AMC",            category: "Category II",  strategy: "Credit",         vintage_year: 2021, irr_target: 14.5, irr_achieved: 13.8, distribution_yield: 11.0, lock_in_years: 3, min_investment_cr: 1, aum_cr: 1600 },
      { name: "Nippon India AIF Infra Fund",               manager: "Nippon India AMC",             category: "Category I",   strategy: "Infrastructure", vintage_year: 2019, irr_target: 11.0, irr_achieved: 10.6, distribution_yield: 6.5,  lock_in_years: 8, min_investment_cr: 1, aum_cr: 2800 },
      { name: "Avendus Future Leaders AIF",                manager: "Avendus Capital",              category: "Category III", strategy: "Hedge",          vintage_year: 2022, irr_target: 20.0, irr_achieved: 18.2, distribution_yield: 0.0,  lock_in_years: 1, min_investment_cr: 1, aum_cr: 720  },
      { name: "True Beacon AIF One",                       manager: "True Beacon",                  category: "Category III", strategy: "Hedge",          vintage_year: 2019, irr_target: 18.0, irr_achieved: 16.8, distribution_yield: 0.0,  lock_in_years: 1, min_investment_cr: 10, aum_cr: 1400 },
      { name: "Edelweiss AIF Private Equity",              manager: "Edelweiss Alternatives",       category: "Category II",  strategy: "PE",             vintage_year: 2020, irr_target: 19.0, irr_achieved: 17.4, distribution_yield: 0.0,  lock_in_years: 6, min_investment_cr: 1, aum_cr: 1900 },
      { name: "360 ONE Alternate Assets AIF",              manager: "360 ONE Asset Mgmt",           category: "Category II",  strategy: "PE",             vintage_year: 2022, irr_target: 17.5, irr_achieved: 15.8, distribution_yield: 5.0,  lock_in_years: 5, min_investment_cr: 1, aum_cr: 1100 },
      { name: "Multiples PE AIF",                          manager: "Multiples Alternate Asset Mgmt", category: "Category II", strategy: "PE",            vintage_year: 2018, irr_target: 22.0, irr_achieved: 20.8, distribution_yield: 0.0,  lock_in_years: 7, min_investment_cr: 5, aum_cr: 4200 },
      { name: "ICICI Prudential AIF Infrastructure",       manager: "ICICI Prudential AMC",         category: "Category I",   strategy: "Infrastructure", vintage_year: 2021, irr_target: 12.5, irr_achieved: 11.8, distribution_yield: 7.5,  lock_in_years: 7, min_investment_cr: 1, aum_cr: 2100 },
      { name: "Blume Ventures AIF IV",                     manager: "Blume Ventures",               category: "Category I",   strategy: "PE",             vintage_year: 2022, irr_target: 25.0, irr_achieved: 22.4, distribution_yield: 0.0,  lock_in_years: 8, min_investment_cr: 1, aum_cr: 680  },
      { name: "Waterfield Advisors AIF Real Estate",       manager: "Waterfield Advisors",          category: "Category II",  strategy: "Real Estate",    vintage_year: 2021, irr_target: 15.0, irr_achieved: 13.6, distribution_yield: 7.0,  lock_in_years: 4, min_investment_cr: 2, aum_cr: 840  },
    ];
    return list.map((r) => ({
      ...r,
      asset_class: "AIF",
      // Computed aliases for frontend (min_investment in lakhs: 1 Cr = 100 lakhs)
      min_investment: r.min_investment_cr * 100,
      distributions: r.distribution_yield,
      nav: 100 + (2026 - r.vintage_year) * r.irr_achieved,
    }));
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
