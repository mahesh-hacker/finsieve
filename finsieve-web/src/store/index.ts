import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import watchlistReducer from "./slices/watchlistSlice";
import marketDataReducer from "./slices/marketDataSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    watchlist: watchlistReducer,
    marketData: marketDataReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["marketData/updateMarketData"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
