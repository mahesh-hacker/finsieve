import { useState, useEffect, useRef } from "react";
import { PLANS } from "../../config/plans";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  TrendingUp,
  ShowChart,
  CompareArrows,
  FilterList,
  Notifications,
  Security,
  Speed,
  Public,
  ArrowForward,
  CheckCircle,
  Cancel,
  Star,
  Bolt,
} from "@mui/icons-material";

/* ─── Animated SVG Background ─────────────────────────────────── */
const HeroBackground = () => {
  const lines = [
    { seed: 1.2, amp: 60, y: 300, color: "#6366f1", opacity: 0.18 },
    { seed: 2.5, amp: 45, y: 400, color: "#10b981", opacity: 0.12 },
    { seed: 0.8, amp: 75, y: 500, color: "#6366f1", opacity: 0.1 },
    { seed: 3.1, amp: 35, y: 200, color: "#f59e0b", opacity: 0.08 },
  ];

  const genPath = (seed: number, amplitude: number, yBase: number) => {
    const pts = Array.from({ length: 80 }, (_, i) => {
      const x = (i / 79) * 1440;
      const y =
        yBase +
        Math.sin(i * 0.12 + seed) * amplitude +
        Math.cos(i * 0.07 + seed * 2) * (amplitude * 0.5) +
        Math.sin(i * 0.25 + seed * 0.4) * (amplitude * 0.25);
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
      >
        <defs>
          <radialGradient id="heroGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heroGlow2" cx="30%" cy="60%" r="40%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#heroGlow)" />
        <rect width="1440" height="900" fill="url(#heroGlow2)" />
        {lines.map((l, i) => (
          <path
            key={i}
            d={genPath(l.seed, l.amp, l.y)}
            fill="none"
            stroke={l.color}
            strokeWidth="1.5"
            strokeOpacity={l.opacity}
          />
        ))}
        {/* Grid dots */}
        {Array.from({ length: 15 }, (_, row) =>
          Array.from({ length: 20 }, (_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={col * 80 + 40}
              cy={row * 60 + 30}
              r="1"
              fill="#6366f1"
              fillOpacity="0.06"
            />
          ))
        )}
      </svg>
    </Box>
  );
};

/* ─── Floating Stats Card (theme-aware for visibility) ───────────── */
const FloatingCard = ({
  symbol,
  value,
  change,
  positive,
  delay,
  top,
  left,
  right,
  isDark,
}: {
  symbol: string;
  value: string;
  change: string;
  positive: boolean;
  delay: string;
  top?: string;
  left?: string;
  right?: string;
  isDark?: boolean;
}) => (
  <Box
    sx={{
      position: "absolute",
      top,
      left,
      right,
      background: isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(15,23,42,0.92)",
      backdropFilter: "blur(16px)",
      border: isDark
        ? "1px solid rgba(255,255,255,0.12)"
        : "1px solid rgba(99,102,241,0.2)",
      borderRadius: 2,
      px: 2,
      py: 1.5,
      minWidth: 160,
      animation: `float 4s ease-in-out ${delay} infinite`,
      boxShadow: isDark
        ? "0 8px 32px rgba(0,0,0,0.15)"
        : "0 8px 32px rgba(99,102,241,0.15)",
      zIndex: 2,
      display: { xs: "none", md: "flex" },
      flexDirection: "column",
      gap: 0.5,
    }}
  >
    <Typography
      sx={{
        fontSize: 11,
        color: isDark ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.7)",
        fontWeight: 600,
        letterSpacing: 1,
      }}
    >
      {symbol}
    </Typography>
    <Typography
      sx={{
        fontSize: 18,
        fontWeight: 700,
        color: "#fff",
        fontFamily: "monospace",
        letterSpacing: 0.5,
      }}
    >
      {value}
    </Typography>
    <Typography
      sx={{
        fontSize: 12,
        fontWeight: 600,
        color: positive ? "#34d399" : "#f87171",
        display: "flex",
        alignItems: "center",
        gap: 0.3,
      }}
    >
      {positive ? "▲" : "▼"} {change}
    </Typography>
  </Box>
);

/* ─── Animated Counter ─────────────────────────────────────────── */
const AnimatedCounter = ({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = target / 60;
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

/* ─── Feature Card ─────────────────────────────────────────────── */
const FeatureCard = ({
  icon,
  title,
  description,
  gradient,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: string;
}) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        background: theme.palette.mode === "dark"
          ? "rgba(17,24,39,0.6)"
          : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        borderRadius: 3,
        p: 3.5,
        height: "100%",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        animation: `fadeInUp 0.6s ease-out ${delay} both`,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 20px 60px ${alpha(theme.palette.primary.main, 0.12)}`,
          borderColor: alpha(theme.palette.primary.main, 0.25),
        },
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: 2.5,
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2.5,
          "& svg": { fontSize: 26, color: "#fff" },
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={700} mb={1} sx={{ fontSize: 17 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
        {description}
      </Typography>
    </Box>
  );
};

/* ─── Pricing Card ─────────────────────────────────────────────── */
const PricingCard = ({
  plan,
  price,
  period,
  features,
  cta,
  highlight,
  badge,
  onCta,
}: {
  plan: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
  onCta: () => void;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: highlight
          ? "linear-gradient(145deg, #6366f1 0%, #4f46e5 60%, #4338ca 100%)"
          : isDark
          ? "rgba(17,24,39,0.85)"
          : "#fff",
        border: highlight
          ? "1.5px solid rgba(255,255,255,0.15)"
          : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: 4,
        p: { xs: 3, sm: 3.5 },
        boxShadow: highlight
          ? "0 32px 80px rgba(99,102,241,0.38), 0 0 0 1px rgba(99,102,241,0.2)"
          : isDark
          ? "0 4px 24px rgba(0,0,0,0.3)"
          : "0 4px 24px rgba(0,0,0,0.07)",
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
        "&:hover": {
          boxShadow: highlight
            ? "0 40px 100px rgba(99,102,241,0.45)"
            : isDark
            ? "0 8px 40px rgba(0,0,0,0.4)"
            : "0 8px 40px rgba(0,0,0,0.12)",
          transform: "translateY(-4px)",
        },
      }}
    >
      {badge && (
        <Box
          sx={{
            position: "absolute",
            top: -13,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: 1,
            px: 2,
            py: 0.5,
            borderRadius: 5,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(245,158,11,0.4)",
          }}
        >
          {badge}
        </Box>
      )}

      {/* Plan name */}
      <Typography
        sx={{
          color: highlight ? "rgba(255,255,255,0.75)" : "text.secondary",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          fontSize: 11,
          fontWeight: 700,
          mb: 1.5,
        }}
      >
        {plan}
      </Typography>

      {/* Price */}
      <Box display="flex" alignItems="baseline" gap={0.75} mb={0.5}>
        <Typography
          sx={{
            fontSize: { xs: 38, sm: 44 },
            fontWeight: 900,
            color: highlight ? "#fff" : "text.primary",
            lineHeight: 1,
            letterSpacing: -1,
          }}
        >
          {price}
        </Typography>
        {period && (
          <Typography
            sx={{
              color: highlight ? "rgba(255,255,255,0.6)" : "text.secondary",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            /{period}
          </Typography>
        )}
      </Box>

      {/* Divider */}
      <Box
        sx={{
          my: 2.5,
          height: "1px",
          background: highlight
            ? "rgba(255,255,255,0.15)"
            : isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.06)",
        }}
      />

      {/* Features list */}
      <Box display="flex" flexDirection="column" gap={1.25} mb={3} sx={{ flex: 1 }}>
        {features.map((f) => {
          const isNegative = f.startsWith("No ");
          return (
            <Box key={f} display="flex" alignItems="flex-start" gap={1.25}>
              {isNegative ? (
                <Cancel
                  sx={{
                    fontSize: 15,
                    color: highlight ? "rgba(255,255,255,0.3)" : "text.disabled",
                    mt: 0.2,
                    flexShrink: 0,
                  }}
                />
              ) : (
                <CheckCircle
                  sx={{
                    fontSize: 15,
                    color: highlight ? "rgba(167,243,208,0.95)" : "#10b981",
                    mt: 0.2,
                    flexShrink: 0,
                  }}
                />
              )}
              <Typography
                sx={{
                  fontSize: 13.5,
                  color: isNegative
                    ? highlight ? "rgba(255,255,255,0.4)" : "text.disabled"
                    : highlight ? "rgba(255,255,255,0.88)" : "text.secondary",
                  lineHeight: 1.55,
                }}
              >
                {f}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* CTA Button */}
      <Button
        fullWidth
        onClick={onCta}
        sx={{
          mt: "auto",
          py: 1.5,
          fontWeight: 700,
          borderRadius: 2.5,
          fontSize: 14.5,
          ...(highlight
            ? {
                background: "rgba(255,255,255,0.95)",
                color: "#4f46e5",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                "&:hover": {
                  background: "#fff",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                },
              }
            : {
                border: `1.5px solid ${isDark ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.35)"}`,
                color: "#6366f1",
                "&:hover": {
                  background: alpha("#6366f1", 0.07),
                  borderColor: "#6366f1",
                },
              }),
        }}
      >
        {cta}
      </Button>
    </Box>
  );
};

