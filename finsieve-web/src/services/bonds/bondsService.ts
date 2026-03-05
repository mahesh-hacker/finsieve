/**
 * Bonds & Treasury API Service
 * Connects to: /api/v1/bonds/*
 */

import apiService from "../common/apiService";

export interface Bond {
  symbol: string;
  name: string;
  current_value: number;
  change: number;
  change_percent: number;
  previous_close: number;
  category: string;
  maturity: string;
  yield_value: number;
  last_updated: string;
}

export interface YieldCurvePoint {
  maturity: string;
  yield_value: number;
  name: string;
  change: number;
  change_percent: number;
}

export interface YieldCurveData {
  curve: YieldCurvePoint[];
  isInverted: boolean;
  spread_2_10: number | null;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class BondsService {
  async getAllBonds() {
    return apiService.get<Bond[]>("/bonds");
  }

  async getYieldCurve() {
    return apiService.get<YieldCurveData>("/bonds/yield-curve");
  }

  async getBondHistory(symbol: string, period = "1y", interval = "1d") {
    return apiService.get<HistoricalDataPoint[]>(`/bonds/${symbol}/history`, {
      params: { period, interval },
    });
  }
}

export default new BondsService();
