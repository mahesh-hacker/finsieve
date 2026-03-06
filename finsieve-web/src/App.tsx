import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "./store";
import { useAuth } from "./hooks/useAuth";
import { Box, CircularProgress } from "@mui/material";

// Layouts
import MainLayout from "./layouts/common/MainLayout";
import AuthLayout from "./layouts/auth/AuthLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

// Landing & About (no layout shell)
import LandingPage from "./pages/landing/LandingPage";
import AboutUs from "./pages/landing/AboutUs";
import Pricing from "./pages/pricing/Pricing";

// Main Pages
import Dashboard from "./pages/dashboard/Dashboard";
import IndianEquities from "./pages/equities/IndianEquities";
import IndianIndices from "./pages/equities/IndianIndices";
import StockDetail from "./pages/equities/StockDetail";
import USEquities from "./pages/equities/USEquities";
import MutualFunds from "./pages/mutualfunds/MutualFunds";
import GlobalIndices from "./pages/indices/GlobalIndices";
import Commodities from "./pages/commodities/Commodities";
import Bonds from "./pages/bonds/Bonds";
import Cryptocurrency from "./pages/crypto/Cryptocurrency";
import Screening from "./pages/screening/Screening";
import EtfScreener from "./components/screening/EtfScreener";
import SifScreener from "./components/screening/SifScreener";
import PmsScreener from "./components/screening/PmsScreener";
import AifScreener from "./components/screening/AifScreener";
import Comparison from "./pages/comparison/Comparison";
import Watchlists from "./pages/watchlist/Watchlists";
import ProfileSettings from "./pages/dashboard/ProfileSettings";
import News from "./pages/news/News";

// Protected Route: waits for auth init, then redirects unauthenticated users to /login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, initializing } = useSelector(
    (state: RootState) => state.auth,
  );

  if (initializing) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  // Initialize auth from stored tokens on every app load
  useAuth();

  return (
    <Routes>
      {/* ── Landing & About (standalone, no app shell) ── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutUs />} />


      {/* ── Auth Routes ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* ── App Routes (inside MainLayout shell) ── */}
      <Route element={<MainLayout />}>
        {/* Public pages */}
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/equities/indian-indices" element={<IndianIndices />} />
        <Route path="/equities/indian" element={<IndianEquities />} />
        <Route path="/equities/indian/:symbol" element={<StockDetail />} />
        <Route path="/equities/us" element={<USEquities />} />
        <Route path="/mutual-funds" element={<MutualFunds />} />
        <Route path="/indices" element={<GlobalIndices />} />
        <Route path="/commodities" element={<Commodities />} />
        <Route path="/bonds" element={<Bonds />} />
        <Route path="/crypto" element={<Cryptocurrency />} />
        <Route path="/news" element={<News />} />

        {/* Protected pages (require login) */}
        <Route
          path="/screening"
          element={
            <ProtectedRoute>
              <Screening />
            </ProtectedRoute>
          }
        />
        <Route path="/screening/etf" element={<ProtectedRoute><EtfScreener /></ProtectedRoute>} />
        <Route path="/screening/sif" element={<ProtectedRoute><SifScreener /></ProtectedRoute>} />
        <Route path="/screening/pms" element={<ProtectedRoute><PmsScreener /></ProtectedRoute>} />
        <Route path="/screening/aif" element={<ProtectedRoute><AifScreener /></ProtectedRoute>} />
        <Route
          path="/comparison"
          element={
            <ProtectedRoute>
              <Comparison />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watchlists"
          element={
            <ProtectedRoute>
              <Watchlists />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<Navigate to="/profile" replace />} />
      </Route>

      {/* ── Catch-all: redirect to dashboard ── */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
