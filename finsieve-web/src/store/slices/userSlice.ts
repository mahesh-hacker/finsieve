import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UserPreferences } from "../../types/common";

interface UserState {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  preferences: {
    theme: "light",
    language: "en",
    defaultCurrency: "INR",
    defaultChartType: "line",
    notificationsEnabled: true,
  },
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setPreferences: (state, action: PayloadAction<UserPreferences>) => {
      state.preferences = action.payload;
    },
    updatePreference: (
      state,
      action: PayloadAction<Partial<UserPreferences>>,
    ) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setPreferences, updatePreference, setLoading, setError } =
  userSlice.actions;
export default userSlice.reducer;
