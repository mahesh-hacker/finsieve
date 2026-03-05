import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Watchlist } from "../../types/common";

interface WatchlistState {
  watchlists: Watchlist[];
  activeWatchlistId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: WatchlistState = {
  watchlists: [],
  activeWatchlistId: null,
  loading: false,
  error: null,
};

const watchlistSlice = createSlice({
  name: "watchlist",
  initialState,
  reducers: {
    setWatchlists: (state, action: PayloadAction<Watchlist[]>) => {
      state.watchlists = action.payload;
    },
    addWatchlist: (state, action: PayloadAction<Watchlist>) => {
      state.watchlists.push(action.payload);
    },
    updateWatchlist: (state, action: PayloadAction<Watchlist>) => {
      const index = state.watchlists.findIndex(
        (w) => w.id === action.payload.id,
      );
      if (index !== -1) {
        state.watchlists[index] = action.payload;
      }
    },
    deleteWatchlist: (state, action: PayloadAction<string>) => {
      state.watchlists = state.watchlists.filter(
        (w) => w.id !== action.payload,
      );
      if (state.activeWatchlistId === action.payload) {
        state.activeWatchlistId = null;
      }
    },
    setActiveWatchlist: (state, action: PayloadAction<string | null>) => {
      state.activeWatchlistId = action.payload;
    },
    addInstrumentToWatchlist: (
      state,
      action: PayloadAction<{ watchlistId: string; instrumentId: string }>,
    ) => {
      const watchlist = state.watchlists.find(
        (w) => w.id === action.payload.watchlistId,
      );
      if (
        watchlist &&
        !watchlist.instruments.includes(action.payload.instrumentId)
      ) {
        watchlist.instruments.push(action.payload.instrumentId);
        watchlist.updatedAt = new Date();
      }
    },
    removeInstrumentFromWatchlist: (
      state,
      action: PayloadAction<{ watchlistId: string; instrumentId: string }>,
    ) => {
      const watchlist = state.watchlists.find(
        (w) => w.id === action.payload.watchlistId,
      );
      if (watchlist) {
        watchlist.instruments = watchlist.instruments.filter(
          (id) => id !== action.payload.instrumentId,
        );
        watchlist.updatedAt = new Date();
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setWatchlists,
  addWatchlist,
  updateWatchlist,
  deleteWatchlist,
  setActiveWatchlist,
  addInstrumentToWatchlist,
  removeInstrumentFromWatchlist,
  setLoading,
  setError,
} = watchlistSlice.actions;

export default watchlistSlice.reducer;
