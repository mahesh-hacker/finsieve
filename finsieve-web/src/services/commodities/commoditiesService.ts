/**
 * Commodities API Service
 * Connects to: /api/v1/commodities/*
 */

import apiService from "../common/apiService";

export interface Commodity {
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
  category: string;
  unit: string;
  currency: string;
  last_updated: string;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class CommoditiesService {
  async getAllCommodities() {
    return apiService.get<Commodity[]>("/commodities");
  }

  async getCommoditiesByCategory(category: string) {
    return apiService.get<Commodity[]>(`/commodities/category/${category}`);
  }

  async getCommodityHistory(symbol: string, period = "1mo", interval = "1d") {
    return apiService.get<HistoricalDataPoint[]>(
      `/commodities/${symbol}/history`,
      { params: { period, interval } },
    );
  }
}

export default new CommoditiesService();
