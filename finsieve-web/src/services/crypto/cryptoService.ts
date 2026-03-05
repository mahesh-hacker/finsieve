/**
 * Crypto Market API Service
 * Connects to: /api/v1/crypto/*
 */

import apiService from "../common/apiService";

export interface Crypto {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_value: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  change: number;
  change_percent: number;
  change_1h: number | null;
  change_7d: number | null;
  change_30d: number | null;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percent: number;
  ath_date: string;
  high_24h: number;
  low_24h: number;
  sparkline_7d: number[];
  currency: string;
  last_updated: string;
}

export interface CryptoDetail extends Crypto {
  description: string;
  categories: string[];
  current_value_inr: number;
  fully_diluted_valuation: number | null;
  change_percent_24h: number;
  change_percent_7d: number;
  change_percent_30d: number;
  change_percent_1y: number;
  atl: number;
  atl_change: number;
  twitter_followers: number;
  reddit_subscribers: number;
  genesis_date: string | null;
  sentiment_up: number;
  sentiment_down: number;
  links: {
    homepage: string | null;
    blockchain_site: string | null;
    subreddit: string | null;
    twitter: string | null;
    github: string | null;
  };
}

export interface CryptoOverview {
  total_market_cap: number;
  total_volume: number;
  market_cap_change_24h: number;
  btc_dominance: number;
  eth_dominance: number;
  active_cryptocurrencies: number;
  markets: number;
  last_updated: string;
}

export interface CryptoChartData {
  prices: { date: string; value: number }[];
  volumes: { date: string; value: number }[];
  market_caps: { date: string; value: number }[];
}

export interface TrendingCrypto {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap_rank: number;
  price_btc: number;
  score: number;
}

class CryptoService {
  async getTopCryptos(limit = 50, currency = "usd") {
    return apiService.get<Crypto[]>("/crypto", { params: { limit, currency } });
  }

  async getCryptoDetail(coinId: string) {
    return apiService.get<CryptoDetail>(`/crypto/${coinId}`);
  }

  async getMarketOverview() {
    return apiService.get<CryptoOverview>("/crypto/overview");
  }

  async getTrending() {
    return apiService.get<TrendingCrypto[]>("/crypto/trending");
  }

  async searchCrypto(query: string) {
    return apiService.get("/crypto/search", { params: { q: query } });
  }

  async getCryptoChart(coinId: string, days = "7", currency = "usd") {
    return apiService.get<CryptoChartData>(`/crypto/${coinId}/chart`, {
      params: { days, currency },
    });
  }
}

export default new CryptoService();
