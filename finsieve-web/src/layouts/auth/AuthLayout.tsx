import { Outlet } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";

/* ─── Animated SVG Market Background ─────────────────────────── */
const MarketBackground = () => {
  const candles = Array.from({ length: 28 }, (_, i) => {
    const x = 30 + i * 52;
    const base = 220 + Math.sin(i * 0.4) * 80 + Math.cos(i * 0.7) * 40;
    const open = base + (((i * 7 + 3) % 17) / 17 - 0.5) * 30;
    const close = base + (((i * 11 + 5) % 19) / 19 - 0.5) * 30;
    const high = Math.min(open, close) - (((i * 13 + 2) % 11) / 11) * 25 - 5;
    const low = Math.max(open, close) + (((i * 9 + 1) % 13) / 13) * 25 + 5;
    const bullish = close < open;
    return { x, open, close, high, low, bullish };
  });

  const genPath = (seed: number, amplitude: number, yBase: number) => {
    const pts = Array.from({ length: 60 }, (_, i) => {
      const x = (i / 59) * 1440;
      const y =
        yBase +
        Math.sin(i * 0.15 + seed) * amplitude +
        Math.cos(i * 0.08 + seed * 2) * (amplitude * 0.6) +
        Math.sin(i * 0.3 + seed * 0.5) * (amplitude * 0.3);
      return `${x},${y}`;
    });
    return `M${pts.join(" L")}`;
  };

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="bearGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="line1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="20%" stopColor="#6366f1" stopOpacity="0.15" />
            <stop offset="80%" stopColor="#6366f1" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="20%" stopColor="#10b981" stopOpacity="0.12" />
            <stop offset="80%" stopColor="#10b981" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line3" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
            <stop offset="20%" stopColor="#f59e0b" stopOpacity="0.1" />
            <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="areaFill1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="areaFill2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[150, 250, 350, 450, 550, 650].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="1440"
            y2={y}
            stroke="#e2e8f0"
            strokeWidth="0.5"
            strokeDasharray="8 8"
            opacity="0.4"
          />
        ))}
        {[200, 400, 600, 800, 1000, 1200].map((x) => (
          <line
            key={x}
            x1={x}
            y1="0"
            x2={x}
            y2="900"
            stroke="#e2e8f0"
            strokeWidth="0.5"
            strokeDasharray="8 8"
            opacity="0.3"
          />
        ))}

        {/* Candlestick chart */}
        {candles.map((c, i) => (
          <g key={i}>
            <line
              x1={c.x}
              y1={c.high}
              x2={c.x}
              y2={c.low}
              stroke={c.bullish ? "#10b981" : "#ef4444"}
              strokeWidth="1"
              opacity="0.2"
            />
            <rect
              x={c.x - 8}
              y={Math.min(c.open, c.close)}
              width="16"
              height={Math.abs(c.close - c.open) || 2}
              rx="2"
              fill={c.bullish ? "url(#bullGrad)" : "url(#bearGrad)"}
            />
          </g>
        ))}

        {/* Trend lines with area fills */}
        <path
          d={genPath(1, 60, 500)}
          fill="none"
          stroke="url(#line1)"
          strokeWidth="2"
        />
        <path
          d={genPath(1, 60, 500) + " L1440,900 L0,900 Z"}
          fill="url(#areaFill1)"
        />
        <path
          d={genPath(3, 45, 600)}
          fill="none"
          stroke="url(#line2)"
          strokeWidth="1.5"
        />
        <path
          d={genPath(3, 45, 600) + " L1440,900 L0,900 Z"}
          fill="url(#areaFill2)"
        />
        <path
          d={genPath(7, 35, 700)}
          fill="none"
          stroke="url(#line3)"
          strokeWidth="1.5"
        />

        {/* Floating symbols */}
        <text
          x="120"
          y="80"
          fontSize="24"
          opacity="0.06"
          fill="#6366f1"
          fontWeight="700"
        >
          ₿
        </text>
        <text
          x="1280"
          y="130"
          fontSize="20"
          opacity="0.05"
          fill="#10b981"
          fontWeight="700"
        >
          Ξ
        </text>
        <text
          x="900"
          y="60"
          fontSize="18"
          opacity="0.05"
          fill="#f59e0b"
          fontWeight="700"
        >
          $
        </text>
        <text
          x="350"
          y="820"
          fontSize="22"
          opacity="0.05"
          fill="#8b5cf6"
          fontWeight="700"
        >
          ◆
        </text>
        <text
          x="1100"
          y="800"
          fontSize="20"
          opacity="0.05"
          fill="#06b6d4"
          fontWeight="700"
        >
          ₹
        </text>

        {/* Ticker labels */}
        <text
          x="60"
          y="140"
          fontSize="9"
          opacity="0.08"
          fill="#475569"
          fontFamily="monospace"
          fontWeight="600"
        >
          NIFTY 50
        </text>
        <text
          x="300"
          y="100"
          fontSize="9"
          opacity="0.08"
          fill="#475569"
          fontFamily="monospace"
          fontWeight="600"
        >
          S&amp;P 500
        </text>
        <text
          x="700"
          y="120"
          fontSize="9"
          opacity="0.08"
          fill="#475569"
          fontFamily="monospace"
          fontWeight="600"
        >
          NASDAQ
        </text>
        <text
          x="1050"
          y="90"
          fontSize="9"
          opacity="0.08"
          fill="#475569"
          fontFamily="monospace"
          fontWeight="600"
        >
          BTC/USD
        </text>
        <text
          x="200"
          y="780"
          fontSize="9"
          opacity="0.08"
          fill="#475569"
          fontFamily="monospace"
          fontWeight="600"
        >
          GOLD
        </text>
        <text
          x="850"
          y="830"
          fontSize="9"
          opacity="0.08"
          fill="#475569"
          fontFamily="monospace"
          fontWeight="600"
        >
          ETH/USD
        </text>
        <text
          x="1200"
          y="760"
          fontSize="9"
          opacity="0.08"
          fill="#475569"
          fontFamily="monospace"
          fontWeight="600"
        >
          DOW JONES
        </text>

        {/* Decorative dots */}
        {Array.from({ length: 20 }, (_, i) => (
          <circle
            key={i}
            cx={100 + ((i * 67) % 1300)}
            cy={100 + ((i * 43 + i * i * 7) % 700)}
            r="2"
            fill="#6366f1"
            opacity="0.06"
          />
        ))}
      </svg>
    </Box>
  );
};

