import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Container,
  useTheme,
} from "@mui/material";
import { TrendingUp, ArrowBack, Business, Person } from "@mui/icons-material";

const AboutUs = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

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
      {/* Navigation Bar */}
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
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{ cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
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
            <Box display="flex" flexWrap="wrap" gap={1} alignItems="center" justifyContent="flex-end">
              <Button
                variant="text"
                startIcon={<ArrowBack />}
                onClick={() => navigate("/")}
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: 13, sm: 14 },
                  color: "text.secondary",
                  minWidth: 0,
                  px: { xs: 1, sm: 1.5 },
                  "&:hover": { color: "text.primary" },
                }}
              >
                Back to Home
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/register")}
                sx={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  fontWeight: 700,
                  fontSize: { xs: 13, sm: 14 },
                  px: { xs: 2, sm: 2.5 },
                  py: 0.875,
                  borderRadius: 2,
                  boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                    boxShadow: "0 6px 20px rgba(99,102,241,0.5)",
                  },
                }}
              >
                Get Started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Content */}
      <Box sx={{ pt: { xs: 10, sm: 12 }, pb: 8 }}>
        <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "2rem", sm: "2.75rem" },
              letterSpacing: -1,
              mb: 1,
              background: isDark
                ? "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)"
                : "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            About Us
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 5, fontSize: 16, lineHeight: 1.6 }}>
            Learn more about Finsieve and the people behind it.
          </Typography>

          {/* About the Company */}
          <Box
            sx={{
              mb: 6,
              p: { xs: 2.5, sm: 4 },
              borderRadius: 3,
              background: isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(255,255,255,0.8)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.12)"}`,
              boxShadow: isDark
                ? "0 8px 32px rgba(0,0,0,0.2)"
                : "0 8px 32px rgba(99,102,241,0.08)",
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Business sx={{ fontSize: 24, color: "#fff" }} />
              </Box>
              <Typography variant="h2" sx={{ fontWeight: 700, fontSize: "1.5rem" }}>
                About the Company
              </Typography>
            </Box>
            <Typography color="text.secondary" sx={{ lineHeight: 1.8, fontSize: 15 }}>
              Finsieve is India&apos;s first 360° investment intelligence platform, built to help investors
              research smarter, compare faster, and make informed decisions across asset classes.
              We bring Indian and US equities, mutual funds, commodities, bonds, cryptocurrencies,
              and global indices into one unified experience—with institutional-grade analytics,
              advanced screening, and side-by-side comparison tools.
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.8, fontSize: 15, mt: 2 }}>
              Our mission is to democratize access to professional-grade investment research.
              Whether you&apos;re a retail investor, wealth manager, or NRI, Finsieve gives you the data
              and tools you need—with bank-grade security and full adherence to SEBI guidelines.
            </Typography>
          </Box>

          {/* Founder */}
          <Box
            sx={{
              p: { xs: 2.5, sm: 4 },
              borderRadius: 3,
              background: isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(255,255,255,0.8)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.12)"}`,
              boxShadow: isDark
                ? "0 8px 32px rgba(0,0,0,0.2)"
                : "0 8px 32px rgba(99,102,241,0.08)",
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Person sx={{ fontSize: 24, color: "#fff" }} />
              </Box>
              <Typography variant="h2" sx={{ fontWeight: 700, fontSize: "1.5rem" }}>
                Founder
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 18, color: "text.primary", mb: 1 }}>
              Mahesh Mishra
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.8, fontSize: 15 }}>
              Finsieve was founded by Mahesh Mishra with a vision to simplify investment research
              for every Indian investor. Combining deep domain expertise in markets and technology,
              Mahesh leads the team in building a platform that is both powerful and accessible—
              so you can focus on what matters: making better investment decisions.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
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
            <Typography
              component="a"
              href="/"
              sx={{ fontSize: 13, color: "text.secondary", textDecoration: "none", "&:hover": { color: "text.primary" } }}
            >
              Home
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default AboutUs;
