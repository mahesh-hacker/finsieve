import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Button,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShowChart as ShowChartIcon,
  TrendingUp as TrendingUpIcon,
  CandlestickChart as CandlestickChartIcon,
  AccountBalance as AccountBalanceIcon,
  CurrencyBitcoin as CryptoCurrencyIcon,
  FilterList as FilterListIcon,
  CompareArrows as CompareArrowsIcon,
  Bookmarks as BookmarksIcon,
  Public as PublicIcon,
  AccountCircle,
  Logout,
  Settings,
  Login as LoginIcon,
  Search as SearchIcon,
  KeyboardCommandKey,
  Notifications,
  Diamond,
  WaterDrop,
  LightMode,
  DarkMode,
  SettingsBrightness,
  ChevronLeft,
  ChevronRight,
  Article,
  Assessment,
  BusinessCenter,
  PieChart,
  CorporateFare,
} from "@mui/icons-material";
import { RootState } from "../../store";
import { logout } from "../../store/slices/authSlice";
import { useThemeMode, type ThemeMode } from "../../contexts/ThemeContext";
import GlobalSearch from "../../components/common/GlobalSearch";
import InvestBot from "../../components/chatbot/InvestBot";
import { useRealTimeIndices } from "../../hooks/useRealTimeIndices";
import { useInactivityLogout } from "../../hooks/useInactivityLogout";
import marketService, {
  GlobalIndex,
} from "../../services/market/marketService";

const drawerWidth = 256;

// ─── Navigation Configuration ────────────────────────────────
const navSections = [
  {
    label: "OVERVIEW",
    items: [
      {
        text: "Dashboard",
        icon: <DashboardIcon sx={{ fontSize: 20 }} />,
        path: "/dashboard",
        requiresAuth: false,
      },
    ],
  },
  {
    label: "MARKETS",
    items: [
      {
        text: "Global Indices",
        icon: <PublicIcon sx={{ fontSize: 20 }} />,
        path: "/indices",
        requiresAuth: false,
      },
      {
        text: "Indian Indices",
        icon: <ShowChartIcon sx={{ fontSize: 20 }} />,
        path: "/equities/indian-indices",
        requiresAuth: false,
      },
      {
        text: "Indian Equities",
        icon: <CandlestickChartIcon sx={{ fontSize: 20 }} />,
        path: "/equities/indian",
        requiresAuth: false,
      },
      {
        text: "US Equities",
        icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
        path: "/equities/us",
        requiresAuth: false,
      },
      {
        text: "Mutual Funds",
        icon: <AccountBalanceIcon sx={{ fontSize: 20 }} />,
        path: "/mutual-funds",
        requiresAuth: false,
      },
      {
        text: "ETFs",
        icon: <Assessment sx={{ fontSize: 20 }} />,
        path: "/screening/etf",
        requiresAuth: false,
      },
      {
        text: "SIF",
        icon: <BusinessCenter sx={{ fontSize: 20 }} />,
        path: "/screening/sif",
        requiresAuth: false,
      },
      {
        text: "PMS",
        icon: <PieChart sx={{ fontSize: 20 }} />,
        path: "/screening/pms",
        requiresAuth: false,
      },
      {
        text: "AIF",
        icon: <CorporateFare sx={{ fontSize: 20 }} />,
        path: "/screening/aif",
        requiresAuth: false,
      },
      {
        text: "Commodities",
        icon: <Diamond sx={{ fontSize: 20 }} />,
        path: "/commodities",
        requiresAuth: false,
      },
      {
        text: "Bonds",
        icon: <WaterDrop sx={{ fontSize: 20 }} />,
        path: "/bonds",
        requiresAuth: false,
      },
      {
        text: "Cryptocurrency",
        icon: <CryptoCurrencyIcon sx={{ fontSize: 20 }} />,
        path: "/crypto",
        requiresAuth: false,
      },
    ],
  },
  {
    label: "TOOLS",
    items: [
      {
        text: "Screening",
        icon: <FilterListIcon sx={{ fontSize: 20 }} />,
        path: "/screening",
        requiresAuth: true,
      },
      {
        text: "Comparison",
        icon: <CompareArrowsIcon sx={{ fontSize: 20 }} />,
        path: "/comparison",
        requiresAuth: true,
      },
      {
        text: "Watchlists",
        icon: <BookmarksIcon sx={{ fontSize: 20 }} />,
        path: "/watchlists",
        requiresAuth: true,
      },
    ],
  },
  {
    label: "MORE",
    items: [
      {
        text: "Market News",
        icon: <Article sx={{ fontSize: 20 }} />,
        path: "/news",
        requiresAuth: false,
      },
    ],
  },
];

