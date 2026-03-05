/**
 * Watchlist API Service
 * Full CRUD for user watchlists with item management
 * Connects to: /api/v1/watchlists/*
 */

import apiService from "../common/apiService";

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  symbol: string;
  name: string;
  asset_class: string;
  exchange: string | null;
  notes: string | null;
  target_price: number | null;
  alert_above: number | null;
  alert_below: number | null;
  added_at: string;
  watchlist_name?: string;
  watchlist_color?: string;
}

export interface WatchlistData {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  is_default: boolean;
  item_count?: number;
  items?: WatchlistItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateWatchlistPayload {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface AddItemPayload {
  symbol: string;
  name?: string;
  asset_class: string;
  exchange?: string;
  notes?: string;
  target_price?: number;
  alert_above?: number;
  alert_below?: number;
}

class WatchlistService {
  async getWatchlists() {
    return apiService.get<WatchlistData[]>("/watchlists");
  }

  async getWatchlistById(id: string) {
    return apiService.get<WatchlistData>(`/watchlists/${id}`);
  }

  async createWatchlist(data: CreateWatchlistPayload) {
    return apiService.post<WatchlistData>("/watchlists", data);
  }

  async updateWatchlist(id: string, data: Partial<CreateWatchlistPayload>) {
    return apiService.put<WatchlistData>(`/watchlists/${id}`, data);
  }

  async deleteWatchlist(id: string) {
    return apiService.delete(`/watchlists/${id}`);
  }

  async addItem(watchlistId: string, data: AddItemPayload) {
    return apiService.post<WatchlistItem>(
      `/watchlists/${watchlistId}/items`,
      data,
    );
  }

  async removeItem(watchlistId: string, itemId: string) {
    return apiService.delete(`/watchlists/${watchlistId}/items/${itemId}`);
  }

  async getAllItems() {
    return apiService.get<WatchlistItem[]>("/watchlists/items/all");
  }

  async checkInWatchlist(symbol: string, assetClass: string) {
    return apiService.get<{
      isInWatchlist: boolean;
      watchlists: {
        id: string;
        watchlist_id: string;
        watchlist_name: string;
      }[];
    }>(`/watchlists/check/${symbol}/${assetClass}`);
  }
}

export default new WatchlistService();
