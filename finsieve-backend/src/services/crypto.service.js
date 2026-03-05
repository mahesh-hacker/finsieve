/**
 * Crypto Market Data Service
 * Uses CoinGecko FREE API - 10,000+ cryptocurrencies
 * Rate limit: 30 calls/min (free tier)
 * No API key required for basic usage
 */

import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 15, checkperiod: 20 });

class CryptoService {
  constructor() {
    this.baseURL = "https://api.coingecko.com/api/v3";
    this.headers = {
      Accept: "application/json",
    };

    // Top cryptos by market cap (CoinGecko IDs)
    this.topCryptoIds = [
      "bitcoin",
      "ethereum",
      "tether",
      "binancecoin",
      "solana",
      "xrp",
      "usd-coin",
      "cardano",
      "avalanche-2",
      "dogecoin",
      "polkadot",
      "chainlink",
      "tron",
      "matic-network",
      "shiba-inu",
      "litecoin",
      "uniswap",
      "dai",
      "bitcoin-cash",
      "stellar",
      "monero",
      "ethereum-classic",
      "cosmos",
      "hedera-hashgraph",
      "filecoin",
      "near",
      "aptos",
      "sui",
      "arbitrum",
      "optimism",
    ];
  }

  /**
   * Get top cryptocurrencies by market cap
   * @param {number} limit - Number of results (max 250)
   * @param {string} vsCurrency - Currency to compare (usd, inr, eur)
   */
  async getTopCryptos(limit = 50, vsCurrency = "usd") {
    const cacheKey = `top_cryptos_${vsCurrency}_${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log(`💰 Fetching top ${limit} cryptocurrencies...`);

      const response = await axios.get(`${this.baseURL}/coins/markets`, {
        headers: this.headers,
        params: {
          vs_currency: vsCurrency,
          order: "market_cap_desc",
          per_page: Math.min(limit, 250),
          page: 1,
          sparkline: true,
          price_change_percentage: "1h,24h,7d,30d",
        },
        timeout: 15000,
      });

      const cryptos = response.data.map((coin) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        current_value: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        total_volume: coin.total_volume,
        change: coin.price_change_24h,
        change_percent: coin.price_change_percentage_24h,
        change_1h: coin.price_change_percentage_1h_in_currency,
        change_7d: coin.price_change_percentage_7d_in_currency,
        change_30d: coin.price_change_percentage_30d_in_currency,
        circulating_supply: coin.circulating_supply,
        total_supply: coin.total_supply,
        max_supply: coin.max_supply,
        ath: coin.ath,
        ath_change_percent: coin.ath_change_percentage,
        ath_date: coin.ath_date,
        atl: coin.atl,
        atl_change_percent: coin.atl_change_percentage,
        atl_date: coin.atl_date,
        high_24h: coin.high_24h,
        low_24h: coin.low_24h,
        sparkline_7d: coin.sparkline_in_7d?.price || [],
        currency: vsCurrency.toUpperCase(),
        last_updated: coin.last_updated,
      }));

      console.log(`✅ Fetched ${cryptos.length} cryptocurrencies`);
      cache.set(cacheKey, cryptos, 15); // 15 second cache
      return cryptos;
    } catch (error) {
      console.error("❌ Error fetching cryptos:", error.message);
      if (error.response?.status === 429) {
        console.error("⚠️ Rate limit hit. Returning cached data if available.");
        const staleCache = cache.get(cacheKey);
        if (staleCache) return staleCache;
      }
      throw error;
    }
  }

  /**
   * Get detailed data for a single cryptocurrency
   */
  async getCryptoDetail(coinId) {
    const cacheKey = `crypto_detail_${coinId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log(`💰 Fetching detail for ${coinId}...`);

      const response = await axios.get(`${this.baseURL}/coins/${coinId}`, {
        headers: this.headers,
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: true,
          developer_data: false,
          sparkline: true,
        },
        timeout: 15000,
      });

      const coin = response.data;
      const marketData = coin.market_data;

      const detail = {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image?.large || coin.image?.small,
        description: coin.description?.en?.substring(0, 500) || "",
        categories: coin.categories || [],
        links: {
          homepage: coin.links?.homepage?.[0] || null,
          blockchain_site: coin.links?.blockchain_site?.[0] || null,
          subreddit: coin.links?.subreddit_url || null,
          twitter: coin.links?.twitter_screen_name || null,
          github: coin.links?.repos_url?.github?.[0] || null,
        },

        // Market Data
        current_value: marketData?.current_price?.usd || 0,
        current_value_inr: marketData?.current_price?.inr || 0,
        market_cap: marketData?.market_cap?.usd || 0,
        market_cap_rank: coin.market_cap_rank,
        total_volume: marketData?.total_volume?.usd || 0,
        fully_diluted_valuation:
          marketData?.fully_diluted_valuation?.usd || null,

        // Price Changes
        change_24h: marketData?.price_change_24h || 0,
        change_percent_24h: marketData?.price_change_percentage_24h || 0,
        change_percent_7d: marketData?.price_change_percentage_7d || 0,
        change_percent_30d: marketData?.price_change_percentage_30d || 0,
        change_percent_1y: marketData?.price_change_percentage_1y || 0,

        // Highs & Lows
        high_24h: marketData?.high_24h?.usd || 0,
        low_24h: marketData?.low_24h?.usd || 0,
        ath: marketData?.ath?.usd || 0,
        ath_change: marketData?.ath_change_percentage?.usd || 0,
        ath_date: marketData?.ath_date?.usd || null,
        atl: marketData?.atl?.usd || 0,
        atl_change: marketData?.atl_change_percentage?.usd || 0,

        // Supply
        circulating_supply: marketData?.circulating_supply || 0,
        total_supply: marketData?.total_supply || null,
        max_supply: marketData?.max_supply || null,

        // Community
        twitter_followers: coin.community_data?.twitter_followers || 0,
        reddit_subscribers: coin.community_data?.reddit_subscribers || 0,

        // Sparkline
        sparkline_7d: marketData?.sparkline_7d?.price || [],

        genesis_date: coin.genesis_date,
        sentiment_up: coin.sentiment_votes_up_percentage,
        sentiment_down: coin.sentiment_votes_down_percentage,

        last_updated: coin.last_updated,
      };

      cache.set(cacheKey, detail, 30);
      return detail;
    } catch (error) {
      console.error(
        `❌ Error fetching crypto detail for ${coinId}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Search cryptocurrencies
   */
  async searchCrypto(queryStr) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        headers: this.headers,
        params: { query: queryStr },
        timeout: 10000,
      });

      return (response.data.coins || []).slice(0, 20).map((coin) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.large || coin.thumb,
        market_cap_rank: coin.market_cap_rank,
      }));
    } catch (error) {
      console.error("❌ Crypto search error:", error.message);
      return [];
    }
  }

  /**
   * Get crypto market overview (total market cap, BTC dominance, etc.)
   */
  async getMarketOverview() {
    const cacheKey = "crypto_market_overview";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseURL}/global`, {
        headers: this.headers,
        timeout: 10000,
      });

      const data = response.data.data;

      const overview = {
        total_market_cap: data.total_market_cap?.usd || 0,
        total_volume: data.total_volume?.usd || 0,
        market_cap_change_24h: data.market_cap_change_percentage_24h_usd || 0,
        btc_dominance: data.market_cap_percentage?.btc || 0,
        eth_dominance: data.market_cap_percentage?.eth || 0,
        active_cryptocurrencies: data.active_cryptocurrencies || 0,
        markets: data.markets || 0,
        last_updated: new Date().toISOString(),
      };

      cache.set(cacheKey, overview, 30);
      return overview;
    } catch (error) {
      console.error("❌ Error fetching crypto market overview:", error.message);
      throw error;
    }
  }

  /**
   * Get historical chart data for a crypto
   * @param {string} coinId - CoinGecko coin ID
   * @param {string} days - 1, 7, 14, 30, 90, 180, 365, max
   * @param {string} vsCurrency - usd, inr, etc.
   */
  async getCryptoChart(coinId, days = "7", vsCurrency = "usd") {
    const cacheKey = `crypto_chart_${coinId}_${days}_${vsCurrency}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${this.baseURL}/coins/${coinId}/market_chart`,
        {
          headers: this.headers,
          params: {
            vs_currency: vsCurrency,
            days: days,
          },
          timeout: 15000,
        },
      );

      const chartData = {
        prices: (response.data.prices || []).map(([timestamp, price]) => ({
          date: new Date(timestamp).toISOString(),
          value: price,
        })),
        volumes: (response.data.total_volumes || []).map(
          ([timestamp, volume]) => ({
            date: new Date(timestamp).toISOString(),
            value: volume,
          }),
        ),
        market_caps: (response.data.market_caps || []).map(
          ([timestamp, cap]) => ({
            date: new Date(timestamp).toISOString(),
            value: cap,
          }),
        ),
      };

      const ttl = days === "1" ? 60 : 300;
      cache.set(cacheKey, chartData, ttl);
      return chartData;
    } catch (error) {
      console.error(`❌ Error fetching chart for ${coinId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get trending cryptocurrencies
   */
  async getTrending() {
    const cacheKey = "crypto_trending";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseURL}/search/trending`, {
        headers: this.headers,
        timeout: 10000,
      });

      const trending = (response.data.coins || []).map((item) => ({
        id: item.item.id,
        symbol: item.item.symbol.toUpperCase(),
        name: item.item.name,
        image: item.item.large || item.item.small,
        market_cap_rank: item.item.market_cap_rank,
        price_btc: item.item.price_btc,
        score: item.item.score,
      }));

      cache.set(cacheKey, trending, 300); // 5 min cache for trending
      return trending;
    } catch (error) {
      console.error("❌ Error fetching trending cryptos:", error.message);
      throw error;
    }
  }
}

export default new CryptoService();
