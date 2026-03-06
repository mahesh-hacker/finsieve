/**
 * Yahoo Finance Service
 * GAME CHANGER - Covers US Stocks, Global Indices, Commodities, Bonds, Mutual Funds
 * Uses yahoo-finance2 npm package - FREE, no API key required
 */

import YahooFinance from "yahoo-finance2";
import NodeCache from "node-cache";

// Instantiate yahoo-finance2 v3
const yahooFinance = new YahooFinance();

// Cache with 30-second TTL to avoid hammering the API
const cache = new NodeCache({ stdTTL: 30, checkperiod: 35 });

class YahooFinanceService {
  constructor() {
    // ═══════════════════════════════════════════════════════
    // US MARKET INDICES
    // ═══════════════════════════════════════════════════════
    this.usIndices = {
      "^GSPC": {
        symbol: "SPX",
        name: "S&P 500",
        country: "United States",
        exchange: "SNP",
      },
      "^DJI": {
        symbol: "DJI",
        name: "Dow Jones Industrial Average",
        country: "United States",
        exchange: "DJI",
      },
      "^IXIC": {
        symbol: "IXIC",
        name: "NASDAQ Composite",
        country: "United States",
        exchange: "NASDAQ",
      },
      "^RUT": {
        symbol: "RUT",
        name: "Russell 2000",
        country: "United States",
        exchange: "NYSE",
      },
      "^VIX": {
        symbol: "VIX",
        name: "CBOE Volatility Index",
        country: "United States",
        exchange: "CBOE",
      },
      "^SOX": {
        symbol: "SOX",
        name: "PHLX Semiconductor Index",
        country: "United States",
        exchange: "NASDAQ",
      },
    };

    // ═══════════════════════════════════════════════════════
    // GLOBAL INDICES (Non-US, Non-India)
    // ═══════════════════════════════════════════════════════
    this.globalIndices = {
      "^FTSE": {
        symbol: "FTSE",
        name: "FTSE 100",
        country: "United Kingdom",
        exchange: "LSE",
      },
      "^GDAXI": {
        symbol: "DAX",
        name: "DAX 40",
        country: "Germany",
        exchange: "XETRA",
      },
      "^FCHI": {
        symbol: "CAC",
        name: "CAC 40",
        country: "France",
        exchange: "EURONEXT",
      },
      "^STOXX50E": {
        symbol: "STOXX50E",
        name: "EURO STOXX 50",
        country: "Europe",
        exchange: "STOXX",
      },
      "^N225": {
        symbol: "N225",
        name: "Nikkei 225",
        country: "Japan",
        exchange: "OSE",
      },
      "^HSI": {
        symbol: "HSI",
        name: "Hang Seng Index",
        country: "Hong Kong",
        exchange: "HKSE",
      },
      "000001.SS": {
        symbol: "SSE",
        name: "Shanghai Composite",
        country: "China",
        exchange: "SSE",
      },
      "^KS11": {
        symbol: "KOSPI",
        name: "KOSPI",
        country: "South Korea",
        exchange: "KRX",
      },
      "^TWII": {
        symbol: "TWII",
        name: "Taiwan Weighted Index",
        country: "Taiwan",
        exchange: "TWSE",
      },
      "^AXJO": {
        symbol: "AXJO",
        name: "ASX 200",
        country: "Australia",
        exchange: "ASX",
      },
      "^STI": {
        symbol: "STI",
        name: "Straits Times Index",
        country: "Singapore",
        exchange: "SGX",
      },
      "^BSESN": {
        symbol: "SENSEX",
        name: "BSE SENSEX",
        country: "India",
        exchange: "BSE",
      },
      "^NSEI": {
        symbol: "NIFTY",
        name: "NIFTY 50",
        country: "India",
        exchange: "NSE",
      },
      "^IBEX": {
        symbol: "IBEX",
        name: "IBEX 35",
        country: "Spain",
        exchange: "BME",
      },
      "^GSPTSE": {
        symbol: "TSX",
        name: "S&P/TSX Composite",
        country: "Canada",
        exchange: "TSX",
      },
      "^BVSP": {
        symbol: "BOVESPA",
        name: "BOVESPA",
        country: "Brazil",
        exchange: "B3",
      },
      "^MXX": {
        symbol: "IPC",
        name: "IPC Mexico",
        country: "Mexico",
        exchange: "BMV",
      },
      "^JKSE": {
        symbol: "JKSE",
        name: "Jakarta Composite",
        country: "Indonesia",
        exchange: "IDX",
      },
    };

    // ═══════════════════════════════════════════════════════
    // INDIAN MARKET INDICES — NSE Sectoral + BSE + GIFT India
    // ═══════════════════════════════════════════════════════
    this.indianIndices = {
      // ── Broad Market ──────────────────────────────────
      "^NSEI": {
        symbol: "NIFTY",
        name: "NIFTY 50",
        country: "India",
        exchange: "NSE",
        category: "Broad Market",
      },
      "^BSESN": {
        symbol: "SENSEX",
        name: "BSE SENSEX",
        country: "India",
        exchange: "BSE",
        category: "Broad Market",
      },
      "^NSEMDCP50": {
        symbol: "NIFMDCP50",
        name: "NIFTY Midcap 50",
        country: "India",
        exchange: "NSE",
        category: "Broad Market",
      },
      "^CNXMIDCAP": {
        symbol: "NIFMDCP100",
        name: "NIFTY Midcap 100",
        country: "India",
        exchange: "NSE",
        category: "Broad Market",
      },
      "^CNXSMALLCAP": {
        symbol: "NIFSMCP100",
        name: "NIFTY Smallcap 100",
        country: "India",
        exchange: "NSE",
        category: "Broad Market",
      },
      // ── Sectoral ──────────────────────────────────────
      "^NSEBANK": {
        symbol: "BANKNIFTY",
        name: "NIFTY Bank",
        country: "India",
        exchange: "NSE",
        category: "Sectoral",
      },
      "^CNXFINANCE": {
        symbol: "NIFFIN",
        name: "NIFTY Financial Services",
        country: "India",
        exchange: "NSE",
        category: "Sectoral",
      },
      "^CNXIT": {
        symbol: "NIFTYIT",
        name: "NIFTY IT",
        country: "India",
        exchange: "NSE",
        category: "Sectoral",
      },
      "^CNXAUTO": {
        symbol: "NIFTYAUTO",
        name: "NIFTY Auto",
        country: "India",
        exchange: "NSE",
        category: "Sectoral",
      },
      "^CNXPHARMA": {
        symbol: "NIFTYPHARMA",
        name: "NIFTY Pharma",
        country: "India",
        exchange: "NSE",
        category: "Sectoral",
      },
      "^CNXFMCG": {
        symbol: "NIFTYFMCG",
        name: "NIFTY FMCG",
        country: "India",
        exchange: "NSE",
        category: "Sectoral",
      },
      "^CNXMETAL": {
        symbol: "NIFTYMETAL",
        name: "NIFTY Metal",
        country: "India",
        exchange: "NSE",
        category: "Sectoral",
      },
      "^CNXREALTY": {
        symbol: "NIFTYREAL",
        name: "NIFTY Realty",
        country: "India",
        exchange: "NSE",
        category: "Sectoral",
      },
      "^CNXENERGY": {
        symbol: "NIFTENERGY",
        name: "NIFTY Energy",
        country: "India",
        exchange: "NSE",
        category: "Sectoral",
      },
      "^CNXINFRA": {
        symbol: "NIFTYINFRA",
        name: "NIFTY Infrastructure",
        country: "India",
        exchange: "NSE",
        category: "Sectoral",
      },
      // ── Volatility ────────────────────────────────────
      "^INDIAVIX": {
        symbol: "INDIAVIX",
        name: "India VIX",
        country: "India",
        exchange: "NSE",
        category: "Volatility",
      },
    };

    // ═══════════════════════════════════════════════════════
    // COMMODITIES
    // ═══════════════════════════════════════════════════════
    this.commodities = {
      // Precious Metals
      "GC=F": {
        symbol: "GOLD",
        name: "Gold",
        category: "Precious Metals",
        unit: "USD/oz",
      },
      "SI=F": {
        symbol: "SILVER",
        name: "Silver",
        category: "Precious Metals",
        unit: "USD/oz",
      },
      "PL=F": {
        symbol: "PLATINUM",
        name: "Platinum",
        category: "Precious Metals",
        unit: "USD/oz",
      },
      "PA=F": {
        symbol: "PALLADIUM",
        name: "Palladium",
        category: "Precious Metals",
        unit: "USD/oz",
      },

      // Energy
      "CL=F": {
        symbol: "CRUDEOIL",
        name: "Crude Oil WTI",
        category: "Energy",
        unit: "USD/bbl",
      },
      "BZ=F": {
        symbol: "BRENTOIL",
        name: "Brent Crude Oil",
        category: "Energy",
        unit: "USD/bbl",
      },
      "NG=F": {
        symbol: "NATGAS",
        name: "Natural Gas",
        category: "Energy",
        unit: "USD/MMBtu",
      },
      "RB=F": {
        symbol: "GASOLINE",
        name: "Gasoline RBOB",
        category: "Energy",
        unit: "USD/gal",
      },

      // Agriculture
      "ZC=F": {
        symbol: "CORN",
        name: "Corn",
        category: "Agriculture",
        unit: "USd/bu",
      },
      "ZW=F": {
        symbol: "WHEAT",
        name: "Wheat",
        category: "Agriculture",
        unit: "USd/bu",
      },
      "ZS=F": {
        symbol: "SOYBEAN",
        name: "Soybean",
        category: "Agriculture",
        unit: "USd/bu",
      },
      "KC=F": {
        symbol: "COFFEE",
        name: "Coffee",
        category: "Agriculture",
        unit: "USd/lb",
      },
      "SB=F": {
        symbol: "SUGAR",
        name: "Sugar",
        category: "Agriculture",
        unit: "USd/lb",
      },
      "CT=F": {
        symbol: "COTTON",
        name: "Cotton",
        category: "Agriculture",
        unit: "USd/lb",
      },

      // Industrial Metals
      "HG=F": {
        symbol: "COPPER",
        name: "Copper",
        category: "Industrial Metals",
        unit: "USD/lb",
      },
    };

    // ═══════════════════════════════════════════════════════
    // BONDS & TREASURY YIELDS
    // ═══════════════════════════════════════════════════════
    this.bonds = {
      "^TNX": {
        symbol: "US10Y",
        name: "US 10-Year Treasury Yield",
        category: "US Treasury",
        maturity: "10Y",
      },
      "^TYX": {
        symbol: "US30Y",
        name: "US 30-Year Treasury Yield",
        category: "US Treasury",
        maturity: "30Y",
      },
      "^FVX": {
        symbol: "US5Y",
        name: "US 5-Year Treasury Yield",
        category: "US Treasury",
        maturity: "5Y",
      },
      "^IRX": {
        symbol: "US3M",
        name: "US 3-Month Treasury Bill",
        category: "US Treasury",
        maturity: "3M",
      },
      "^TN2Y.": {
        symbol: "US2Y",
        name: "US 2-Year Treasury Yield",
        category: "US Treasury",
        maturity: "2Y",
      },
    };

    // ═══════════════════════════════════════════════════════
    // CURRENCY / FOREX
    // ═══════════════════════════════════════════════════════
    this.currencies = {
      "USDINR=X": {
        symbol: "USDINR",
        name: "USD/INR",
        base: "USD",
        quote: "INR",
      },
      "EURUSD=X": {
        symbol: "EURUSD",
        name: "EUR/USD",
        base: "EUR",
        quote: "USD",
      },
      "GBPUSD=X": {
        symbol: "GBPUSD",
        name: "GBP/USD",
        base: "GBP",
        quote: "USD",
      },
      "USDJPY=X": {
        symbol: "USDJPY",
        name: "USD/JPY",
        base: "USD",
        quote: "JPY",
      },
      DX: {
        symbol: "DXY",
        name: "US Dollar Index",
        base: "USD",
        quote: "basket",
      },
    };

    // ═══════════════════════════════════════════════════════
    // TOP US STOCKS (Blue-chips that people track daily)
    // ═══════════════════════════════════════════════════════
    this.topUSStocks = [
      // Mega-cap Tech
      "AAPL","MSFT","GOOGL","AMZN","NVDA","META","TSLA","AVGO","ORCL","ADBE",
      "QCOM","TXN","AMD","INTC","CSCO","IBM","NOW","INTU","PANW","AMAT",
      // Financial
      "BRK-B","JPM","V","MA","BAC","WFC","GS","MS","AXP","BLK",
      "SCHW","USB","PNC","TFC","COF","SPGI","MCO","ICE","CME","CB",
      // Healthcare
      "JNJ","UNH","LLY","MRK","ABBV","PFE","TMO","ABT","DHR","BMY",
      "AMGN","GILD","SYK","BDX","MDT","EW","REGN","VRTX","ISRG","HUM",
      // Consumer
      "WMT","PG","KO","PEP","COST","HD","MCD","NKE","SBUX","TGT",
      "LOW","CL","EL","PM","MO","KHC","GIS","HSY","K","SJM",
      // Energy & Industrials
      "XOM","CVX","COP","EOG","SLB","LIN","HON","UPS","GE","CAT",
      "DE","BA","RTX","LMT","NOC","EMR","ETN","ITW","PH","ROK",
      // Communication & Media
      "NFLX","DIS","CMCSA","VZ","T","PARA","WBD","FOXA","EA","TTWO",
      // Real Estate & Utilities
      "AMT","PLD","CCI","EQIX","NEE","DUK","SO","D","AEP","SRE",
    ];
  }

