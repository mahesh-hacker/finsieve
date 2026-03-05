/* eslint-disable react-refresh/only-export-components -- entry point: theme wrapper + root render */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { Toaster } from "react-hot-toast";
import { store } from "./store";
import App from "./App";
import { ThemeContextProvider, useThemeMode } from "./contexts/ThemeContext";
import type { ResolvedTheme } from "./contexts/ThemeContext";
import "./index.css";

// ═══════════════════════════════════════════════════════════════
// FINSIEVE DYNAMIC THEME SYSTEM
// Light (default for guests) · Dark · System
// ═══════════════════════════════════════════════════════════════

const buildTheme = (mode: ResolvedTheme) => {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#6366f1",
        light: "#818cf8",
        dark: "#4f46e5",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#8b5cf6",
        light: "#a78bfa",
        dark: "#7c3aed",
      },
      success: {
        main: "#10b981",
        light: "#34d399",
        dark: "#059669",
      },
      error: {
        main: "#ef4444",
        light: "#f87171",
        dark: "#dc2626",
      },
      warning: {
        main: "#f59e0b",
        light: "#fbbf24",
        dark: "#d97706",
      },
      info: {
        main: "#06b6d4",
        light: "#22d3ee",
        dark: "#0891b2",
      },
      background: {
        default: isDark ? "#0a0e17" : "#f8fafc",
        paper: isDark ? "#111827" : "#ffffff",
      },
      text: {
        primary: isDark ? "#f1f5f9" : "#0f172a",
        secondary: isDark ? "#94a3b8" : "#64748b",
        disabled: isDark ? "#475569" : "#94a3b8",
      },
      divider: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)",
      action: {
        hover: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)",
        selected: "rgba(99, 102, 241, 0.12)",
        focus: "rgba(99, 102, 241, 0.12)",
      },
    },
    typography: {
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      h1: {
        fontSize: "2.5rem",
        fontWeight: 700,
        letterSpacing: "-0.025em",
        lineHeight: 1.2,
      },
      h2: {
        fontSize: "2rem",
        fontWeight: 700,
        letterSpacing: "-0.025em",
        lineHeight: 1.2,
      },
      h3: {
        fontSize: "1.5rem",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1.3,
      },
      h4: {
        fontSize: "1.25rem",
        fontWeight: 600,
        letterSpacing: "-0.015em",
        lineHeight: 1.4,
      },
      h5: {
        fontSize: "1.1rem",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        lineHeight: 1.4,
      },
      h6: {
        fontSize: "1rem",
        fontWeight: 600,
        letterSpacing: "0em",
        lineHeight: 1.5,
      },
      subtitle1: {
        fontSize: "0.9375rem",
        fontWeight: 500,
        letterSpacing: "0em",
        lineHeight: 1.5,
      },
      subtitle2: {
        fontSize: "0.8125rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
        lineHeight: 1.5,
      },
      body1: {
        fontSize: "0.9375rem",
        lineHeight: 1.6,
        letterSpacing: "0em",
      },
      body2: {
        fontSize: "0.8125rem",
        lineHeight: 1.5,
        letterSpacing: "0em",
      },
      caption: {
        fontSize: "0.6875rem",
        lineHeight: 1.5,
        letterSpacing: "0.02em",
        color: isDark ? "#94a3b8" : "#64748b",
      },
      overline: {
        fontSize: "0.6875rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: isDark ? "#64748b" : "#94a3b8",
      },
      button: {
        fontWeight: 600,
        letterSpacing: "0.01em",
        textTransform: "none" as const,
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      "none",
      isDark ? "0 1px 2px rgba(0,0,0,0.3)" : "0 1px 2px rgba(0,0,0,0.06)",
      isDark ? "0 2px 4px rgba(0,0,0,0.3)" : "0 2px 4px rgba(0,0,0,0.06)",
      isDark ? "0 4px 8px rgba(0,0,0,0.3)" : "0 4px 8px rgba(0,0,0,0.08)",
      isDark ? "0 6px 12px rgba(0,0,0,0.35)" : "0 6px 12px rgba(0,0,0,0.08)",
      isDark ? "0 8px 16px rgba(0,0,0,0.35)" : "0 8px 16px rgba(0,0,0,0.1)",
      isDark ? "0 12px 24px rgba(0,0,0,0.4)" : "0 12px 24px rgba(0,0,0,0.1)",
      isDark ? "0 16px 32px rgba(0,0,0,0.4)" : "0 16px 32px rgba(0,0,0,0.12)",
      isDark ? "0 20px 40px rgba(0,0,0,0.45)" : "0 20px 40px rgba(0,0,0,0.12)",
      isDark ? "0 1px 3px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.04)",
      isDark ? "0 2px 6px rgba(0,0,0,0.2)" : "0 2px 6px rgba(0,0,0,0.04)",
      isDark ? "0 4px 12px rgba(0,0,0,0.25)" : "0 4px 12px rgba(0,0,0,0.06)",
      isDark ? "0 6px 16px rgba(0,0,0,0.25)" : "0 6px 16px rgba(0,0,0,0.06)",
      isDark ? "0 8px 20px rgba(0,0,0,0.3)" : "0 8px 20px rgba(0,0,0,0.08)",
      isDark ? "0 12px 28px rgba(0,0,0,0.3)" : "0 12px 28px rgba(0,0,0,0.08)",
      isDark ? "0 16px 36px rgba(0,0,0,0.35)" : "0 16px 36px rgba(0,0,0,0.1)",
      isDark ? "0 20px 44px rgba(0,0,0,0.35)" : "0 20px 44px rgba(0,0,0,0.1)",
      isDark ? "0 24px 52px rgba(0,0,0,0.4)" : "0 24px 52px rgba(0,0,0,0.12)",
      isDark ? "0 28px 60px rgba(0,0,0,0.4)" : "0 28px 60px rgba(0,0,0,0.12)",
      isDark ? "0 32px 68px rgba(0,0,0,0.45)" : "0 32px 68px rgba(0,0,0,0.14)",
      isDark ? "0 36px 76px rgba(0,0,0,0.45)" : "0 36px 76px rgba(0,0,0,0.14)",
      isDark ? "0 40px 84px rgba(0,0,0,0.5)" : "0 40px 84px rgba(0,0,0,0.16)",
      isDark ? "0 44px 92px rgba(0,0,0,0.5)" : "0 44px 92px rgba(0,0,0,0.16)",
      isDark
        ? "0 48px 100px rgba(0,0,0,0.55)"
        : "0 48px 100px rgba(0,0,0,0.18)",
      isDark
        ? "0 52px 108px rgba(0,0,0,0.55)"
        : "0 52px 108px rgba(0,0,0,0.18)",
    ],
    components: {
      // ─── CssBaseline ──────────────────────────────────────
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? "#0a0e17" : "#f8fafc",
            backgroundImage: isDark
              ? `
              radial-gradient(ellipse at 10% 20%, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
              radial-gradient(ellipse at 90% 80%, rgba(139, 92, 246, 0.02) 0%, transparent 50%)
            `
              : "none",
          },
        },
      },

      // ─── Button ───────────────────────────────────────────
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: "8px 20px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            boxShadow: "none",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              boxShadow: "none",
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
          },
          contained: {
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
              boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
            },
          },
          outlined: {
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(0, 0, 0, 0.15)",
            color: isDark ? "#e2e8f0" : "#334155",
            "&:hover": {
              borderColor: "rgba(99, 102, 241, 0.5)",
              backgroundColor: "rgba(99, 102, 241, 0.08)",
            },
          },
          text: {
            color: isDark ? "#94a3b8" : "#64748b",
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.04)"
                : "rgba(0, 0, 0, 0.04)",
              color: isDark ? "#f1f5f9" : "#0f172a",
            },
          },
        },
      },

      // ─── Card ─────────────────────────────────────────────
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark
              ? "rgba(17, 24, 39, 0.7)"
              : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"}`,
            borderRadius: 16,
            boxShadow: isDark
              ? "0 1px 3px rgba(0,0,0,0.2)"
              : "0 1px 3px rgba(0,0,0,0.06)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(99, 102, 241, 0.2)",
              boxShadow: isDark
                ? "0 8px 32px rgba(0,0,0,0.3)"
                : "0 8px 32px rgba(0,0,0,0.08)",
              transform: "translateY(-2px)",
            },
          },
        },
      },

      // ─── Paper ────────────────────────────────────────────
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: isDark ? "#111827" : "#ffffff",
          },
          rounded: {
            borderRadius: 16,
          },
        },
      },

      // ─── AppBar ───────────────────────────────────────────
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark
              ? "rgba(10, 14, 23, 0.8)"
              : "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(20px) saturate(180%)",
            borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"}`,
            boxShadow: "none",
            color: isDark ? "#f1f5f9" : "#0f172a",
          },
        },
      },

      // ─── Drawer ───────────────────────────────────────────
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#0f1420" : "#ffffff",
            borderRight: `1px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"}`,
            boxShadow: "none",
          },
        },
      },

      // ─── ListItemButton ───────────────────────────────────
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: "2px 8px",
            padding: "8px 12px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.04)"
                : "rgba(0, 0, 0, 0.04)",
            },
            "&.Mui-selected": {
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              "&:hover": {
                backgroundColor: "rgba(99, 102, 241, 0.16)",
              },
            },
          },
        },
      },

      // ─── Chip ─────────────────────────────────────────────
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            fontSize: "0.75rem",
            height: 28,
            border: "1px solid transparent",
          },
          filled: {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.06)",
            color: isDark ? "#e2e8f0" : "#334155",
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            },
          },
          outlined: {
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.12)",
          },
        },
      },

      // ─── TextField ────────────────────────────────────────
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 10,
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.03)"
                : "rgba(0, 0, 0, 0.02)",
              "& fieldset": {
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.1)",
              },
              "&:hover fieldset": {
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.15)"
                  : "rgba(0, 0, 0, 0.2)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#6366f1",
                borderWidth: 1,
              },
            },
            "& .MuiInputLabel-root": {
              color: isDark ? "#64748b" : "#94a3b8",
            },
            "& .MuiInputBase-input": {
              color: isDark ? "#f1f5f9" : "#0f172a",
            },
          },
        },
      },

      // ─── Select ───────────────────────────────────────────
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },

      // ─── Alert ────────────────────────────────────────────
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: "1px solid",
          },
          standardInfo: {
            backgroundColor: "rgba(99, 102, 241, 0.08)",
            borderColor: "rgba(99, 102, 241, 0.2)",
            color: isDark ? "#c7d2fe" : "#4338ca",
          },
          standardSuccess: {
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            borderColor: "rgba(16, 185, 129, 0.2)",
            color: isDark ? "#a7f3d0" : "#065f46",
          },
          standardWarning: {
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            borderColor: "rgba(245, 158, 11, 0.2)",
            color: isDark ? "#fde68a" : "#92400e",
          },
          standardError: {
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            borderColor: "rgba(239, 68, 68, 0.2)",
            color: isDark ? "#fca5a5" : "#991b1b",
          },
        },
      },

      // ─── Tabs ─────────────────────────────────────────────
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 40,
          },
          indicator: {
            height: 2,
            borderRadius: "2px 2px 0 0",
            background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8125rem",
            minHeight: 40,
            padding: "8px 16px",
            color: isDark ? "#64748b" : "#94a3b8",
            "&.Mui-selected": {
              color: isDark ? "#f1f5f9" : "#0f172a",
            },
          },
        },
      },

      // ─── Tooltip ──────────────────────────────────────────
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#0f172a",
            color: "#e2e8f0",
            fontSize: "0.75rem",
            fontWeight: 500,
            borderRadius: 8,
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.1)"}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            padding: "6px 12px",
          },
          arrow: {
            color: isDark ? "#1e293b" : "#0f172a",
          },
        },
      },

      // ─── Dialog ───────────────────────────────────────────
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#111827" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"}`,
            borderRadius: 16,
            boxShadow: isDark
              ? "0 24px 80px rgba(0,0,0,0.6)"
              : "0 24px 80px rgba(0,0,0,0.15)",
          },
        },
      },

      // ─── Menu ─────────────────────────────────────────────
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#1a2035" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"}`,
            borderRadius: 12,
            boxShadow: isDark
              ? "0 16px 48px rgba(0,0,0,0.5)"
              : "0 16px 48px rgba(0,0,0,0.12)",
            marginTop: 4,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: "2px 6px",
            padding: "8px 12px",
            fontSize: "0.8125rem",
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.04)"
                : "rgba(0, 0, 0, 0.04)",
            },
          },
        },
      },

      // ─── Divider ──────────────────────────────────────────
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.06)",
          },
        },
      },

      // ─── IconButton ───────────────────────────────────────
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: isDark ? "#94a3b8" : "#64748b",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.06)"
                : "rgba(0, 0, 0, 0.06)",
              color: isDark ? "#f1f5f9" : "#0f172a",
            },
          },
        },
      },

      // ─── Avatar ───────────────────────────────────────────
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: "rgba(99, 102, 241, 0.2)",
            color: "#818cf8",
            fontWeight: 700,
          },
        },
      },

      // ─── LinearProgress ───────────────────────────────────
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.06)",
          },
          bar: {
            borderRadius: 4,
          },
        },
      },

      // ─── CircularProgress ─────────────────────────────────
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: "#6366f1",
          },
        },
      },

      // ─── Table ────────────────────────────────────────────
      MuiTableHead: {
        styleOverrides: {
          root: {
            "& .MuiTableCell-head": {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.02)"
                : "rgba(0, 0, 0, 0.02)",
              borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)"}`,
              color: isDark ? "#64748b" : "#94a3b8",
              fontWeight: 700,
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "10px 16px",
            },
          },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: {
            "& .MuiTableRow-root": {
              transition: "all 0.15s ease",
              "&:hover": {
                backgroundColor: "rgba(99, 102, 241, 0.04)",
              },
            },
            "& .MuiTableCell-body": {
              borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.04)"}`,
              color: isDark ? "#e2e8f0" : "#334155",
              fontSize: "0.8125rem",
              padding: "10px 16px",
            },
          },
        },
      },

      // ─── Skeleton ─────────────────────────────────────────
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.06)",
          },
        },
      },
    },
  });
};

// ─── Inner App with theme context consumption ────────────────
const ThemedApp = () => {
  const { resolvedTheme } = useThemeMode();
  const theme = buildTheme(resolvedTheme);
  const isDark = resolvedTheme === "dark";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDark ? "#1a2035" : "#ffffff",
            color: isDark ? "#f1f5f9" : "#0f172a",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            borderRadius: "12px",
            fontSize: "0.8125rem",
            fontFamily: "'Inter', sans-serif",
            boxShadow: isDark
              ? "0 16px 48px rgba(0,0,0,0.5)"
              : "0 16px 48px rgba(0,0,0,0.1)",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: isDark ? "#0a0e17" : "#ffffff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: isDark ? "#0a0e17" : "#ffffff",
            },
          },
        }}
      />
    </ThemeProvider>
  );
};

// ─── Root render ─────────────────────────────────────────────
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeContextProvider>
          <ThemedApp />
        </ThemeContextProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
