/**
 * Global Indices API Service
 * Connects to: /api/v1/global-indices/*
 */

import apiService from "../common/apiService";

export interface GlobalIndex {
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
  currency: string;
  last_updated: string;
}

export interface CurrencyRate {
  symbol: string;
  name: string;
  current_value: number;
  change: number;
  change_percent: number;
  base: string;
  quote_currency: string;
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

class GlobalIndicesService {
  async getAllIndices() {
    return apiService.get<GlobalIndex[]>("/global-indices");
  }

  async getIndicesByCountry(country: string) {
    return apiService.get<GlobalIndex[]>("/global-indices", {
      params: { country },
    });
  }

  async getIndicesByRegion(region: string) {
    return apiService.get<GlobalIndex[]>(`/global-indices/region/${region}`);
  }

  async getIndexHistory(symbol: string, period = "1mo", interval = "1d") {
    return apiService.get<HistoricalDataPoint[]>(
      `/global-indices/${symbol}/history`,
      { params: { period, interval } },
    );
  }

  async getCurrencies() {
    return apiService.get<CurrencyRate[]>("/global-indices/currencies");
  }
}

export default new GlobalIndicesService();