/* ─── Auth Layout ────────────────────────────────────────────── */
const AuthLayout = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      sx={{
        minHeight: { xs: "100dvh", sm: "100vh" },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflowX: "hidden",
        bgcolor: isDark ? "#0a0e17" : "#f8fafc",
        background: isDark
          ? "linear-gradient(160deg, #060b14 0%, #0a0e17 50%, #0f1420 100%)"
          : "linear-gradient(160deg, #f8fafc 0%, #eef2ff 30%, #f0fdf4 60%, #f8fafc 100%)",
        p: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4 },
      }}
    >
      {/* Market Background */}
      <MarketBackground />

      {/* Logo */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 4,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: "1.2rem",
              color: "#fff",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            F
          </Typography>
        </Box>
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.25rem", sm: "1.4rem" },
              color: isDark ? "#f1f5f9" : "#0f172a",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Finsieve
          </Typography>
          <Typography
            sx={{
              fontSize: "0.55rem",
              color: "#6366f1",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            INTELLIGENCE
          </Typography>
        </Box>
      </Box>

      {/* Auth Form — centered, responsive */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 460,
          minWidth: 0,
        }}
      >
        <Outlet />
      </Box>

      {/* Footer */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          mt: 4,
          textAlign: "center",
        }}
      >
        <Typography sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
          © {new Date().getFullYear()} Finsieve. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;
