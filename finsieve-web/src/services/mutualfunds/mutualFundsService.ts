/**
 * Mutual Funds API Service
 * Connects to: /api/v1/mutual-funds/*
 */

import apiService from "../common/apiService";

export interface MutualFund {
  scheme_code: string;
  scheme_name: string;
  fund_house: string;
  scheme_type: string;
  scheme_category: string;
  nav: number;
  previous_nav: number;
  change: number;
  change_percent: number;
  nav_date: string | null;
  previous_date: string | null;
  last_updated: string;
}

export interface MutualFundHistory {
  meta: {
    scheme_code: string;
    scheme_name: string;
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
  };
  data: { date: string; nav: number }[];
}

export interface MutualFundReturns {
  scheme_code: string;
  scheme_name: string;
  current_nav: number;
  returns: Record<string, { absolute: number; cagr?: number }>;
}

export interface MutualFundSearchResult {
  scheme_code: string;
  scheme_name: string;
}

class MutualFundsService {
  async getPopularFunds() {
    return apiService.get<MutualFund[]>("/mutual-funds");
  }

  async searchFunds(query: string) {
    return apiService.get<MutualFundSearchResult[]>("/mutual-funds/search", {
      params: { q: query },
    });
  }

  async getFundDetail(schemeCode: string) {
    return apiService.get<MutualFund>(`/mutual-funds/${schemeCode}`);
  }

  async getFundHistory(schemeCode: string) {
    return apiService.get<MutualFundHistory>(
      `/mutual-funds/${schemeCode}/history`,
    );
  }

  async getFundReturns(schemeCode: string) {
    return apiService.get<MutualFundReturns>(
      `/mutual-funds/${schemeCode}/returns`,
    );
  }
}

export default new MutualFundsService();
