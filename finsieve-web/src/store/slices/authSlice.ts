import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User, UserTier } from "../../types/common";

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  loading: boolean;
  initializing: boolean; // true until first auth check completes on app load
  error: string | null;
}

const storedAccessToken = localStorage.getItem("accessToken");
const storedRefreshToken = localStorage.getItem("refreshToken");
const hasStoredTokens = !!(storedAccessToken && storedRefreshToken);

const initialState: AuthState = {
  // Optimistic auth: trust stored tokens immediately, /me validates in background
  isAuthenticated: hasStoredTokens,
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
  user: null,
  loading: false,
  initializing: false, // no spinner needed — page shows immediately
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        user: {
          userId: string;
          email: string;
          firstName: string;
          lastName: string;
          phone: string | null;
          userTier: string;
          emailVerified: boolean;
          createdAt: string;
        };
      }>,
    ) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;

      // Map backend user format to frontend User type
      state.user = {
        id: action.payload.user.userId,
        email: action.payload.user.email,
        firstName: action.payload.user.firstName,
        lastName: action.payload.user.lastName,
        phone: action.payload.user.phone || undefined,
        userTier: action.payload.user.userTier as UserTier,
        createdAt: new Date(action.payload.user.createdAt),
        preferences: {
          theme: "auto",
          language: "en",
          defaultCurrency: "INR",
          defaultChartType: "line",
          notificationsEnabled: true,
        },
      };
      state.loading = false;
      state.initializing = false;
      state.error = null;

      // Store tokens in localStorage
      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.initializing = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.loading = false;
      state.initializing = false;
      state.error = null;

      // Clear localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    updateTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;

      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  updateTokens,
  setInitializing,
} = authSlice.actions;
export default authSlice.reducer;
