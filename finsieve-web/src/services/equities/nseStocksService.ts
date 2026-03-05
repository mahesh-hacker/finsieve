/**
 * NSE Stocks API Service
 * Handles NSE & BSE stock data
 */

import apiService from "../common/apiService";

export interface NSEStock {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  volume: number;
  marketCap: number;
  pe: number;
  yearHigh: number;
  yearLow: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  count?: number;
}

class NSEStocksService {
  /**
   * Get all NSE stocks
   */
  async getAllNSEStocks() {
    return apiService.get<APIResponse<NSEStock[]>>("/nse/stocks/all");
  }

  /**
   * Get top gainers
   */
  async getTopGainers(index: string = "NIFTY 50") {
    return apiService.get<APIResponse<NSEStock[]>>("/nse/stocks/gainers", {
      params: { index },
    });
  }

  /**
   * Get top losers
   */
  async getTopLosers(index: string = "NIFTY 50") {
    return apiService.get<APIResponse<NSEStock[]>>("/nse/stocks/losers", {
      params: { index },
    });
  }

  /**
   * Get high volume stocks
   */
  async getHighVolumeStocks(index: string = "NIFTY 50") {
    return apiService.get<APIResponse<NSEStock[]>>("/nse/stocks/volume", {
      params: { index },
    });
  }

  /**
   * Get stocks near 52-week high
   */
  async get52WeekHighStocks(index: string = "NIFTY 50") {
    return apiService.get<APIResponse<NSEStock[]>>("/nse/stocks/52w-high", {
      params: { index },
    });
  }

  /**
   * Get stocks near 52-week low
   */
  async get52WeekLowStocks(index: string = "NIFTY 50") {
    return apiService.get<APIResponse<NSEStock[]>>("/nse/stocks/52w-low", {
      params: { index },
    });
  }

  /**
   * Get stock quote by symbol
   */
  async getStockQuote(symbol: string) {
    return apiService.get<APIResponse<NSEStock>>(`/nse/stocks/quote/${symbol}`);
  }
}

export default new NSEStocksService();
