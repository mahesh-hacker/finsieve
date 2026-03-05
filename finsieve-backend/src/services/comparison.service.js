/**
 * Comparison Service
 * Side-by-side comparison across any asset class
 * The feature that makes users uninstall every other app
 */

import yahooFinanceService from "./yahooFinance.service.js";
import cryptoService from "./crypto.service.js";
import mutualFundService from "./mutualFund.service.js";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 30, checkperiod: 35 });

class ComparisonService {
  /**
   * Compare instruments across any asset class
   * @param {Array<{symbol: string, asset_class: string}>} instruments - Up to 5 instruments
   */
  async compareInstruments(instruments) {
    if (!instruments || instruments.length < 2) {
      throw new Error("At least 2 instruments required for comparison");
    }
    if (instruments.length > 5) {
      throw new Error("Maximum 5 instruments can be compared");
    }

    const results = await Promise.allSettled(
      instruments.map((inst) =>
        this.fetchInstrumentData(inst.symbol, inst.asset_class),
      ),
    );

    const comparisonData = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return {
          ...result.value,
          _requested: instruments[index],
        };
      }
      return {
        symbol: instruments[index].symbol,
        asset_class: instruments[index].asset_class,
        error: "Failed to fetch data",
        _requested: instruments[index],
      };
    });

    // Build comparison metrics
    const metrics = this.buildComparisonMetrics(comparisonData);

    return {
      instruments: comparisonData,
      metrics,
      compared_at: new Date().toISOString(),
    };
  }

  /**
   * Fetch instrument data based on asset class
   */
  async fetchInstrumentData(symbol, assetClass) {
    const cacheKey = `compare_${assetClass}_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let data;

    switch (assetClass) {
      case "US_EQUITY": {
        data = await yahooFinanceService.getStockDetail(symbol);
        data.asset_class = "US_EQUITY";
        break;
      }
      case "CRYPTO": {
        data = await cryptoService.getCryptoDetail(symbol);
        data.asset_class = "CRYPTO";
        break;
      }
      case "MUTUAL_FUND": {
        data = await mutualFundService.getFundData(symbol);
        data.asset_class = "MUTUAL_FUND";
        break;
      }
      case "COMMODITY": {
        const commodities = await yahooFinanceService.getCommodities();
        data = commodities.find(
          (c) => c.symbol.toUpperCase() === symbol.toUpperCase(),
        );
        if (!data) throw new Error(`Commodity ${symbol} not found`);
        data.asset_class = "COMMODITY";
        break;
      }
      case "BOND": {
        const bonds = await yahooFinanceService.getBonds();
        data = bonds.find(
          (b) => b.symbol.toUpperCase() === symbol.toUpperCase(),
        );
        if (!data) throw new Error(`Bond ${symbol} not found`);
        data.asset_class = "BOND";
        break;
      }
      case "INDEX": {
        const indices = await yahooFinanceService.getGlobalIndices();
        data = indices.find(
          (i) => i.symbol.toUpperCase() === symbol.toUpperCase(),
        );
        if (!data) throw new Error(`Index ${symbol} not found`);
        data.asset_class = "INDEX";
        break;
      }
      default:
        throw new Error(`Unsupported asset class: ${assetClass}`);
    }

    cache.set(cacheKey, data);
    return data;
  }

  /**
   * Build comparison metrics
   */
  buildComparisonMetrics(instruments) {
    const validInstruments = instruments.filter((i) => !i.error);

    if (validInstruments.length < 2)
      return { summary: "Insufficient data for comparison" };

    const metrics = {
      performance: {},
      valuation: {},
      summary: [],
    };

    // Performance comparison
    const changes = validInstruments.map((i) => ({
      symbol: i.symbol || i.scheme_name,
      change_percent: parseFloat(i.change_percent || 0),
    }));

    changes.sort((a, b) => b.change_percent - a.change_percent);
    metrics.performance.best = changes[0];
    metrics.performance.worst = changes[changes.length - 1];
    metrics.performance.all = changes;

    // Summary
    metrics.summary.push(
      `${changes[0].symbol} is the best performer (${changes[0].change_percent >= 0 ? "+" : ""}${changes[0].change_percent.toFixed(2)}%)`,
    );
    metrics.summary.push(
      `${changes[changes.length - 1].symbol} is the worst performer (${changes[changes.length - 1].change_percent >= 0 ? "+" : ""}${changes[changes.length - 1].change_percent.toFixed(2)}%)`,
    );

    return metrics;
  }

  /**
   * Search instruments across all asset classes for comparison picker
   */
  async searchForComparison(searchQuery) {
    if (!searchQuery || searchQuery.length < 2) {
      return [];
    }

    const results = [];
    const q = searchQuery.toLowerCase();

    try {
      // Search US stocks
      const usResults = await yahooFinanceService.searchUSStocks(searchQuery);
      if (usResults) {
        results.push(
          ...usResults.slice(0, 5).map((s) => ({
            symbol: s.symbol,
            name: s.name || s.longname || s.shortname,
            asset_class: "US_EQUITY",
            exchange: s.exchange || "US",
          })),
        );
      }
    } catch (e) {
      /* skip on error */
    }

    try {
      // Search crypto
      const cryptoResults = await cryptoService.searchCrypto(searchQuery);
      if (cryptoResults) {
        results.push(
          ...cryptoResults.slice(0, 5).map((c) => ({
            symbol: c.id || c.symbol,
            name: c.name,
            asset_class: "CRYPTO",
            exchange: "CoinGecko",
          })),
        );
      }
    } catch (e) {
      /* skip on error */
    }

    try {
      // Search mutual funds
      const mfResults = await mutualFundService.searchFunds(searchQuery);
      if (mfResults) {
        results.push(
          ...mfResults.slice(0, 5).map((f) => ({
            symbol: f.scheme_code || f.schemeCode,
            name: f.scheme_name || f.schemeName,
            asset_class: "MUTUAL_FUND",
            exchange: "AMFI",
          })),
        );
      }
    } catch (e) {
      /* skip on error */
    }

    // Search indices from static list
    try {
      const allIndices = await yahooFinanceService.getGlobalIndices();
      const matchingIndices = allIndices.filter(
        (i) =>
          i.symbol?.toLowerCase().includes(q) ||
          i.name?.toLowerCase().includes(q),
      );
      results.push(
        ...matchingIndices.slice(0, 5).map((i) => ({
          symbol: i.symbol,
          name: i.name,
          asset_class: "INDEX",
          exchange: i.exchange || i.country,
        })),
      );
    } catch (e) {
      /* skip on error */
    }

    // Search commodities from static list
    try {
      const allCommodities = await yahooFinanceService.getCommodities();
      const matchingCommodities = allCommodities.filter(
        (c) =>
          c.symbol?.toLowerCase().includes(q) ||
          c.name?.toLowerCase().includes(q),
      );
      results.push(
        ...matchingCommodities.slice(0, 3).map((c) => ({
          symbol: c.symbol,
          name: c.name,
          asset_class: "COMMODITY",
          exchange: c.unit || "Futures",
        })),
      );
    } catch (e) {
      /* skip on error */
    }

    return results;
  }
}

export default new ComparisonService();
