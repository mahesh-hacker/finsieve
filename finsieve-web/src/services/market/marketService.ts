import apiService from "../common/apiService";
import { ApiResponse } from "../../types/common";

export interface GlobalIndex {
  id: string;
  symbol: string;
  name: string;
  country: string;
  current_value: string | number;
  change: string | number;
  change_percent: string | number;
  previous_close: string | number | null;
  open: string | number | null;
  high: string | number | null;
  low: string | number | null;
  last_updated: string;
}

export interface GlobalIndicesResponse {
  data: GlobalIndex[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

class MarketService {
  async getGlobalIndices(params?: {
    country?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<GlobalIndicesResponse>> {
    return apiService.get("/market/indices", { params });
  }

  async getMajorIndices(): Promise<ApiResponse<GlobalIndex[]>> {
    return apiService.get("/market/indices/major");
  }

  async getIndexBySymbol(symbol: string): Promise<ApiResponse<GlobalIndex>> {
    return apiService.get(`/market/indices/${symbol}`);
  }

  async getIndicesByCountry(
    country: string,
  ): Promise<ApiResponse<GlobalIndex[]>> {
    return apiService.get(`/market/indices/country/${country}`);
  }

  async getMarketStatus(): Promise<
    ApiResponse<{
      status: Record<string, { isOpen: boolean; timezone: string }>;
      openMarkets: string[];
      timestamp: string;
    }>
  > {
    return apiService.get("/market/status");
  }
}

export default new MarketService();