// ─── Live Ticker Component ─────────────────────────────────────
const LiveTicker = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useSelector((state: RootState) => state.auth);
  const { indices: liveIndices } = useRealTimeIndices("all");
  const [fallbackIndices, setFallbackIndices] = useState<GlobalIndex[]>([]);

  const fetchTicker = useCallback(async () => {
    try {
      const response = await marketService.getMajorIndices();
      if (response.success && response.data) {
        setFallbackIndices(response.data.slice(0, 8));
      }
    } catch {
      // Ticker fetch failed; keep previous data
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => fetchTicker(), 0);
    const interval = setInterval(fetchTicker, 15000);
    return () => {
      clearTimeout(id);
      clearInterval(interval);
    };
  }, [fetchTicker]);

  const indices = (liveIndices.length > 0 ? liveIndices : fallbackIndices).slice(0, 8) as GlobalIndex[];
  if (indices.length === 0) return null;

  const tickerItems = [...indices, ...indices]; // duplicate for infinite scroll

  return (
    <Box
      sx={{
        overflow: "hidden",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
        background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)",
        height: 32,
        display: "flex",
        alignItems: "center",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 40,
          background: `linear-gradient(90deg, ${isDark ? "#0a0e17" : "#f8fafc"} 0%, transparent 100%)`,
          zIndex: 1,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 40,
          background: `linear-gradient(270deg, ${isDark ? "#0a0e17" : "#f8fafc"} 0%, transparent 100%)`,
          zIndex: 1,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          animation: "ticker-scroll 40s linear infinite",
          whiteSpace: "nowrap",
          pl: 2,
        }}
      >
        {tickerItems.map((idx, i) => {
          const pct =
            typeof idx.change_percent === "string"
              ? parseFloat(idx.change_percent)
              : idx.change_percent;
          const isUp = pct >= 0;
          return (
            <Box
              key={`${idx.symbol}-${i}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontSize: "0.65rem",
                  letterSpacing: "0.03em",
                }}
              >
                {idx.symbol}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  color: isDark ? "#e2e8f0" : "#1e293b",
                  fontSize: "0.65rem",
                }}
              >
                {typeof idx.current_value === "number"
                  ? idx.current_value.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })
                  : idx.current_value}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  fontSize: "0.6rem",
                  color: isUp ? "#10b981" : "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.2,
                }}
              >
                {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
              </Typography>
              <Box
                sx={{
                  width: 1,
                  height: 12,
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.08)",
                  ml: 1,
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN LAYOUT
// ═══════════════════════════════════════════════════════════════
const MainLayout = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("fs-sidebar-collapsed") === "true"; } catch { return false; }
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [themeAnchorEl, setThemeAnchorEl] = useState<null | HTMLElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );
  const { themeMode, setThemeMode } = useThemeMode();

  // Auto-logout after 2 hours of inactivity
  useInactivityLogout();

  // Persist sidebar state
  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try { localStorage.setItem("fs-sidebar-collapsed", String(next)); } catch { /* ignore */ }
  };

  // Global keyboard shortcut: / or Ctrl+K / Cmd+K to open search
  const searchOpenRef = useRef(searchOpen);
  useEffect(() => {
    searchOpenRef.current = searchOpen;
  }, [searchOpen]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (searchOpenRef.current) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key === "k")) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const themeOptions: {
    mode: ThemeMode;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      mode: "light",
      label: "Light",
      icon: <LightMode sx={{ fontSize: 18 }} />,
    },
    { mode: "dark", label: "Dark", icon: <DarkMode sx={{ fontSize: 18 }} /> },
    {
      mode: "system",
      label: "System",
      icon: <SettingsBrightness sx={{ fontSize: 18 }} />,
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path: string, requiresAuth?: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    handleProfileMenuClose();
  };

  // ─── Sidebar ────────────────────────────────────────────
  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: isDark ? "#0f1420" : "#ffffff",
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minHeight: 64,
          cursor: "pointer",
          "&:hover .logo-mark": {
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
          },
        }}
        onClick={() => navigate("/dashboard")}
      >
        <Box
          className="logo-mark"
          sx={{
            width: 34,
            height: 34,
            borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            color: "white",
            fontSize: "0.9rem",
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "-0.02em",
            transition: "box-shadow 0.3s ease",
            boxShadow: "0 0 12px rgba(99, 102, 241, 0.25)",
          }}
        >
          F
        </Box>
        <Box>
          <Typography
            sx={{
              color: isDark ? "#f1f5f9" : "#0f172a",
              fontWeight: 800,
              fontSize: "1.05rem",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Finsieve
          </Typography>
          <Typography
            sx={{
              color: isDark ? "#475569" : "#94a3b8",
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Intelligence
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {navSections.map((section) => (
          <Box key={section.label} sx={{ mb: 0.5 }}>
            <Typography
              variant="overline"
              sx={{
                px: 3,
                pt: 2,
                pb: 0.5,
                display: "block",
                fontSize: "0.6rem",
                fontWeight: 700,
                color: isDark ? "#475569" : "#94a3b8",
                letterSpacing: "0.1em",
              }}
            >
              {section.label}
            </Typography>
            <List sx={{ py: 0 }}>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const isLocked = item.requiresAuth && !isAuthenticated;
                return (
                  <ListItem key={item.text} disablePadding sx={{ px: 1 }}>
                    <ListItemButton
                      selected={isActive}
                      onClick={() =>
                        handleMenuClick(item.path, item.requiresAuth)
                      }
                      sx={{
                        borderRadius: "10px",
                        py: 0.8,
                        px: 1.5,
                        mx: 0.5,
                        my: 0.15,
                        position: "relative",
                        overflow: "hidden",
                        opacity: isLocked ? 0.4 : 1,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&::before": isActive
                          ? {
                              content: '""',
                              position: "absolute",
                              left: 0,
                              top: "20%",
                              bottom: "20%",
                              width: 3,
                              borderRadius: "0 3px 3px 0",
                              background:
                                "linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)",
                            }
                          : {},
                        "&.Mui-selected": {
                          backgroundColor: "rgba(99, 102, 241, 0.08)",
                          "&:hover": {
                            backgroundColor: "rgba(99, 102, 241, 0.12)",
                          },
                        },
                        "&:hover": {
                          backgroundColor: isDark
                            ? "rgba(255, 255, 255, 0.03)"
                            : "rgba(0, 0, 0, 0.04)",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive
                            ? "#818cf8"
                            : isDark
                              ? "#64748b"
                              : "#94a3b8",
                          minWidth: 36,
                          transition: "color 0.2s ease",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: "0.8125rem",
                          fontWeight: isActive ? 600 : 500,
                          color: isActive
                            ? isDark
                              ? "#f1f5f9"
                              : "#0f172a"
                            : isDark
                              ? "#94a3b8"
                              : "#64748b",
                          letterSpacing: "-0.01em",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Sidebar Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        {isAuthenticated ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1,
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
              },
            }}
            onClick={handleProfileMenuOpen}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: "0.8rem",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              }}
            >
              {user?.firstName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: isDark ? "#e2e8f0" : "#1e293b",
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.625rem",
                  color: isDark ? "#64748b" : "#94a3b8",
                  lineHeight: 1.3,
                }}
              >
                Free Plan
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography
            sx={{
              fontSize: "0.65rem",
              color: isDark ? "#475569" : "#94a3b8",
              textAlign: "center",
              py: 0.5,
            }}
          >
            © {new Date().getFullYear()} Finsieve
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* ─── Top Bar ──────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: {
            xs: "100%",
            sm: "100%",
            md: sidebarCollapsed ? "100%" : `calc(100% - ${drawerWidth}px)`,
          },
          ml: {
            xs: 0,
            sm: 0,
            md: sidebarCollapsed ? 0 : `${drawerWidth}px`,
          },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          backgroundColor: isDark
            ? "rgba(10, 14, 23, 0.8)"
            : "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        {/* Live Ticker — hidden on small screens to save space and avoid overflow */}
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <LiveTicker />
        </Box>

        {/* Main Toolbar */}
        <Toolbar
          sx={{
            minHeight: "56px !important",
            px: { xs: 2, md: 3 },
          }}
        >
          {/* Sidebar Toggle for Desktop */}
          <Tooltip
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            placement="bottom"
          >
            <IconButton
              onClick={toggleSidebar}
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                color: isDark ? "#94a3b8" : "#64748b",
                bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
                borderRadius: "8px",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.06)",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.15)",
                },
              }}
            >
              {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </Tooltip>

          {/* Mobile Menu Toggle */}
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { md: "none" },
              color: isDark ? "#94a3b8" : "#64748b",
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Search Bar */}
          <Box
            onClick={() => setSearchOpen(true)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flex: 1,
              minWidth: 0,
              maxWidth: { xs: "100%", sm: 480 },
              bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
              borderRadius: "10px",
              px: 1.5,
              py: 0.5,
              cursor: "pointer",
              transition: "all 0.2s ease",
              userSelect: "none",
              "&:hover": {
                borderColor: isDark
                  ? "rgba(99,102,241,0.3)"
                  : "rgba(99,102,241,0.25)",
                bgcolor: isDark ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.03)",
              },
            }}
          >
            <SearchIcon
              sx={{ fontSize: 18, color: isDark ? "#475569" : "#94a3b8" }}
            />
            <Typography
              sx={{
                flex: 1,
                color: isDark ? "#475569" : "#94a3b8",
                fontSize: "0.8125rem",
                fontWeight: 500,
                pointerEvents: "none",
              }}
            >
              Search stocks, funds, crypto...
            </Typography>
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 0.3,
                bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
                borderRadius: "6px",
                px: 0.7,
                py: 0.2,
              }}
            >
              <KeyboardCommandKey
                sx={{ fontSize: 12, color: isDark ? "#475569" : "#94a3b8" }}
              />
              <Typography
                sx={{
                  fontSize: "0.625rem",
                  color: isDark ? "#475569" : "#94a3b8",
                  fontWeight: 700,
                }}
              >
                K
              </Typography>
            </Box>
          </Box>

          {/* Global Search Modal */}
          <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

          <Box sx={{ flex: 1 }} />

          {/* Right Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {/* Live Indicator */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 0.7,
                mr: 1,
                px: 1.2,
                py: 0.4,
                borderRadius: "6px",
                bgcolor: isDark
                  ? "rgba(16, 185, 129, 0.06)"
                  : "rgba(16, 185, 129, 0.08)",
                border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.2)"}`,
              }}
            >
              <span className="live-dot" />
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "#10b981",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                LIVE
              </Typography>
            </Box>

            {/* Theme Toggle — authenticated users only */}
            {isAuthenticated && (
              <>
                <Tooltip title="Theme" arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => setThemeAnchorEl(e.currentTarget)}
                  >
                    {themeMode === "dark" ? (
                      <DarkMode
                        sx={{
                          fontSize: 20,
                          color: isDark ? "#94a3b8" : "#64748b",
                        }}
                      />
                    ) : themeMode === "light" ? (
                      <LightMode
                        sx={{
                          fontSize: 20,
                          color: isDark ? "#94a3b8" : "#f59e0b",
                        }}
                      />
                    ) : (
                      <SettingsBrightness
                        sx={{
                          fontSize: 20,
                          color: isDark ? "#94a3b8" : "#64748b",
                        }}
                      />
                    )}
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={themeAnchorEl}
                  open={Boolean(themeAnchorEl)}
                  onClose={() => setThemeAnchorEl(null)}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  {themeOptions.map((opt) => (
                    <MenuItem
                      key={opt.mode}
                      selected={themeMode === opt.mode}
                      onClick={() => {
                        setThemeMode(opt.mode);
                        setThemeAnchorEl(null);
                      }}
                      sx={{ gap: 1.5, fontSize: "0.8125rem" }}
                    >
                      <ListItemIcon sx={{ minWidth: "unset" }}>
                        {opt.icon}
                      </ListItemIcon>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}

            <Tooltip title="Notifications" arrow>
              <IconButton size="small">
                <Badge
                  variant="dot"
                  sx={{
                    "& .MuiBadge-dot": {
                      bgcolor: "#6366f1",
                      width: 6,
                      height: 6,
                    },
                  }}
                >
                  <Notifications
                    sx={{ fontSize: 20, color: isDark ? "#64748b" : "#94a3b8" }}
                  />
                </Badge>
              </IconButton>
            </Tooltip>

            {isAuthenticated ? (
              <Tooltip title="Profile" arrow>
                <IconButton onClick={handleProfileMenuOpen} size="small">
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      fontSize: "0.75rem",
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    }}
                  >
                    {user?.firstName?.[0]}
                  </Avatar>
                </IconButton>
              </Tooltip>
            ) : (
              <Box sx={{ display: "flex", gap: 1, ml: 1 }}>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<LoginIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate("/login")}
                  sx={{
                    fontSize: "0.75rem",
                    color: isDark ? "#94a3b8" : "#64748b",
                    display: { xs: "none", sm: "flex" },
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate("/register")}
                  sx={{ fontSize: "0.75rem", px: 2 }}
                >
                  Sign Up
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* ─── Profile Menu ────────────────────────────────── */}
      {isAuthenticated && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography
              sx={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: isDark ? "#f1f5f9" : "#0f172a",
              }}
            >
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography
              sx={{ fontSize: "0.7rem", color: isDark ? "#64748b" : "#94a3b8" }}
            >
              {user?.email || "Free Plan"}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              navigate("/profile");
              handleProfileMenuClose();
            }}
          >
            <ListItemIcon>
              <AccountCircle sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <Typography variant="body2">Profile</Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate("/settings");
              handleProfileMenuClose();
            }}
          >
            <ListItemIcon>
              <Settings sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <Typography variant="body2">Settings</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout sx={{ fontSize: 18, color: "#ef4444" }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ color: "#ef4444" }}>
              Logout
            </Typography>
          </MenuItem>
        </Menu>
      )}

      {/* ─── Sidebar ─────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          width: { md: sidebarCollapsed ? 0 : drawerWidth },
          flexShrink: { md: 0 },
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: { xs: "min(100vw, 280px)", sm: drawerWidth },
              maxWidth: "85vw",
              backgroundColor: isDark ? "#0f1420" : "#ffffff",
              border: "none",
              boxSizing: "border-box",
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              backgroundColor: isDark ? "#0f1420" : "#ffffff",
              borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
              transform: sidebarCollapsed
                ? `translateX(-${drawerWidth}px)`
                : "translateX(0)",
              transition: theme.transitions.create("transform", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* ─── InvestBot AI Assistant ────────────────────── */}
      <InvestBot />

      {/* ─── Main Content ────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: {
            xs: "100%",
            sm: "100%",
            md: sidebarCollapsed ? "100%" : `calc(100% - ${drawerWidth}px)`,
          },
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          minHeight: "100vh",
          backgroundColor: isDark ? "#0a0e17" : "#f8fafc",
          backgroundImage: isDark
            ? `
              radial-gradient(ellipse at 10% 20%, rgba(99, 102, 241, 0.02) 0%, transparent 50%),
              radial-gradient(ellipse at 90% 80%, rgba(139, 92, 246, 0.015) 0%, transparent 50%)
            `
            : "none",
        }}
      >
        {/* Spacer for AppBar (ticker + toolbar on sm+, toolbar only on xs) */}
        <Toolbar sx={{ minHeight: { xs: "56px", sm: "88px" } }} />
        <Box
          className="page-enter"
          sx={{
            p: { xs: 1.5, sm: 2, md: 3 },
            maxWidth: 1600,
            mx: "auto",
            width: "100%",
            minWidth: 0,
            overflowX: "hidden",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
