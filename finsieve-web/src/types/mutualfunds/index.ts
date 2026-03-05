// Mutual Funds Types

import type { Instrument } from "../common";

export interface MutualFund extends Instrument {
  amcName: string;
  fundCategory: string;
  fundSubCategory: string;
  riskLevel: "Low" | "Moderate" | "High" | "Very High";
  aum: number;
  expenseRatio: number;
  exitLoad?: string;
  minInvestment: number;
  minSipAmount: number;
  launchDate: Date;
  benchmarkIndex: string;
  fundManager: string;
}

export interface MutualFundReturns {
  fundId: string;
  currentNav: number;
  return1D: number;
  return1W: number;
  return1M: number;
  return3M: number;
  return6M: number;
  return1Y: number;
  return3Y: number;
  return5Y: number;
  return10Y: number;
  returnAll: number;
  cagr3Y: number;
  cagr5Y: number;
  volatility3Y: number;
  sharpeRatio3Y: number;
  alpha: number;
  beta: number;
}

export interface MutualFundHolding {
  fundId: string;
  holdings: {
    name: string;
    percentage: number;
  }[];
  sectorAllocation: {
    sector: string;
    percentage: number;
  }[];
  assetAllocation: {
    assetType: string;
    percentage: number;
  }[];
}

export interface MutualFundScreeningParams {
  categories?: string[];
  subCategories?: string[];
  riskLevels?: string[];
  return1YMin?: number;
  return3YMin?: number;
  expenseRatioMax?: number;
  aumMin?: number;
  sharpeRatio3YMin?: number;
}
