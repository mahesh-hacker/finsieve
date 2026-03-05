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

      if (accessToken && refreshToken && !isAuthenticated) {
        try {
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
            dispatch(logout());
          }
        } catch {
          dispatch(logout());
        }
      } else {
        // No tokens — mark init done immediately so ProtectedRoute doesn't spin forever
        dispatch(setInitializing(false));
      }
    };

    initializeAuth();
  }, [dispatch, isAuthenticated]);

  return { isAuthenticated, user };
};
