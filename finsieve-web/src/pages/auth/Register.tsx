import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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
  LinearProgress,
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

const Register = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Client-side validation
    const validationErrors: string[] = [];

    if (formData.password !== formData.confirmPassword) {
      validationErrors.push("Passwords do not match");
    }

    if (passwordStrength < 75) {
      validationErrors.push(
        "Password is too weak. Please use a stronger password.",
      );
    }

    // Validate phone number (7-15 digits, optional + prefix)
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    if (!phoneRegex.test(formData.phone)) {
      validationErrors.push(
        "Please provide a valid mobile number (e.g., +919876543210)",
      );
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      if (response?.success) {
        toast.success(
          response.message ||
            "Registration successful! Please check your email to verify your account.",
        );
        navigate("/verify-email", { state: { email: formData.email } });
      } else {
        setErrors([response?.message || "Registration failed"]);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { errors?: Array<{ msg?: string; message?: string }>; message?: string }; message?: string }; message?: string };
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const backendErrors = errorData.errors.map(
          (e: { msg?: string; message?: string }) => e.msg || e.message || String(e),
        );
        setErrors(backendErrors);
      } else if (errorData?.message) {
        setErrors([errorData.message]);
      } else if (err.message) {
        setErrors([err.message]);
      } else {
        setErrors(["An error occurred during registration. Please try again."]);
      }
    } finally {
      setLoading(false);
    }
  };
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return "error";
    if (passwordStrength < 75) return "warning";
    return "success";
  };

  const handleGoogleSignup = () => {
    toast("Google OAuth integration coming soon!", { icon: "ℹ️" });
  };

  const handleMicrosoftSignup = () => {
    toast("Microsoft OAuth integration coming soon!", { icon: "ℹ️" });
  };

  const handleAppleSignup = () => {
    toast("Apple Sign-In integration coming soon!", { icon: "ℹ️" });
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
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}
            >
              Create Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join Finsieve and start your investment journey
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
                mb: 2,
              }}
            >
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                autoFocus
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Box>

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              margin="normal"
              autoComplete="email"
            />

            <TextField
              fullWidth
              label="Mobile Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              margin="normal"
              autoComplete="tel"
              placeholder="+919876543210"
              helperText="Include country code (e.g., +91 for India)"
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

            {formData.password && (
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength}
                  color={getPasswordStrengthColor()}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Password strength:{" "}
                  {passwordStrength < 50
                    ? "Weak"
                    : passwordStrength < 75
                      ? "Medium"
                      : "Strong"}
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              margin="normal"
            />

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
              {loading ? "Creating account..." : "Create Account"}
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
            onClick={handleGoogleSignup}
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
            onClick={handleMicrosoftSignup}
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
            onClick={handleAppleSignup}
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
              Already have an account?{" "}
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  fontWeight: 700,
                  textDecoration: "none",
                  color: theme.palette.primary.main,
                  "&:hover": {
                    color: theme.palette.primary.dark,
                  },
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
