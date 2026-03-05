/**
 * Comparison API Service
 * Side-by-side comparison across any asset class
 * Connects to: /api/v1/comparison/*
 */

import apiService from "../common/apiService";

export interface ComparisonInstrument {
  symbol: string;
  asset_class: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  asset_class: string;
  exchange: string;
}

export interface ComparisonMetrics {
  performance: {
    best: { symbol: string; change_percent: number };
    worst: { symbol: string; change_percent: number };
    all: { symbol: string; change_percent: number }[];
  };
  valuation: Record<string, unknown>;
  summary: string[];
}

export interface ComparisonResult {
  instruments: Record<string, unknown>[];
  metrics: ComparisonMetrics;
  compared_at: string;
}

class ComparisonService {
  async compareInstruments(instruments: ComparisonInstrument[]) {
    return apiService.post<ComparisonResult>("/comparison", { instruments });
  }

  async searchForComparison(query: string) {
    return apiService.get<SearchResult[]>("/comparison/search", {
      params: { q: query },
    });
  }
}

export default new ComparisonService();
