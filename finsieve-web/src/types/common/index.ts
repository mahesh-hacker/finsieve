// Common Types for Finsieve Application

export type AssetClass =
  | "EQUITY"
  | "MUTUAL_FUND"
  | "US_EQUITY"
  | "COMMODITY"
  | "BOND"
  | "CRYPTO"
  | "INDEX";

export type UserTier = "FREE" | "PREMIUM" | "ENTERPRISE";

export type Theme = "light" | "dark" | "auto";

export type Currency = "INR" | "USD";

export type ChartType = "line" | "candlestick" | "area";

export type TimeFrame =
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "1Y"
  | "3Y"
  | "5Y"
  | "10Y"
  | "ALL";

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  userTier: UserTier;
  subscriptionExpires?: Date;
  preferences: UserPreferences;
  createdAt: Date;
  lastLogin?: Date;
}

export interface UserPreferences {
  theme: Theme;
  language: "en" | "hi";
  defaultCurrency: Currency;
  defaultChartType: ChartType;
  notificationsEnabled: boolean;
}

export interface Instrument {
  instrumentId: string;
  symbol: string;
  name: string;
  isin?: string;
  assetClass: AssetClass;
  exchange?: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  currency: Currency;
  isActive: boolean;
}

export interface MarketData {
  time: Date;
  instrumentId: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover?: number;
  change: number;
  changePercent: number;
}

export interface ChartDataPoint {
  time: string | Date;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface ScreeningFilter {
  field: string;
  operator: "eq" | "gt" | "lt" | "gte" | "lte" | "between" | "in";
  value: unknown;
}

export interface ScreeningParams {
  assetClass: AssetClass;
  filters: ScreeningFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  instruments: string[]; // Array of instrument IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