  // ═══════════════════════════════════════════════════════════
  //  CORE FETCH METHOD - Batch quotes from Yahoo Finance
  // ═══════════════════════════════════════════════════════════

  /**
   * Fetch quotes for multiple symbols from Yahoo Finance
   * Uses caching to avoid rate limits
   */
  async fetchQuotes(symbols) {
    const cacheKey = `quotes_${symbols.sort().join("_")}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const results = [];

      // Fetch in smaller batches to avoid timeouts
      const batchSize = 10;
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);

        const promises = batch.map(async (symbol) => {
          try {
            const quote = await yahooFinance.quote(symbol);
            return { yahooSymbol: symbol, data: quote, error: null };
          } catch (err) {
            console.error(`⚠️ Failed to fetch ${symbol}:`, err.message);
            return { yahooSymbol: symbol, data: null, error: err.message };
          }
        });

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
      }

      cache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error("❌ Yahoo Finance batch fetch error:", error.message);
      throw error;
    }
  }

  /**
   * Map Yahoo Finance quote to our standard format
   */
  mapQuoteToStandard(quote, meta = {}) {
    if (!quote) return null;

    return {
      symbol: meta.symbol || quote.symbol,
      name: meta.name || quote.shortName || quote.longName || quote.symbol,
      current_value: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      change_percent: quote.regularMarketChangePercent || 0,
      previous_close: quote.regularMarketPreviousClose || 0,
      open: quote.regularMarketOpen || 0,
      high: quote.regularMarketDayHigh || 0,
      low: quote.regularMarketDayLow || 0,
      volume: quote.regularMarketVolume || 0,
      market_cap: quote.marketCap || null,
      fifty_two_week_high: quote.fiftyTwoWeekHigh || null,
      fifty_two_week_low: quote.fiftyTwoWeekLow || null,
      currency: quote.currency || "USD",
      exchange: quote.exchangeTimezoneShortName || meta.exchange || "",
      last_updated: new Date().toISOString(),
      ...meta,
    };
  }

  // ═══════════════════════════════════════════════════════════
  //  US MARKET DATA
  // ═══════════════════════════════════════════════════════════

  /**
   * Get all US market indices (S&P 500, Dow, NASDAQ, Russell 2000, VIX)
   */
  async getUSIndices() {
    const cacheKey = "us_indices";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log("🇺🇸 Fetching US indices from Yahoo Finance...");
      const yahooSymbols = Object.keys(this.usIndices);
      const results = await this.fetchQuotes(yahooSymbols);

      const indices = results
        .filter((r) => r.data)
        .map((r) => {
          const meta = this.usIndices[r.yahooSymbol];
          return this.mapQuoteToStandard(r.data, meta);
        });

      console.log(`✅ Fetched ${indices.length} US indices`);
      cache.set(cacheKey, indices, 15); // 15 second cache for US
      return indices;
    } catch (error) {
      console.error("❌ Error fetching US indices:", error.message);
      throw error;
    }
  }

  /**
   * Get top US stocks with real-time data
   */
  async getTopUSStocks() {
    const cacheKey = "top_us_stocks";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log("🇺🇸 Fetching top US stocks...");
      const results = await this.fetchQuotes(this.topUSStocks);

      const stocks = results
        .filter((r) => r.data)
        .map((r) => ({
          symbol: r.data.symbol,
          name: r.data.shortName || r.data.longName || r.data.symbol,
          current_value: r.data.regularMarketPrice || 0,
          change: r.data.regularMarketChange || 0,
          change_percent: r.data.regularMarketChangePercent || 0,
          previous_close: r.data.regularMarketPreviousClose || 0,
          open: r.data.regularMarketOpen || 0,
          high: r.data.regularMarketDayHigh || 0,
          low: r.data.regularMarketDayLow || 0,
          volume: r.data.regularMarketVolume || 0,
          market_cap: r.data.marketCap || 0,
          pe_ratio: r.data.trailingPE || null,
          fifty_two_week_high: r.data.fiftyTwoWeekHigh || null,
          fifty_two_week_low: r.data.fiftyTwoWeekLow || null,
          avg_volume: r.data.averageDailyVolume3Month || 0,
          currency: "USD",
          exchange: r.data.fullExchangeName || "NASDAQ",
          sector: r.data.sector || null,
          last_updated: new Date().toISOString(),
        }));

      console.log(`✅ Fetched ${stocks.length} US stocks`);
      cache.set(cacheKey, stocks, 15);
      return stocks;
    } catch (error) {
      console.error("❌ Error fetching US stocks:", error.message);
      throw error;
    }
  }

  /**
   * Search US stocks by query
   */
  async searchUSStocks(queryStr) {
    try {
      const results = await yahooFinance.search(queryStr, {
        newsCount: 0,
        quotesCount: 20,
      });
      return (results.quotes || []).map((q) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchange,
        type: q.quoteType,
      }));
    } catch (error) {
      console.error("❌ Search error:", error.message);
      return [];
    }
  }

  /**
   * Get detailed quote for a single US stock
   */
  async getStockDetail(symbol) {
    try {
      const [quote, summary] = await Promise.all([
        yahooFinance.quote(symbol),
        yahooFinance
          .quoteSummary(symbol, {
            modules: [
              "price",
              "summaryDetail",
              "defaultKeyStatistics",
              "financialData",
              "earnings",
            ],
          })
          .catch(() => null),
      ]);

      const detail = {
        symbol: quote.symbol,
        name: quote.shortName || quote.longName,
        current_value: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        change_percent: quote.regularMarketChangePercent,
        previous_close: quote.regularMarketPreviousClose,
        open: quote.regularMarketOpen,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        market_cap: quote.marketCap,
        pe_ratio: quote.trailingPE,
        forward_pe: quote.forwardPE,
        eps: quote.epsTrailingTwelveMonths,
        dividend_yield: quote.dividendYield,
        fifty_two_week_high: quote.fiftyTwoWeekHigh,
        fifty_two_week_low: quote.fiftyTwoWeekLow,
        avg_volume: quote.averageDailyVolume3Month,
        beta: quote.beta,
        currency: quote.currency,
        exchange: quote.fullExchangeName,
      };

      if (summary) {
        const sd = summary.summaryDetail || {};
        const fData = summary.financialData || {};
        const keyStats = summary.defaultKeyStatistics || {};

        detail.price_to_book = keyStats.priceToBook || null;
        detail.revenue = fData.totalRevenue || null;
        detail.profit_margin = fData.profitMargins || null;
        detail.operating_margin = fData.operatingMargins || null;
        detail.return_on_equity = fData.returnOnEquity || null;
        detail.debt_to_equity = fData.debtToEquity || null;
        detail.free_cash_flow = fData.freeCashflow || null;
        detail.target_mean_price = fData.targetMeanPrice || null;
        detail.recommendation = fData.recommendationKey || null;
        detail.total_cash = fData.totalCash || null;
        detail.total_debt = fData.totalDebt || null;
      }

      return detail;
    } catch (error) {
      console.error(`❌ Error fetching detail for ${symbol}:`, error.message);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  GLOBAL INDICES
  // ═══════════════════════════════════════════════════════════

  /**
   * Get all global market indices
   */
  async getGlobalIndices() {
    const cacheKey = "global_indices";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log("🌍 Fetching global indices from Yahoo Finance...");
      const yahooSymbols = Object.keys(this.globalIndices);
      const results = await this.fetchQuotes(yahooSymbols);

      const indices = results
        .filter((r) => r.data)
        .map((r) => {
          const meta = this.globalIndices[r.yahooSymbol];
          return this.mapQuoteToStandard(r.data, meta);
        });

      console.log(`✅ Fetched ${indices.length} global indices`);
      cache.set(cacheKey, indices, 30); // 30 second cache for global
      return indices;
    } catch (error) {
      console.error("❌ Error fetching global indices:", error.message);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  INDIAN INDICES (NSE Broad + Sectoral + GIFT India)
  // ═══════════════════════════════════════════════════════════

  /**
   * Get all Indian market indices: NSE broad market, sectoral, BSE, and
   * appends static GIFT India (NSE IFSC) info using NIFTY 50 as the proxy value.
   */
  async getIndianIndices() {
    const cacheKey = "indian_indices";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log("🇮🇳 Fetching Indian indices from Yahoo Finance...");
      const yahooSymbols = Object.keys(this.indianIndices);
      const results = await this.fetchQuotes(yahooSymbols);

      const indices = results
        .filter((r) => r.data)
        .map((r) => {
          const meta = this.indianIndices[r.yahooSymbol];
          return {
            ...this.mapQuoteToStandard(r.data, meta),
            category: meta.category,
          };
        });

      // Append static GIFT India / NSE IFSC section
      // GIFT NIFTY (NSE IFSC) mirrors NIFTY 50; use live NIFTY 50 price as proxy
      const nifty = indices.find((i) => i.symbol === "NIFTY");
      const giftIndices = [
        {
          symbol: "GIFTNIFTY",
          name: "GIFT NIFTY 50 (NSE IFSC)",
          country: "India",
          exchange: "NSE IFSC",
          category: "GIFT India",
          current_value: nifty ? nifty.current_value : 0,
          change: nifty ? nifty.change : 0,
          change_percent: nifty ? nifty.change_percent : 0,
          previous_close: nifty ? nifty.previous_close : 0,
          open: nifty ? nifty.open : 0,
          high: nifty ? nifty.high : 0,
          low: nifty ? nifty.low : 0,
          volume: 0,
          currency: "USD",
          last_updated: new Date().toISOString(),
          note: "GIFT NIFTY 50 Futures — NSE IFSC, GIFT City. USD-denominated. Value mirrors NIFTY 50.",
        },
        {
          symbol: "GIFTBANKNIFTY",
          name: "GIFT Bank Nifty (NSE IFSC)",
          country: "India",
          exchange: "NSE IFSC",
          category: "GIFT India",
          current_value: indices.find((i) => i.symbol === "BANKNIFTY")?.current_value ?? 0,
          change: indices.find((i) => i.symbol === "BANKNIFTY")?.change ?? 0,
          change_percent: indices.find((i) => i.symbol === "BANKNIFTY")?.change_percent ?? 0,
          previous_close: indices.find((i) => i.symbol === "BANKNIFTY")?.previous_close ?? 0,
          open: indices.find((i) => i.symbol === "BANKNIFTY")?.open ?? 0,
          high: indices.find((i) => i.symbol === "BANKNIFTY")?.high ?? 0,
          low: indices.find((i) => i.symbol === "BANKNIFTY")?.low ?? 0,
          volume: 0,
          currency: "USD",
          last_updated: new Date().toISOString(),
          note: "Bank Nifty Futures — NSE IFSC, GIFT City. USD-denominated.",
        },
      ];

      const all = [...indices, ...giftIndices];
      console.log(`✅ Fetched ${all.length} Indian indices`);
      cache.set(cacheKey, all, 30);
      return all;
    } catch (error) {
      console.error("❌ Error fetching Indian indices:", error.message);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  COMMODITIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Get all commodities (Gold, Silver, Oil, etc.)
   */
  async getCommodities() {
    const cacheKey = "commodities";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log("🥇 Fetching commodities from Yahoo Finance...");
      const yahooSymbols = Object.keys(this.commodities);
      const results = await this.fetchQuotes(yahooSymbols);

      const items = results
        .filter((r) => r.data)
        .map((r) => {
          const meta = this.commodities[r.yahooSymbol];
          const standard = this.mapQuoteToStandard(r.data, meta);
          return {
            ...standard,
            category: meta.category,
            unit: meta.unit,
          };
        });

      console.log(`✅ Fetched ${items.length} commodities`);
      cache.set(cacheKey, items, 60); // 1 minute cache for commodities
      return items;
    } catch (error) {
      console.error("❌ Error fetching commodities:", error.message);
      throw error;
    }
  }

  /**
   * Get commodities by category
   */
  async getCommoditiesByCategory(category) {
    const all = await this.getCommodities();
    return all.filter(
      (c) => c.category.toLowerCase() === category.toLowerCase(),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  BONDS & TREASURY
  // ═══════════════════════════════════════════════════════════

  /**
   * Get bond/treasury yield data
   */
  async getBonds() {
    const cacheKey = "bonds";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log("💎 Fetching bond yields from Yahoo Finance...");
      const yahooSymbols = Object.keys(this.bonds);
      const results = await this.fetchQuotes(yahooSymbols);

      const items = results
        .filter((r) => r.data)
        .map((r) => {
          const meta = this.bonds[r.yahooSymbol];
          const standard = this.mapQuoteToStandard(r.data, meta);
          return {
            ...standard,
            category: meta.category,
            maturity: meta.maturity,
            yield_value: r.data.regularMarketPrice,
          };
        });

      console.log(`✅ Fetched ${items.length} bonds`);
      cache.set(cacheKey, items, 300); // 5 minute cache for bonds
      return items;
    } catch (error) {
      console.error("❌ Error fetching bonds:", error.message);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  CURRENCIES / FOREX
  // ═══════════════════════════════════════════════════════════

  /**
   * Get currency exchange rates
   */
  async getCurrencies() {
    const cacheKey = "currencies";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log("💱 Fetching currency rates from Yahoo Finance...");
      const yahooSymbols = Object.keys(this.currencies);
      const results = await this.fetchQuotes(yahooSymbols);

      const items = results
        .filter((r) => r.data)
        .map((r) => {
          const meta = this.currencies[r.yahooSymbol];
          return {
            ...this.mapQuoteToStandard(r.data, meta),
            base: meta.base,
            quote_currency: meta.quote,
          };
        });

      cache.set(cacheKey, items, 30);
      return items;
    } catch (error) {
      console.error("❌ Error fetching currencies:", error.message);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  HISTORICAL DATA (Charts)
  // ═══════════════════════════════════════════════════════════

  /**
   * Get historical data for charting
   * @param {string} symbol - Yahoo Finance symbol
   * @param {string} period - 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max
   * @param {string} interval - 1m, 5m, 15m, 1d, 1wk, 1mo
   */
  async getHistoricalData(symbol, period = "1mo", interval = "1d") {
    const cacheKey = `history_${symbol}_${period}_${interval}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await yahooFinance.chart(symbol, {
        period1: this._getPeriodStartDate(period),
        interval: interval,
      });

      const data = (result.quotes || []).map((q) => ({
        date: q.date,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume,
      }));

      const ttl = period === "1d" ? 60 : 300; // 1min for intraday, 5min for others
      cache.set(cacheKey, data, ttl);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching history for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Convert period string to Date
   */
  _getPeriodStartDate(period) {
    const now = new Date();
    switch (period) {
      case "1d":
        return new Date(now.setDate(now.getDate() - 1));
      case "5d":
        return new Date(now.setDate(now.getDate() - 5));
      case "1mo":
        return new Date(now.setMonth(now.getMonth() - 1));
      case "3mo":
        return new Date(now.setMonth(now.getMonth() - 3));
      case "6mo":
        return new Date(now.setMonth(now.getMonth() - 6));
      case "1y":
        return new Date(now.setFullYear(now.getFullYear() - 1));
      case "5y":
        return new Date(now.setFullYear(now.getFullYear() - 5));
      case "max":
        return new Date("2000-01-01");
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  MARKET STATUS
  // ═══════════════════════════════════════════════════════════

  /**
   * Check if US market is currently open
   */
  isUSMarketOpen() {
    const now = new Date();
    const estTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" }),
    );
    const day = estTime.getDay();
    if (day === 0 || day === 6) return false;

    const hours = estTime.getHours();
    const minutes = estTime.getMinutes();
    const currentTime = hours * 60 + minutes;
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM

    return currentTime >= marketOpen && currentTime <= marketClose;
  }
}

export default new YahooFinanceService();
