import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  alpha,
  useTheme,
} from "@mui/material";
import { EmailOutlined, ArrowBack } from "@mui/icons-material";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setEmailSent(true);
      setLoading(false);
      toast.success("Password reset link sent to your email!");
    }, 1500);
  };

  return (
    <Box>
      <Card
        elevation={0}
        sx={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
          borderRadius: "16px",
          backdropFilter: "blur(20px)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          {!emailSent ? (
            <>
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <EmailOutlined
                    sx={{ fontSize: 28, color: theme.palette.primary.main }}
                  />
                </Box>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}
                >
                  Forgot Password?
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  No worries! Enter your email and we'll send you reset
                  instructions.
                </Typography>
              </Box>

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="you@example.com"
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                    "&:hover": {
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                    },
                  }}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <Box sx={{ textAlign: "center", mt: 3 }}>
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    textDecoration: "none",
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                    "&:hover": {
                      color: theme.palette.primary.dark,
                    },
                  }}
                >
                  <ArrowBack sx={{ fontSize: 16 }} />
                  Back to Sign In
                </Link>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.1)} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <EmailOutlined
                  sx={{ fontSize: 40, color: theme.palette.success.main }}
                />
              </Box>
              <Typography
                variant="h4"
                gutterBottom
                sx={{ fontWeight: 800, color: "text.primary", mb: 2 }}
              >
                Check Your Email
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                We've sent a password reset link to <strong>{email}</strong>
                <br />
                Please check your inbox and follow the instructions.
              </Typography>

              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                size="large"
                startIcon={<ArrowBack />}
                sx={{
                  borderWidth: 2,
                  fontWeight: 600,
                  "&:hover": {
                    borderWidth: 2,
                  },
                }}
              >
                Back to Sign In
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
