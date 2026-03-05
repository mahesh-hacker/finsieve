import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { MarketData } from "../../types/common";

interface MarketDataState {
  data: Record<string, MarketData>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const initialState: MarketDataState = {
  data: {},
  loading: false,
  error: null,
  lastUpdated: null,
};

const marketDataSlice = createSlice({
  name: "marketData",
  initialState,
  reducers: {
    updateMarketData: (state, action: PayloadAction<MarketData[]>) => {
      action.payload.forEach((data) => {
        state.data[data.instrumentId] = data;
      });
      state.lastUpdated = new Date();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearMarketData: (state) => {
      state.data = {};
      state.lastUpdated = null;
    },
  },
});

export const { updateMarketData, setLoading, setError, clearMarketData } =
  marketDataSlice.actions;
export default marketDataSlice.reducer;
