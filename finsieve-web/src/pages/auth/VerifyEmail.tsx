import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
} from "@mui/material";
import {
  CheckCircle,
  Error as ErrorIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import authService from "../../services/auth/authService";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = searchParams.get("token");
  const emailFromState = location.state?.email;

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setError("Invalid verification link");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const response = await authService.verifyEmail({ token });

      if (response.success) {
        setVerified(true);
        toast.success("Email verified successfully!");
      } else {
        setError(response.message || "Verification failed");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const errorMessage = e.response?.data?.message || "Verification failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token, verifyEmail]);

  useEffect(() => {
    if (verified && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (verified && countdown === 0) {
      navigate("/dashboard");
    }
  }, [verified, countdown, navigate]);

  const handleResendEmail = async () => {
    if (!emailFromState) {
      toast.error("Email address not found. Please register again.");
      navigate("/register");
      return;
    }

    setResending(true);
    try {
      const response =
        await authService.resendVerificationEmail(emailFromState);

      if (response.success) {
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        toast.error(response.message || "Failed to resend email");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(
        e.response?.data?.message || "Failed to resend verification email",
      );
    } finally {
      setResending(false);
    }
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
        <CardContent sx={{ p: { xs: 4, sm: 6 }, textAlign: "center" }}>
          {/* Verification Status */}
          {verifying && (
            <Box>
              <CircularProgress
                size={80}
                thickness={4}
                sx={{
                  mb: 3,
                  color: theme.palette.primary.main,
                }}
              />
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 700, color: "#0f172a" }}
              >
                Verifying Your Email
              </Typography>
              <Typography variant="body1" sx={{ color: "#64748b" }}>
                Please wait while we verify your email address...
              </Typography>
            </Box>
          )}

          {verified && (
            <Box>
              <CheckCircle
                sx={{
                  fontSize: 80,
                  color: theme.palette.success.main,
                  mb: 3,
                }}
              />
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 700, color: theme.palette.success.main }}
              >
                Email Verified Successfully!
              </Typography>
              <Typography variant="body1" sx={{ color: "#64748b", mb: 3 }}>
                Your email has been verified. Redirecting to dashboard in{" "}
                {countdown} seconds...
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/dashboard")}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                  "&:hover": {
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                  },
                }}
              >
                Go to Dashboard Now
              </Button>
            </Box>
          )}

          {error && !verifying && (
            <Box>
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: theme.palette.error.main,
                  mb: 3,
                }}
              />
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 700, color: theme.palette.error.main }}
              >
                Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
                {error}
              </Alert>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {emailFromState && (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleResendEmail}
                    disabled={resending}
                    startIcon={
                      resending ? <CircularProgress size={20} /> : <EmailIcon />
                    }
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      py: 1.5,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                      "&:hover": {
                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                      },
                    }}
                  >
                    {resending ? "Sending..." : "Resend Verification Email"}
                  </Button>
                )}

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/login")}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    py: 1.5,
                    borderWidth: 2,
                    borderColor: "rgba(0,0,0,0.15)",
                    color: "#0f172a",
                    "&:hover": {
                      borderWidth: 2,
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  Back to Login
                </Button>
              </Box>
            </Box>
          )}

          {!token && !verifying && !error && (
            <Box>
              <EmailIcon
                sx={{
                  fontSize: 80,
                  color: theme.palette.primary.main,
                  mb: 3,
                }}
              />
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 700, color: "#0f172a" }}
              >
                Check Your Email
              </Typography>
              <Typography variant="body1" sx={{ color: "#64748b", mb: 3 }}>
                We've sent a verification link to <br />
                <strong>{emailFromState}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 4 }}>
                Please check your inbox and click the verification link to
                activate your account.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleResendEmail}
                  disabled={resending}
                  startIcon={
                    resending ? <CircularProgress size={20} /> : <EmailIcon />
                  }
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                    "&:hover": {
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                    },
                  }}
                >
                  {resending ? "Sending..." : "Resend Verification Email"}
                </Button>

                <Button
                  variant="text"
                  onClick={() => navigate("/login")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                  }}
                >
                  Back to Login
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerifyEmail;
