/**
 * US Market API Service
 * Connects to: /api/v1/us/*
 */

import apiService from "../common/apiService";

export interface USStock {
  symbol: string;
  name: string;
  current_value: number;
  change: number;
  change_percent: number;
  previous_close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  market_cap: number;
  pe_ratio: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  avg_volume: number;
  currency: string;
  exchange: string;
  sector: string | null;
  last_updated: string;
}

export interface USIndex {
  symbol: string;
  name: string;
  current_value: number;
  change: number;
  change_percent: number;
  previous_close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  country: string;
  exchange: string;
  last_updated: string;
}

export interface StockDetail extends USStock {
  forward_pe: number | null;
  eps: number | null;
  dividend_yield: number | null;
  beta: number | null;
  price_to_book: number | null;
  revenue: number | null;
  profit_margin: number | null;
  operating_margin: number | null;
  return_on_equity: number | null;
  debt_to_equity: number | null;
  free_cash_flow: number | null;
  target_mean_price: number | null;
  recommendation: string | null;
  total_cash: number | null;
  total_debt: number | null;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class USMarketService {
  async getUSIndices() {
    return apiService.get<USIndex[]>("/us/indices");
  }

  async getTopUSStocks() {
    return apiService.get<USStock[]>("/us/stocks");
  }

  async searchStocks(query: string) {
    return apiService.get<SearchResult[]>("/us/search", {
      params: { q: query },
    });
  }

  async getStockDetail(symbol: string) {
    return apiService.get<StockDetail>(`/us/stocks/${symbol}`);
  }

  async getStockHistory(symbol: string, period = "1mo", interval = "1d") {
    return apiService.get<HistoricalDataPoint[]>(
      `/us/stocks/${symbol}/history`,
      { params: { period, interval } },
    );
  }

  async getMarketStatus() {
    return apiService.get("/us/status");
  }
}

export default new USMarketService();