/* ─── Main Landing Page ────────────────────────────────────────── */
const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const features = [
    {
      icon: <Public />,
      title: "8+ Asset Classes",
      description:
        "Indian & US Equities, Mutual Funds, Commodities, Bonds, Crypto, and Global Indices - all in one place.",
      gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      delay: "0s",
    },
    {
      icon: <ShowChart />,
      title: "Advanced Charts",
      description:
        "Interactive candlestick, line, and area charts with 15+ technical indicators including MA, RSI, MACD, and Bollinger Bands.",
      gradient: "linear-gradient(135deg, #10b981, #059669)",
      delay: "0.1s",
    },
    {
      icon: <FilterList />,
      title: "Smart Screener",
      description:
        "Filter across 50+ parameters per asset class. Find your next opportunity with our lightning-fast screening engine.",
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
      delay: "0.2s",
    },
    {
      icon: <CompareArrows />,
      title: "Side-by-Side Compare",
      description:
        "Compare up to 5 instruments simultaneously. Visual heatmaps highlight the best performer in each metric.",
      gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
      delay: "0.3s",
    },
    {
      icon: <Notifications />,
      title: "Smart Watchlists",
      description:
        "Create unlimited watchlists (Premium), add personal notes, and track all your favorites in real-time.",
      gradient: "linear-gradient(135deg, #ec4899, #db2777)",
      delay: "0.4s",
    },
    {
      icon: <Security />,
      title: "Bank-Grade Security",
      description:
        "TLS 1.3 encryption, bcrypt password hashing, OWASP Top 10 compliance, and full SEBI guideline adherence.",
      gradient: "linear-gradient(135deg, #64748b, #475569)",
      delay: "0.5s",
    },
  ];

  const stats = [
    { value: 8, suffix: "+", label: "Asset Classes" },
    { value: 5234, suffix: "+", label: "Indian Stocks" },
    { value: 15000, suffix: "+", label: "Mutual Funds" },
    { value: 50, suffix: "+", label: "Global Indices" },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Wealth Manager, Mumbai",
      text: "Finsieve is the only platform I need for all my client research. The multi-asset comparison is unmatched.",
      rating: 5,
    },
    {
      name: "Arjun Mehta",
      role: "Active Trader, Bangalore",
      text: "The screening engine is incredibly powerful. I can find exactly the stocks I need within seconds.",
      rating: 5,
    },
    {
      name: "Neha Singh",
      role: "NRI Investor, Dubai",
      text: "Finally a platform that shows both Indian and US markets with INR conversion. Game changer for NRIs.",
      rating: 5,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: { xs: "100dvh", sm: "100vh" },
        background: isDark
          ? "linear-gradient(180deg, #060b14 0%, #0a0e17 100%)"
          : "linear-gradient(180deg, #f0f4ff 0%, #f8fafc 100%)",
        overflowX: "hidden",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* ── Navigation Bar ── */}
      <Box
        component="nav"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: isDark
            ? "rgba(6,11,20,0.85)"
            : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, sm: 3 } }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ height: { xs: 56, md: 64 }, minHeight: 56 }}
          >
            {/* Logo */}
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp sx={{ fontSize: 18, color: "#fff" }} />
              </Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 20,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: -0.5,
                }}
              >
                Finsieve
              </Typography>
            </Box>

            {/* Nav Links */}
            <Box display={{ xs: "none", md: "flex" }} gap={4}>
              {[
                { label: "Features", href: "#features", isRoute: false },
                { label: "Markets", href: "#markets", isRoute: false },
                { label: "Pricing", href: "#pricing", isRoute: false },
                { label: "About", href: "/about", isRoute: true },
              ].map(({ label, href, isRoute }) =>
                isRoute ? (
                  <Typography
                    key={label}
                    component={Link}
                    to={href}
                    sx={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "text.secondary",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "color 0.2s",
                      "&:hover": { color: "text.primary" },
                    }}
                  >
                    {label}
                  </Typography>
                ) : (
                  <Typography
                    key={label}
                    component="a"
                    href={href}
                    sx={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "text.secondary",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "color 0.2s",
                      "&:hover": { color: "text.primary" },
                    }}
                  >
                    {label}
                  </Typography>
                )
              )}
            </Box>

            {/* CTA Buttons */}
            <Box display="flex" gap={{ xs: 1, sm: 1.5 }} alignItems="center" flexWrap="wrap">
              <Button
                variant="text"
                onClick={() => navigate("/login")}
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: 13, sm: 14 },
                  color: "text.secondary",
                  minWidth: 0,
                  px: { xs: 1, sm: 1.5 },
                }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/register")}
                sx={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  fontWeight: 700,
                  fontSize: { xs: 13, sm: 14 },
                  px: { xs: 1.5, sm: 2.5 },
                  py: 0.875,
                  borderRadius: 2,
                  boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                    boxShadow: "0 6px 20px rgba(99,102,241,0.5)",
                  },
                }}
              >
                Start Free
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Hero Section ── */}
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: "100dvh", sm: "100vh" },
          display: "flex",
          alignItems: "center",
          pt: { xs: 6, sm: 8 },
          pb: { xs: 4, sm: 6 },
        }}
      >
        <HeroBackground />

        {/* Floating market cards — theme-aware so prices are visible on light/dark */}
        <FloatingCard
          symbol="NIFTY 50"
          value="24,834.85"
          change="1.24%"
          positive
          delay="0s"
          top="20%"
          left="4%"
          isDark={isDark}
        />
        <FloatingCard
          symbol="BTC/USD"
          value="$68,420"
          change="2.18%"
          positive
          delay="1s"
          top="30%"
          right="4%"
          isDark={isDark}
        />
        <FloatingCard
          symbol="TCS"
          value="₹3,856.40"
          change="0.87%"
          positive
          delay="2s"
          top="65%"
          left="5%"
          isDark={isDark}
        />
        <FloatingCard
          symbol="SENSEX"
          value="81,652.42"
          change="0.32%"
          positive={false}
          delay="1.5s"
          top="70%"
          right="5%"
          isDark={isDark}
        />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center", px: { xs: 2, sm: 3 } }}>
          {/* Badge */}
          <Chip
            icon={<Bolt sx={{ fontSize: 14 }} />}
            label="India's First 360° Investment Platform"
            sx={{
              mb: 4,
              background: isDark
                ? "rgba(99,102,241,0.15)"
                : "rgba(99,102,241,0.1)",
              color: "#6366f1",
              border: "1px solid rgba(99,102,241,0.25)",
              fontWeight: 600,
              fontSize: 12,
              px: 1,
              "& .MuiChip-icon": { color: "#6366f1" },
            }}
          />

          {/* Headline */}
          <Typography
            variant="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "2rem", sm: "3.2rem", md: "4.2rem" },
              lineHeight: 1.1,
              letterSpacing: -2,
              mb: 3,
              background: isDark
                ? "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)"
                : "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Invest Smarter.
            <br />
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Research Better.
            </Box>
          </Typography>

          {/* Subheadline */}
          <Typography
            variant="h6"
            sx={{
              color: "text.secondary",
              fontWeight: 400,
              lineHeight: 1.7,
              maxWidth: 600,
              mx: "auto",
              mb: 5,
              fontSize: { xs: "0.9375rem", sm: "1rem", md: "1.2rem" },
              px: { xs: 0, sm: 0 },
            }}
          >
            The most powerful investment intelligence platform in India. Compare
            stocks, funds, crypto, bonds, and commodities - all in one place,
            with institutional-grade analytics.
          </Typography>

          {/* CTA Buttons */}
          <Box
            display="flex"
            gap={{ xs: 1.5, sm: 2 }}
            justifyContent="center"
            flexWrap="wrap"
            mb={{ xs: 6, sm: 8 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/register")}
              endIcon={<ArrowForward sx={{ display: { xs: "none", sm: "block" } }} />}
              sx={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                fontWeight: 700,
                fontSize: { xs: 14, sm: 16 },
                px: { xs: 3, sm: 4 },
                py: { xs: 1.25, sm: 1.75 },
                borderRadius: 3,
                boxShadow: "0 8px 30px rgba(99,102,241,0.4)",
                "&:hover": {
                  background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                  boxShadow: "0 12px 40px rgba(99,102,241,0.5)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Start for Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/dashboard")}
              sx={{
                fontWeight: 600,
                fontSize: { xs: 14, sm: 16 },
                px: { xs: 3, sm: 4 },
                py: { xs: 1.25, sm: 1.75 },
                borderRadius: 3,
                borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                color: "text.primary",
                "&:hover": {
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  borderColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)",
                },
              }}
            >
              Explore Markets
            </Button>
          </Box>

          {/* Live market strip — visible on all screens (especially when FloatingCards hidden on xs) */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: { xs: 1.5, sm: 2.5 },
              mt: 4,
              p: 2,
              borderRadius: 2,
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.12)"}`,
            }}
          >
            {[
              { symbol: "NIFTY 50", value: "24,834.85", change: "+1.24%", up: true },
              { symbol: "SENSEX", value: "81,652", change: "+0.32%", up: true },
              { symbol: "BTC/USD", value: "$68,420", change: "+2.18%", up: true },
              { symbol: "TCS", value: "₹3,856", change: "+0.87%", up: true },
            ].map((m) => (
              <Box
                key={m.symbol}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)",
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary" }}>
                  {m.symbol}
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "text.primary" }}>
                  {m.value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: m.up ? "#10b981" : "#ef4444",
                  }}
                >
                  {m.change}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Trust indicators */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={3}
            flexWrap="wrap"
            mt={3}
          >
            {["SEBI Compliant", "Bank-Grade Security", "15-min Delayed Data (Free)"].map((t) => (
              <Box key={t} display="flex" alignItems="center" gap={0.75}>
                <CheckCircle sx={{ fontSize: 14, color: "#10b981" }} />
                <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 500 }}>
                  {t}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Stats Banner ── */}
      <Box
        sx={{
          background: isDark
            ? "rgba(99,102,241,0.08)"
            : "rgba(99,102,241,0.04)",
          borderTop: `1px solid ${isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)"}`,
          borderBottom: `1px solid ${isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)"}`,
          py: { xs: 3, sm: 5 },
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Grid container spacing={4} justifyContent="center">
            {stats.map((s) => (
              <Grid size={{ xs: 6, sm: 3 }} key={s.label} textAlign="center">
                <Typography
                  sx={{
                    fontSize: { xs: "2rem", md: "2.8rem" },
                    fontWeight: 900,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    lineHeight: 1,
                    mb: 0.5,
                  }}
                >
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </Typography>
                <Typography sx={{ fontSize: 14, color: "text.secondary", fontWeight: 500 }}>
                  {s.label}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Features Section ── */}
      <Box id="features" sx={{ py: { xs: 6, sm: 10, md: 14 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box textAlign="center" mb={8}>
            <Chip
              label="FEATURES"
              size="small"
              sx={{
                mb: 2,
                background: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)",
                color: "#6366f1",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 1.5,
              }}
            />
            <Typography
              variant="h2"
              fontWeight={800}
              sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, letterSpacing: -1, mb: 2 }}
            >
              Everything you need to{" "}
              <Box
                component="span"
                sx={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                invest with confidence
              </Box>
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 520, mx: "auto", fontSize: 16, lineHeight: 1.7 }}>
              From basic research to institutional-grade analysis, Finsieve gives
              you every tool you need - completely free to start.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {features.map((f) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={f.title}>
                <FeatureCard {...f} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Markets Section ── */}
      <Box
        id="markets"
        sx={{
          py: { xs: 10, md: 14 },
          background: isDark ? "rgba(17,24,39,0.4)" : "rgba(248,250,252,0.8)",
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Chip
              label="MARKETS"
              size="small"
              sx={{
                mb: 2,
                background: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
                color: "#10b981",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 1.5,
              }}
            />
            <Typography
              variant="h2"
              fontWeight={800}
              sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, letterSpacing: -1, mb: 2 }}
            >
              All markets.{" "}
              <Box
                component="span"
                sx={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                One platform.
              </Box>
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {[
              { name: "Indian Equities", desc: "NSE & BSE listed stocks", count: "5,000+", icon: "🇮🇳", path: "/equities/indian" },
              { name: "US Equities", desc: "NYSE & NASDAQ stocks", count: "8,000+", icon: "🇺🇸", path: "/equities/us" },
              { name: "Mutual Funds", desc: "All AMFI registered schemes", count: "15,000+", icon: "📊", path: "/mutual-funds" },
              { name: "Global Indices", desc: "Major indices worldwide", count: "50+", icon: "🌍", path: "/indices" },
              { name: "Cryptocurrencies", desc: "Top 100 by market cap", count: "100+", icon: "₿", path: "/crypto" },
              { name: "Commodities", desc: "MCX & NCDEX contracts", count: "30+", icon: "🏆", path: "/commodities" },
              { name: "Bonds", desc: "Corporate & Government bonds", count: "1,000+", icon: "📃", path: "/bonds" },
              { name: "Treasury", desc: "G-Secs & T-Bills", count: "200+", icon: "🏛️", path: "/bonds" },
            ].map((market) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={market.name}>
                <Box
                  onClick={() => navigate(market.path)}
                  sx={{
                    background: isDark ? "rgba(17,24,39,0.7)" : "#fff",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                    borderRadius: 3,
                    p: 3,
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      borderColor: alpha("#6366f1", 0.3),
                      boxShadow: `0 12px 40px ${alpha("#6366f1", 0.1)}`,
                    },
                  }}
                >
                  <Typography sx={{ fontSize: 28, mb: 1.5 }}>{market.icon}</Typography>
                  <Typography fontWeight={700} mb={0.5} fontSize={15}>
                    {market.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {market.desc}
                  </Typography>
                  <Chip
                    label={market.count + " instruments"}
                    size="small"
                    sx={{
                      background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.07)",
                      color: "#6366f1",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Pricing Section ── */}
      <Box id="pricing" sx={{ py: { xs: 8, md: 12 }, pb: { xs: 10, md: 16 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={{ xs: 6, md: 8 }}>
            <Chip
              label="PRICING"
              size="small"
              sx={{
                mb: 2,
                background: isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.08)",
                color: "#f59e0b",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 1.5,
              }}
            />
            <Typography
              variant="h2"
              fontWeight={800}
              sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, letterSpacing: -1, mb: 2 }}
            >
              Simple, transparent pricing
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 460, mx: "auto", fontSize: 16 }}>
              Start for free. Upgrade when you need more power.
            </Typography>
          </Box>

          {/* pt: 2 so the badge chip (position:absolute, top:-13) isn't clipped */}
          <Grid
            container
            spacing={3}
            alignItems="stretch"
            justifyContent="center"
            sx={{ pt: 2 }}
          >
            {PLANS.map((plan) => {
              const monthlyBilling = plan.billing.find((b) => b.period === "monthly") ?? plan.billing[0];
              const isFree = plan.id === "explorer";
              const isElite = plan.id === "elite";
              return (
                <Grid key={plan.id} size={{ xs: 12, sm: 10, md: 4 }}>
                  <PricingCard
                    plan={plan.name}
                    price={isFree ? "₹0" : `₹${monthlyBilling.perMonth.toLocaleString("en-IN")}`}
                    period={isFree ? "forever" : "month"}
                    features={plan.features}
                    cta={isFree ? "Get Started Free" : isElite ? "See Elite Plans" : `Start ${plan.trialDays}-Day Free Trial`}
                    highlight={!!plan.highlighted}
                    badge={plan.highlighted ? "MOST POPULAR" : undefined}
                    onCta={() => isFree ? navigate("/register") : navigate("/pricing")}
                  />
                </Grid>
              );
            })}
          </Grid>

          <Typography
            textAlign="center"
            sx={{ mt: 5, fontSize: 13, color: "text.disabled" }}
          >
            All plans include a 14-day free trial · No credit card required to start
          </Typography>
        </Container>
      </Box>

      {/* ── Testimonials ── */}
      <Box
        sx={{
          py: { xs: 10, md: 12 },
          background: isDark ? "rgba(17,24,39,0.5)" : "rgba(248,250,252,0.9)",
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7}>
            <Typography
              variant="h2"
              fontWeight={800}
              sx={{ fontSize: { xs: "1.8rem", md: "2.4rem" }, letterSpacing: -1, mb: 2 }}
            >
              Trusted by investors across India
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {testimonials.map((t) => (
              <Grid size={{ xs: 12, md: 4 }} key={t.name}>
                <Box
                  sx={{
                    background: isDark ? "rgba(17,24,39,0.7)" : "#fff",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                    borderRadius: 3,
                    p: 3.5,
                    height: "100%",
                  }}
                >
                  <Box display="flex" gap={0.5} mb={2}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} sx={{ fontSize: 16, color: "#f59e0b" }} />
                    ))}
                  </Box>
                  <Typography sx={{ fontSize: 15, color: "text.secondary", lineHeight: 1.7, mb: 3, fontStyle: "italic" }}>
                    "{t.text}"
                  </Typography>
                  <Box>
                    <Typography fontWeight={700} fontSize={14}>{t.name}</Typography>
                    <Typography fontSize={13} color="text.secondary">{t.role}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Final CTA ── */}
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <Container maxWidth="sm" sx={{ position: "relative", textAlign: "center" }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
              boxShadow: "0 12px 40px rgba(99,102,241,0.35)",
            }}
          >
            <Speed sx={{ fontSize: 32, color: "#fff" }} />
          </Box>
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{ fontSize: { xs: "2rem", md: "2.6rem" }, letterSpacing: -1, mb: 2 }}
          >
            Start your investment journey today
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4, fontSize: 16, lineHeight: 1.7 }}>
            Join thousands of investors who use Finsieve to research smarter, 
            compare faster, and invest with confidence.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/register")}
            endIcon={<ArrowForward />}
            sx={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              fontWeight: 700,
              fontSize: 17,
              px: 5,
              py: 2,
              borderRadius: 3,
              boxShadow: "0 8px 30px rgba(99,102,241,0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                boxShadow: "0 12px 40px rgba(99,102,241,0.5)",
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Create Free Account
          </Button>
          <Typography sx={{ mt: 2.5, fontSize: 13, color: "text.secondary" }}>
            No credit card required · Free forever plan available
          </Typography>
        </Container>
      </Box>

      {/* ── Footer ── */}
      <Box
        component="footer"
        sx={{
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          py: 5,
        }}
      >
        <Container maxWidth="lg">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp sx={{ fontSize: 14, color: "#fff" }} />
              </Box>
              <Typography fontWeight={700} fontSize={15} sx={{ color: "#6366f1" }}>
                Finsieve
              </Typography>
            </Box>
            <Typography fontSize={13} color="text.secondary">
              © 2026 Finsieve. All rights reserved.
            </Typography>
            <Box display="flex" gap={3}>
              <Typography
                component={Link}
                to="/about"
                sx={{ fontSize: 13, color: "text.secondary", textDecoration: "none", "&:hover": { color: "text.primary" } }}
              >
                About
              </Typography>
              {["Privacy", "Terms", "Disclaimer"].map((l) => (
                <Typography
                  key={l}
                  component="span"
                  title="Coming soon"
                  sx={{ fontSize: 13, color: "text.disabled", cursor: "default" }}
                >
                  {l}
                </Typography>
              ))}
            </Box>
          </Box>
          <Box mt={3} pt={3} borderTop={`1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`}>
            <Typography fontSize={11} color="text.disabled" lineHeight={1.6}>
              Disclaimer: Finsieve provides investment information for educational and research purposes only. 
              We are not a SEBI Registered Investment Advisor. The data provided does not constitute investment advice. 
              Please consult a qualified financial advisor before making investment decisions. 
              Market data may be delayed by up to 15 minutes for free users.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
