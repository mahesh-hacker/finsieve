/**
 * Crypto Market Data Service
 * Primary: CoinGecko (supports optional COINGECKO_API_KEY env var for Demo tier)
 * Fallback: CoinPaprika (completely free, no API key, 25k calls/day)
 * Last resort: Static curated data so the page never goes blank
 */

import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 15, checkperiod: 20 });

// CoinGecko logo CDN — used in fallback static data
const CG_IMG = (id) =>
  `https://assets.coingecko.com/coins/images`;

// Static fallback — realistic approximate prices (updated periodically in code)
const STATIC_CRYPTOS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", rank: 1, price: 97000, cap: 1920000000000, vol: 38000000000, circ: 19700000, chg24: 1.2, chg7d: 3.1, chg1h: 0.2, img: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", rank: 2, price: 3800, cap: 457000000000, vol: 18000000000, circ: 120000000, chg24: 2.1, chg7d: 5.2, chg1h: 0.4, img: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  { id: "tether", symbol: "USDT", name: "Tether", rank: 3, price: 1.0, cap: 140000000000, vol: 80000000000, circ: 140000000000, chg24: 0.0, chg7d: 0.0, chg1h: 0.0, img: "https://assets.coingecko.com/coins/images/325/large/Tether.png" },
  { id: "binancecoin", symbol: "BNB", name: "BNB", rank: 4, price: 680, cap: 99000000000, vol: 2200000000, circ: 145000000, chg24: 0.8, chg7d: 2.4, chg1h: 0.1, img: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png" },
  { id: "solana", symbol: "SOL", name: "Solana", rank: 5, price: 195, cap: 92000000000, vol: 4500000000, circ: 470000000, chg24: 3.4, chg7d: 8.1, chg1h: 0.6, img: "https://assets.coingecko.com/coins/images/4128/large/solana.png" },
  { id: "xrp", symbol: "XRP", name: "XRP", rank: 6, price: 2.4, cap: 138000000000, vol: 7000000000, circ: 57000000000, chg24: -0.5, chg7d: 1.2, chg1h: -0.1, img: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png" },
  { id: "usd-coin", symbol: "USDC", name: "USD Coin", rank: 7, price: 1.0, cap: 45000000000, vol: 9000000000, circ: 45000000000, chg24: 0.0, chg7d: 0.0, chg1h: 0.0, img: "https://assets.coingecko.com/coins/images/6319/large/usdc.png" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", rank: 8, price: 0.38, cap: 55000000000, vol: 2800000000, circ: 145000000000, chg24: 1.5, chg7d: 4.2, chg1h: 0.3, img: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png" },
  { id: "cardano", symbol: "ADA", name: "Cardano", rank: 9, price: 0.95, cap: 33000000000, vol: 900000000, circ: 35000000000, chg24: 0.7, chg7d: 2.1, chg1h: 0.2, img: "https://assets.coingecko.com/coins/images/975/large/cardano.png" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche", rank: 10, price: 38, cap: 16000000000, vol: 700000000, circ: 420000000, chg24: 1.8, chg7d: 5.5, chg1h: 0.4, img: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png" },
  { id: "tron", symbol: "TRX", name: "TRON", rank: 11, price: 0.24, cap: 20000000000, vol: 1200000000, circ: 87000000000, chg24: 0.3, chg7d: 1.0, chg1h: 0.1, img: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", rank: 12, price: 19, cap: 12000000000, vol: 600000000, circ: 630000000, chg24: 2.2, chg7d: 6.0, chg1h: 0.5, img: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", rank: 13, price: 8.5, cap: 12000000000, vol: 400000000, circ: 1400000000, chg24: 1.1, chg7d: 3.2, chg1h: 0.2, img: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png" },
  { id: "shiba-inu", symbol: "SHIB", name: "Shiba Inu", rank: 14, price: 0.000022, cap: 13000000000, vol: 700000000, circ: 589000000000000, chg24: 1.9, chg7d: 5.0, chg1h: 0.4, img: "https://assets.coingecko.com/coins/images/11939/large/shiba.png" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin", rank: 15, price: 120, cap: 9000000000, vol: 500000000, circ: 75000000, chg24: 0.6, chg7d: 2.0, chg1h: 0.1, img: "https://assets.coingecko.com/coins/images/2/large/litecoin.png" },
  { id: "uniswap", symbol: "UNI", name: "Uniswap", rank: 16, price: 12, cap: 9000000000, vol: 300000000, circ: 750000000, chg24: 1.4, chg7d: 4.0, chg1h: 0.3, img: "https://assets.coingecko.com/coins/images/12504/large/uni.jpg" },
  { id: "dai", symbol: "DAI", name: "Dai", rank: 17, price: 1.0, cap: 7000000000, vol: 400000000, circ: 7000000000, chg24: 0.0, chg7d: 0.0, chg1h: 0.0, img: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png" },
  { id: "bitcoin-cash", symbol: "BCH", name: "Bitcoin Cash", rank: 18, price: 490, cap: 9600000000, vol: 400000000, circ: 19600000, chg24: 0.9, chg7d: 2.5, chg1h: 0.2, img: "https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png" },
  { id: "stellar", symbol: "XLM", name: "Stellar", rank: 19, price: 0.38, cap: 11000000000, vol: 400000000, circ: 29000000000, chg24: 0.5, chg7d: 1.8, chg1h: 0.1, img: "https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png" },
  { id: "monero", symbol: "XMR", name: "Monero", rank: 20, price: 220, cap: 4000000000, vol: 100000000, circ: 18400000, chg24: 0.8, chg7d: 2.2, chg1h: 0.2, img: "https://assets.coingecko.com/coins/images/69/large/monero_logo.png" },
  { id: "near", symbol: "NEAR", name: "NEAR Protocol", rank: 21, price: 7.2, cap: 8500000000, vol: 400000000, circ: 1180000000, chg24: 2.5, chg7d: 7.0, chg1h: 0.5, img: "https://assets.coingecko.com/coins/images/10365/large/near.jpg" },
  { id: "cosmos", symbol: "ATOM", name: "Cosmos", rank: 22, price: 9.5, cap: 3700000000, vol: 200000000, circ: 390000000, chg24: 1.0, chg7d: 3.0, chg1h: 0.2, img: "https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png" },
  { id: "arbitrum", symbol: "ARB", name: "Arbitrum", rank: 23, price: 1.1, cap: 2800000000, vol: 300000000, circ: 2560000000, chg24: 1.8, chg7d: 5.2, chg1h: 0.4, img: "https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg" },
  { id: "optimism", symbol: "OP", name: "Optimism", rank: 24, price: 2.2, cap: 2900000000, vol: 200000000, circ: 1320000000, chg24: 2.0, chg7d: 5.8, chg1h: 0.4, img: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png" },
  { id: "aptos", symbol: "APT", name: "Aptos", rank: 25, price: 12, cap: 5000000000, vol: 350000000, circ: 415000000, chg24: 2.8, chg7d: 7.5, chg1h: 0.6, img: "https://assets.coingecko.com/coins/images/26455/large/aptos_round.png" },
  { id: "sui", symbol: "SUI", name: "Sui", rank: 26, price: 4.5, cap: 12000000000, vol: 800000000, circ: 2700000000, chg24: 3.2, chg7d: 9.0, chg1h: 0.7, img: "https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg" },
  { id: "matic-network", symbol: "MATIC", name: "Polygon", rank: 27, price: 0.55, cap: 5400000000, vol: 350000000, circ: 9900000000, chg24: 1.2, chg7d: 3.5, chg1h: 0.2, img: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png" },
  { id: "hedera-hashgraph", symbol: "HBAR", name: "Hedera", rank: 28, price: 0.32, cap: 12000000000, vol: 600000000, circ: 37000000000, chg24: 0.9, chg7d: 2.6, chg1h: 0.2, img: "https://assets.coingecko.com/coins/images/3688/large/hbar.png" },
  { id: "ethereum-classic", symbol: "ETC", name: "Ethereum Classic", rank: 29, price: 32, cap: 4700000000, vol: 200000000, circ: 148000000, chg24: 0.7, chg7d: 2.0, chg1h: 0.1, img: "https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png" },
  { id: "filecoin", symbol: "FIL", name: "Filecoin", rank: 30, price: 5.5, cap: 3200000000, vol: 200000000, circ: 580000000, chg24: 1.5, chg7d: 4.2, chg1h: 0.3, img: "https://assets.coingecko.com/coins/images/12817/large/filecoin.png" },
].map((c) => ({
  id: c.id,
  symbol: c.symbol,
  name: c.name,
  image: c.img,
  current_value: c.price,
  market_cap: c.cap,
  market_cap_rank: c.rank,
  total_volume: c.vol,
  change: c.price * (c.chg24 / 100),
  change_percent: c.chg24,
  change_1h: c.chg1h,
  change_7d: c.chg7d,
  change_30d: c.chg7d * 3,
  circulating_supply: c.circ,
  total_supply: c.circ,
  max_supply: null,
  ath: c.price * 1.5,
  ath_change_percent: -30,
  ath_date: "2021-11-10T00:00:00Z",
  atl: c.price * 0.1,
  atl_change_percent: 900,
  atl_date: "2018-12-15T00:00:00Z",
  high_24h: c.price * 1.02,
  low_24h: c.price * 0.98,
  sparkline_7d: [],
  currency: "USD",
  last_updated: new Date().toISOString(),
}));

class CryptoService {
  constructor() {
    this.geckoURL = "https://api.coingecko.com/api/v3";
    this.paprikaURL = "https://api.coinpaprika.com/v1";
    this.geckoHeaders = {
      Accept: "application/json",
      ...(process.env.COINGECKO_API_KEY
        ? { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY }
        : {}),
    };
    // Paprika coin IDs → maps to CoinGecko-style IDs for image URLs
    this.paprikaToGecko = {
      "btc-bitcoin": "bitcoin", "eth-ethereum": "ethereum", "usdt-tether": "tether",
      "bnb-binance-coin": "binancecoin", "sol-solana": "solana", "xrp-xrp": "xrp",
      "usdc-usd-coin": "usd-coin", "doge-dogecoin": "dogecoin", "ada-cardano": "cardano",
      "avax-avalanche": "avalanche-2", "trx-tron": "tron", "link-chainlink": "chainlink",
      "dot-polkadot": "polkadot", "shib-shiba-inu": "shiba-inu", "ltc-litecoin": "litecoin",
      "uni-uniswap": "uniswap", "dai-dai": "dai", "bch-bitcoin-cash": "bitcoin-cash",
      "xlm-stellar": "stellar", "xmr-monero": "monero", "near-near-protocol": "near",
      "atom-cosmos": "cosmos", "arb-arbitrum": "arbitrum", "op-optimism": "optimism",
      "apt-aptos": "aptos", "sui-sui": "sui", "matic-polygon": "matic-network",
      "hbar-hedera-hashgraph": "hedera-hashgraph", "etc-ethereum-classic": "ethereum-classic",
      "fil-filecoin": "filecoin",
    };
  }

  _geckoImgUrl(geckoId) {
    const imgMap = {
      bitcoin: "1/large/bitcoin.png", ethereum: "279/large/ethereum.png",
      tether: "325/large/Tether.png", binancecoin: "825/large/bnb-icon2_2x.png",
      solana: "4128/large/solana.png", xrp: "44/large/xrp-symbol-white-128.png",
      "usd-coin": "6319/large/usdc.png", dogecoin: "5/large/dogecoin.png",
      cardano: "975/large/cardano.png", "avalanche-2": "12559/large/Avalanche_Circle_RedWhite_Trans.png",
      tron: "1094/large/tron-logo.png", chainlink: "877/large/chainlink-new-logo.png",
      polkadot: "12171/large/polkadot.png", "shiba-inu": "11939/large/shiba.png",
      litecoin: "2/large/litecoin.png", uniswap: "12504/large/uni.jpg",
      dai: "9956/large/Badge_Dai.png", "bitcoin-cash": "780/large/bitcoin-cash-circle.png",
      stellar: "100/large/Stellar_symbol_black_RGB.png", monero: "69/large/monero_logo.png",
      near: "10365/large/near.jpg", cosmos: "1481/large/cosmos_hub.png",
      arbitrum: "16547/large/photo_2023-03-29_21.47.00.jpeg",
      optimism: "25244/large/Optimism.png", aptos: "26455/large/aptos_round.png",
      sui: "26375/large/sui_asset.jpeg", "matic-network": "4713/large/matic-token-icon.png",
      "hedera-hashgraph": "3688/large/hbar.png",
      "ethereum-classic": "453/large/ethereum-classic-logo.png",
      filecoin: "12817/large/filecoin.png",
    };
    const path = imgMap[geckoId];
    return path ? `https://assets.coingecko.com/coins/images/${path}` : "";
  }

  /**
   * Fetch from CoinPaprika (free, no key, 25k calls/day)
   */
  async _fetchFromPaprika(limit) {
    console.log("🔄 Trying CoinPaprika fallback...");
    const response = await axios.get(`${this.paprikaURL}/tickers`, {
      params: { limit: Math.min(limit, 250) },
      timeout: 15000,
    });
    return response.data
      .slice(0, limit)
      .filter((c) => c.quotes?.USD)
      .map((c) => {
        const q = c.quotes.USD;
        const geckoId = this.paprikaToGecko[c.id] || c.id.split("-").slice(1).join("-");
        return {
          id: geckoId,
          symbol: c.symbol,
          name: c.name,
          image: this._geckoImgUrl(geckoId),
          current_value: q.price,
          market_cap: q.market_cap,
          market_cap_rank: c.rank,
          total_volume: q.volume_24h,
          change: q.price * (q.percent_change_24h / 100),
          change_percent: q.percent_change_24h,
          change_1h: q.percent_change_1h,
          change_7d: q.percent_change_7d,
          change_30d: q.percent_change_30d,
          circulating_supply: c.circulating_supply,
          total_supply: c.total_supply,
          max_supply: c.max_supply,
          ath: q.ath_price,
          ath_change_percent: q.percent_from_price_ath,
          ath_date: q.ath_date,
          atl: null,
          atl_change_percent: null,
          atl_date: null,
          high_24h: null,
          low_24h: null,
          sparkline_7d: [],
          currency: "USD",
          last_updated: c.last_updated,
        };
      });
  }

  /**
   * Map a single CoinGecko coin object to our format
   */
  _mapGeckoCoin(coin, vsCurrency) {
    return {
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
    };
  }

  /**
   * Get top cryptocurrencies by market cap
   * @param {number} limit - Number of results (up to 500 via multi-page)
   * @param {string} vsCurrency - Currency to compare (usd, inr, eur)
   */
  async getTopCryptos(limit = 50, vsCurrency = "usd") {
    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 500);
    const cacheKey = `top_cryptos_${vsCurrency}_${safeLimit}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // ── 1. Try CoinGecko (multi-page when limit > 250) ─────
    try {
      console.log(`💰 Fetching top ${safeLimit} cryptos from CoinGecko...`);
      const perPage = 250;
      const pagesNeeded = Math.ceil(safeLimit / perPage);
      let allCoins = [];

      for (let page = 1; page <= pagesNeeded; page++) {
        const response = await axios.get(`${this.geckoURL}/coins/markets`, {
          headers: this.geckoHeaders,
          params: {
            vs_currency: vsCurrency,
            order: "market_cap_desc",
            per_page: perPage,
            page,
            sparkline: true,
            price_change_percentage: "1h,24h,7d,30d",
          },
          timeout: 15000,
        });
        const mapped = (response.data || []).map((coin) =>
          this._mapGeckoCoin(coin, vsCurrency),
        );
        allCoins = allCoins.concat(mapped);
        if (mapped.length < perPage) break;
      }

      const cryptos = allCoins.slice(0, safeLimit);
      console.log(`✅ CoinGecko: fetched ${cryptos.length} cryptos`);
      cache.set(cacheKey, cryptos, 30);
      return cryptos;
    } catch (geckoErr) {
      console.warn(`⚠️ CoinGecko failed (${geckoErr.response?.status ?? geckoErr.message}), trying CoinPaprika...`);
    }

    // ── 2. Try CoinPaprika ──────────────────────────────────
    try {
      const cryptos = await this._fetchFromPaprika(safeLimit);
      console.log(`✅ CoinPaprika: fetched ${cryptos.length} cryptos`);
      cache.set(cacheKey, cryptos, 60);
      return cryptos;
    } catch (paprikaErr) {
      console.warn(`⚠️ CoinPaprika failed (${paprikaErr.message}), using static fallback`);
    }

    // ── 3. Static fallback — page never goes blank ──────────
    console.log("📋 Serving static crypto fallback data");
    const fallback = STATIC_CRYPTOS.slice(0, safeLimit);
    cache.set(cacheKey, fallback, 120);
    return fallback;
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

      const response = await axios.get(`${this.geckoURL}/coins/${coinId}`, {
        headers: this.geckoHeaders,
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
      const response = await axios.get(`${this.geckoURL}/search`, {
        headers: this.geckoHeaders,
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

    // ── 1. CoinGecko ────────────────────────────────────────
    try {
      const response = await axios.get(`${this.geckoURL}/global`, {
        headers: this.geckoHeaders,
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
      cache.set(cacheKey, overview, 60);
      return overview;
    } catch (geckoErr) {
      console.warn(`⚠️ CoinGecko global failed, trying CoinPaprika...`);
    }

    // ── 2. CoinPaprika global ────────────────────────────────
    try {
      const resp = await axios.get(`${this.paprikaURL}/global`, { timeout: 10000 });
      const d = resp.data;
      const overview = {
        total_market_cap: d.market_cap_usd || 0,
        total_volume: d.volume_24h_usd || 0,
        market_cap_change_24h: d.market_cap_change_24h || 0,
        btc_dominance: d.bitcoin_dominance_percentage || 0,
        eth_dominance: d.ethereum_dominance_percentage || 0,
        active_cryptocurrencies: d.cryptocurrencies_number || 0,
        markets: d.markets_number || 0,
        last_updated: new Date().toISOString(),
      };
      cache.set(cacheKey, overview, 120);
      return overview;
    } catch (paprikaErr) {
      console.warn("⚠️ CoinPaprika global failed, using static overview");
    }

    // ── 3. Static fallback ────────────────────────────────────
    return {
      total_market_cap: 3500000000000,
      total_volume: 120000000000,
      market_cap_change_24h: 1.2,
      btc_dominance: 52.5,
      eth_dominance: 13.1,
      active_cryptocurrencies: 10000,
      markets: 800,
      last_updated: new Date().toISOString(),
    };
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
        `${this.geckoURL}/coins/${coinId}/market_chart`,
        {
          headers: this.geckoHeaders,
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

    // ── 1. CoinGecko trending ────────────────────────────────
    try {
      const response = await axios.get(`${this.geckoURL}/search/trending`, {
        headers: this.geckoHeaders,
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
      cache.set(cacheKey, trending, 300);
      return trending;
    } catch (geckoErr) {
      console.warn(`⚠️ CoinGecko trending failed, using top-7 from static list`);
    }

    // ── 2. Fallback: top 7 from static list ─────────────────
    const trending = STATIC_CRYPTOS.slice(0, 7).map((c, i) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.image,
      market_cap_rank: c.market_cap_rank,
      price_btc: c.current_value / 97000,
      score: 6 - i,
    }));
    cache.set(cacheKey, trending, 300);
    return trending;
  }
}

export default new CryptoService();
