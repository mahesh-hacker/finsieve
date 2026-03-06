import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Divider,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Alert,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import authService from "../../services/auth/authService";
import { loginSuccess, logout } from "../../store/slices/authSlice";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();

  // If user navigates back to login while authenticated, log them out
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(logout());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === "rememberMe" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const response = await authService.login(formData);

      if (response.success && response.data) {
        dispatch(loginSuccess(response.data));
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        // Handle unsuccessful response
        const errorMessage =
          response.message || "Login failed. Please try again.";
        setErrors([errorMessage]);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { errors?: Array<{ msg?: string; message?: string }>; message?: string }; message?: string }; message?: string };
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const backendErrors = errorData.errors.map(
          (e: { msg?: string; message?: string }) => e.msg || e.message || "Validation error",
        );
        setErrors(backendErrors);
      } else if (errorData?.message) {
        // Backend error message
        setErrors([errorData.message]);
      } else if (err.message) {
        setErrors([err.message]);
      } else {
        // Fallback error
        const fallbackError = "Invalid email or password. Please try again.";
        setErrors([fallbackError]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    toast("Google OAuth integration coming soon!", { icon: "ℹ️" });
  };

  const handleMicrosoftLogin = async () => {
    toast("Microsoft OAuth integration coming soon!", { icon: "ℹ️" });
  };

  const handleAppleLogin = async () => {
    toast("Apple Sign-In integration coming soon!", { icon: "ℹ️" });
  };

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Card
        elevation={0}
        sx={{
          background: theme.palette.mode === "dark" ? "rgba(17,24,39,0.95)" : "rgba(255,255,255,0.92)",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.mode === "dark" ? "0 20px 60px rgba(0,0,0,0.4)" : "0 20px 60px rgba(0, 0, 0, 0.08)",
          borderRadius: "16px",
          backdropFilter: "blur(20px)",
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 4, md: 5 } }}>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                color: "text.primary",
                mb: 1,
              }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to access your investment dashboard
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email or Mobile Number"
              name="emailOrPhone"
              type="text"
              value={formData.emailOrPhone}
              onChange={handleChange}
              required
              margin="normal"
              autoComplete="username"
              autoFocus
              placeholder="you@example.com or +919876543210"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              required
              margin="normal"
              autoComplete="current-password"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 1.5,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Remember me
                  </Typography>
                }
              />
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                sx={{
                  textDecoration: "none",
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  "&:hover": {
                    color: theme.palette.primary.dark,
                  },
                }}
              >
                Forgot Password?
              </Link>
            </Box>

            {/* Display validation errors */}
            {errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.length === 1 ? (
                  errors[0]
                ) : (
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </Box>
                )}
              </Alert>
            )}

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
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              OR
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{
              mb: 1.5,
              py: 1.5,
              borderWidth: 2,
              borderColor: alpha(theme.palette.text.secondary, 0.2),
              fontWeight: 600,
              "&:hover": {
                borderWidth: 2,
                borderColor: theme.palette.primary.main,
                background: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            Continue with Google
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 23 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 0H0V11H11V0Z" fill="#F25022" />
                <path d="M23 0H12V11H23V0Z" fill="#7FBA00" />
                <path d="M11 12H0V23H11V12Z" fill="#00A4EF" />
                <path d="M23 12H12V23H23V12Z" fill="#FFB900" />
              </svg>
            }
            onClick={handleMicrosoftLogin}
            sx={{
              mb: 1.5,
              py: 1.5,
              borderWidth: 2,
              borderColor: alpha(theme.palette.text.secondary, 0.2),
              fontWeight: 600,
              "&:hover": {
                borderWidth: 2,
                borderColor: "#00A4EF",
                background: alpha("#00A4EF", 0.05),
              },
            }}
          >
            Continue with Microsoft
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.53-3.23 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            }
            onClick={handleAppleLogin}
            sx={{
              mb: 2,
              py: 1.5,
              borderWidth: 2,
              borderColor: alpha(theme.palette.text.secondary, 0.2),
              fontWeight: 600,
              "&:hover": {
                borderWidth: 2,
                borderColor: "#000",
                background: alpha("#000", 0.05),
              },
            }}
          >
            Continue with Apple
          </Button>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{" "}
              <Link
                component={RouterLink}
                to="/register"
                sx={{
                  fontWeight: 700,
                  textDecoration: "none",
                  color: theme.palette.primary.main,
                  "&:hover": {
                    color: theme.palette.primary.dark,
                  },
                }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
