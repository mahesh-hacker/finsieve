// Indian & US Equities Types

import type { Instrument } from "../common";

export interface Equity extends Instrument {
  previousClose: number;
  week52High: number;
  week52Low: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  eps?: number;
  beta?: number;
  volatility30d?: number;
  volatility1y?: number;
}

export interface EquityFundamentals {
  instrumentId: string;
  revenue: number;
  revenueGrowthYoY: number;
  profit: number;
  profitGrowthYoY: number;
  roe: number;
  roce: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
}

export interface EquityPerformance {
  instrumentId: string;
  return1D: number;
  return1W: number;
  return1M: number;
  return3M: number;
  return6M: number;
  return1Y: number;
  return3Y: number;
  return5Y: number;
}

export interface EquityScreeningParams {
  // Valuation
  marketCapMin?: number;
  marketCapMax?: number;
  peRatioMin?: number;
  peRatioMax?: number;
  pbRatioMin?: number;
  pbRatioMax?: number;
  dividendYieldMin?: number;
  dividendYieldMax?: number;

  // Performance
  return1YMin?: number;
  return1YMax?: number;

  // Fundamentals
  roeMin?: number;
  debtToEquityMax?: number;

  // Classification
  sectors?: string[];
  industries?: string[];
  exchanges?: string[];
  marketCapCategory?: ("large" | "mid" | "small")[];
}
