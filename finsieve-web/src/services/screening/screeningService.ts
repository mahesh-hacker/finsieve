/**
 * Screening API Service
 * Cross-asset screening engine - the feature that kills Screener.in
 * Connects to: /api/v1/screening/*
 */

import apiService from "../common/apiService";

export interface ScreeningParam {
  field: string;
  label: string;
  type: "number" | "select";
  options?: string[];
}

export interface ScreeningFilter {
  field: string;
  operator: "eq" | "gt" | "lt" | "gte" | "lte" | "between" | "in" | "contains";
  value: string | number | string[] | number[];
}

export interface ScreeningResult {
  data: Record<string, unknown>[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  params: ScreeningParam[];
  filtersApplied: number;
}

export interface AssetClassInfo {
  key: string;
  label: string;
  icon: string;
  description: string;
}

export interface QuickScreen {
  id: string;
  name: string;
  assetClass: string;
  filters: ScreeningFilter[];
  sortBy: string;
  sortOrder: "asc" | "desc";
}

class ScreeningService {
  async getAssetClasses() {
    return apiService.get<AssetClassInfo[]>("/screening/asset-classes");
  }

  async getScreeningParams(assetClass: string) {
    return apiService.get<ScreeningParam[]>(`/screening/params/${assetClass}`);
  }

  async runScreening(params: {
    assetClass: string;
    filters?: ScreeningFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }) {
    return apiService.post<ScreeningResult>("/screening/run", params);
  }

  async getQuickScreens() {
    return apiService.get<QuickScreen[]>("/screening/quick");
  }

  async runQuickScreen(screenId: string) {
    return apiService.get<ScreeningResult>(`/screening/quick/${screenId}`);
  }

  async screenByAssetClass(
    assetClass: string,
    sortBy?: string,
    sortOrder?: string,
    limit?: number,
  ) {
    return apiService.get<ScreeningResult>(`/screening/run/${assetClass}`, {
      params: { sortBy, sortOrder, limit },
    });
  }
}

export default new ScreeningService();
