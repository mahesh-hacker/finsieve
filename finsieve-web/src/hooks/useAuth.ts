import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import authService from "../services/auth/authService";
import { loginSuccess, logout, setInitializing } from "../store/slices/authSlice";
import { RootState } from "../store";

/**
 * Hook to initialize authentication state on app load
 * Checks if tokens exist and validates them by fetching current user
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (accessToken && refreshToken && !user) {
        try {
          // Background validation — page is already shown (optimistic auth)
          const response = await authService.getCurrentUser();

          if (response.success && response.data) {
            dispatch(
              loginSuccess({
                accessToken,
                refreshToken,
                user: response.data,
              }),
            );
          } else {
            // Token rejected by server — log out
            dispatch(logout());
          }
        } catch {
          // Network error or 401 — log out only if server explicitly rejected
          // (don't log out on transient network issues to avoid false logouts)
          const freshToken = localStorage.getItem("accessToken");
          if (!freshToken) dispatch(logout());
        }
      } else {
        dispatch(setInitializing(false));
      }
    };

    initializeAuth();
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isAuthenticated, user };
};
