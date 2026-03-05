import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  InputAdornment,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  LinearProgress,
} from "@mui/material";
import {
  Person,
  Security,
  Notifications,
  Palette,
  CreditCard,
  Logout,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Star,
  Edit,
  DeleteForever,
  Shield,
  PhoneAndroid,
  Email,
  Lock,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { RootState } from "../../store";
import { logout, setUser } from "../../store/slices/authSlice";
import { useThemeContext } from "../../contexts/ThemeContext";
import apiService from "../../services/common/apiService";

const SIDEBAR_ITEMS = [
  { key: "profile", icon: <Person />, label: "Profile" },
  { key: "security", icon: <Security />, label: "Security" },
  { key: "notifications", icon: <Notifications />, label: "Notifications" },
  { key: "appearance", icon: <Palette />, label: "Appearance" },
  { key: "subscription", icon: <CreditCard />, label: "Subscription" },
];

/* ─── Password Strength ────────────────────────────────────────── */
const getPasswordStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const strengthLabels = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const strengthColors = ["", "#ef4444", "#f97316", "#f59e0b", "#10b981", "#059669"];

/* ─── Profile Section ──────────────────────────────────────────── */
const ProfileSection = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    if (user) {
      dispatch(
        setUser({
          ...user,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        })
      );
    }
    toast.success("Profile updated successfully");
    setSaving(false);
  };

  const initials = `${form.firstName[0] || "U"}${form.lastName[0] || ""}`.toUpperCase();
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "Unknown";

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={3}>Profile Information</Typography>

      {/* Avatar Section */}
      <Card
        sx={{
          borderRadius: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.primary.main, 0.02)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
            <Box position="relative">
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                {initials}
              </Avatar>
              <IconButton
                size="small"
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  background: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  width: 28,
                  height: 28,
                }}
              >
                <Edit sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            <Box flex={1}>
              <Typography fontWeight={700} fontSize={18}>
                {form.firstName} {form.lastName}
              </Typography>
              <Typography color="text.secondary" fontSize={14}>{form.email}</Typography>
              <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                <Chip
                  label={user?.userTier || "FREE"}
                  size="small"
                  icon={<Star sx={{ fontSize: 12, color: "#f59e0b !important" }} />}
                  sx={{
                    background: alpha("#f59e0b", 0.1),
                    color: "#f59e0b",
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                />
                <Chip
                  label={`Member since ${joinDate}`}
                  size="small"
                  sx={{ fontWeight: 500, fontSize: 11 }}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Form */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Email Address"
                value={form.email}
                disabled
                helperText="Email cannot be changed. Contact support if needed."
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Chip label="Verified" size="small" icon={<CheckCircle sx={{ fontSize: 12 }} />} sx={{ color: "#10b981", background: alpha("#10b981", 0.1) }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PhoneAndroid fontSize="small" /></InputAdornment>,
                }}
              />
            </Grid>
          </Grid>

          <Box display="flex" gap={1.5} mt={3} justifyContent="flex-end">
            <Button variant="outlined" onClick={() => setForm({ firstName: user?.firstName || "", lastName: user?.lastName || "", phone: user?.phone || "", email: user?.email || "" })}>
              Reset
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ minWidth: 120 }}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

/* ─── Security Section ─────────────────────────────────────────── */
const SecuritySection = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ current: "", newPwd: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);

  const strength = getPasswordStrength(form.newPwd);

  const handleChangePassword = async () => {
    const errs: string[] = [];
    if (!form.current) errs.push("Current password is required");
    if (form.newPwd.length < 8) errs.push("New password must be at least 8 characters");
    if (!/[A-Z]/.test(form.newPwd)) errs.push("Password must contain at least 1 uppercase letter");
    if (!/[0-9]/.test(form.newPwd)) errs.push("Password must contain at least 1 number");
    if (!/[^A-Za-z0-9]/.test(form.newPwd)) errs.push("Password must contain at least 1 special character");
    if (form.newPwd !== form.confirm) errs.push("Passwords do not match");
    setErrors(errs);
    if (errs.length) return;

    setSaving(true);
    try {
      await apiService.post("/auth/change-password", { currentPassword: form.current, newPassword: form.newPwd });
      toast.success("Password changed successfully");
      setForm({ current: "", newPwd: "", confirm: "" });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Failed to change password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const sessions = [
    { device: "Chrome on macOS", location: "Mumbai, India", current: true, lastActive: "Now" },
    { device: "Safari on iPhone 15", location: "Mumbai, India", current: false, lastActive: "2 hours ago" },
    { device: "Chrome on Windows", location: "Bangalore, India", current: false, lastActive: "3 days ago" },
  ];

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={3}>Security Settings</Typography>

      {/* Change Password */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
            <Lock sx={{ color: "primary.main" }} />
            <Typography fontWeight={700} fontSize={16}>Change Password</Typography>
          </Box>

          {errors.length > 0 && (
            <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Current Password"
                type={showCurrent ? "text" : "password"}
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCurrent(!showCurrent)} size="small">
                        {showCurrent ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="New Password"
                type={showNew ? "text" : "password"}
                value={form.newPwd}
                onChange={(e) => setForm({ ...form, newPwd: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNew(!showNew)} size="small">
                        {showNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {form.newPwd && (
                <Box mt={1}>
                  <LinearProgress
                    variant="determinate"
                    value={(strength / 5) * 100}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "divider",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: strengthColors[strength],
                        transition: "all 0.3s ease",
                      },
                    }}
                  />
                  <Typography sx={{ fontSize: 11, color: strengthColors[strength], mt: 0.5, fontWeight: 600 }}>
                    {strengthLabels[strength]}
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                error={form.confirm.length > 0 && form.newPwd !== form.confirm}
                helperText={form.confirm.length > 0 && form.newPwd !== form.confirm ? "Passwords do not match" : ""}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirm(!showConfirm)} size="small">
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={saving}
              sx={{ minWidth: 160 }}
            >
              {saving ? "Changing..." : "Change Password"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Shield sx={{ color: twoFaEnabled ? "#10b981" : "text.secondary" }} />
              <Box>
                <Typography fontWeight={700} fontSize={15}>Two-Factor Authentication</Typography>
                <Typography variant="body2" color="text.secondary">
                  Add an extra layer of security to your account
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1.5}>
              {twoFaEnabled && (
                <Chip label="Enabled" size="small" sx={{ color: "#10b981", background: alpha("#10b981", 0.1), fontWeight: 600 }} />
              )}
              <Switch
                checked={twoFaEnabled}
                onChange={(e) => {
                  setTwoFaEnabled(e.target.checked);
                  toast.success(e.target.checked ? "2FA enabled" : "2FA disabled");
                }}
                color="success"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
            <PhoneAndroid sx={{ color: "primary.main" }} />
            <Typography fontWeight={700} fontSize={16}>Active Sessions</Typography>
          </Box>
          {sessions.map((s, i) => (
            <Box key={i}>
              {i > 0 && <Divider sx={{ my: 1.5 }} />}
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontWeight={600} fontSize={14}>{s.device}</Typography>
                    {s.current && (
                      <Chip label="Current" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600, color: "#10b981", background: alpha("#10b981", 0.1) }} />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontSize={12}>
                    {s.location} · {s.lastActive}
                  </Typography>
                </Box>
                {!s.current && (
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => toast.success(`Session on ${s.device} revoked`)}
                    sx={{ fontSize: 12 }}
                  >
                    Revoke
                  </Button>
                )}
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

type NotifPrefs = {
  email_market_summary: boolean;
  email_watchlist_alerts: boolean;
  email_news_digest: boolean;
  email_product_updates: boolean;
  push_price_alerts: boolean;
  push_news: boolean;
};

const NotifRow = ({
  title,
  subtitle,
  pref,
  prefs,
  onToggle,
}: {
  title: string;
  subtitle: string;
  pref: keyof NotifPrefs;
  prefs: NotifPrefs;
  onToggle: (key: keyof NotifPrefs) => void;
}) => (
  <Box display="flex" alignItems="center" justifyContent="space-between" py={1.5}>
    <Box>
      <Typography fontWeight={600} fontSize={14}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" fontSize={12}>{subtitle}</Typography>
    </Box>
    <Switch checked={prefs[pref]} onChange={() => onToggle(pref)} />
  </Box>
);

/* ─── Notifications Section ────────────────────────────────────── */
const NotificationsSection = () => {
  const [prefs, setPrefs] = useState<NotifPrefs>({
    email_market_summary: true,
    email_watchlist_alerts: false,
    email_news_digest: true,
    email_product_updates: false,
    push_price_alerts: true,
    push_news: false,
  });

  const toggle = (key: keyof NotifPrefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={3}>Notification Preferences</Typography>
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Email sx={{ color: "primary.main" }} />
            <Typography fontWeight={700} fontSize={16}>Email Notifications</Typography>
          </Box>
          <Divider sx={{ mb: 1 }} />
          <NotifRow title="Daily Market Summary" subtitle="Receive end-of-day market recap" pref="email_market_summary" prefs={prefs} onToggle={toggle} />
          <Divider />
          <NotifRow title="Watchlist Alerts" subtitle="Price movement notifications for watched stocks" pref="email_watchlist_alerts" prefs={prefs} onToggle={toggle} />
          <Divider />
          <NotifRow title="News Digest" subtitle="Weekly curated financial news" pref="email_news_digest" prefs={prefs} onToggle={toggle} />
          <Divider />
          <NotifRow title="Product Updates" subtitle="New features and platform announcements" pref="email_product_updates" prefs={prefs} onToggle={toggle} />
        </CardContent>
      </Card>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <PhoneAndroid sx={{ color: "primary.main" }} />
            <Typography fontWeight={700} fontSize={16}>Push Notifications</Typography>
          </Box>
          <Divider sx={{ mb: 1 }} />
          <NotifRow title="Price Alerts" subtitle="Instant alerts when stocks hit your targets" pref="push_price_alerts" prefs={prefs} onToggle={toggle} />
          <Divider />
          <NotifRow title="Breaking News" subtitle="Important market news as it happens" pref="push_news" prefs={prefs} onToggle={toggle} />
        </CardContent>
      </Card>
    </Box>
  );
};

/* ─── Appearance Section ───────────────────────────────────────── */
const AppearanceSection = () => {
  const { themeMode, setThemeMode } = useThemeContext();
  const [currency, setCurrency] = useState("INR");
  const [language, setLanguage] = useState("en");
  const [chartType, setChartType] = useState("line");

  const themes = [
    { value: "light", label: "Light", desc: "Clean and bright" },
    { value: "dark", label: "Dark", desc: "Easy on the eyes" },
    { value: "system", label: "System", desc: "Follows your OS" },
  ];

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={3}>Appearance & Preferences</Typography>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography fontWeight={700} fontSize={15} mb={2.5}>Theme</Typography>
          <Grid container spacing={1.5}>
            {themes.map((t) => (
              <Grid size={{ xs: 12, sm: 4 }} key={t.value}>
                <Box
                  onClick={() => setThemeMode(t.value as "light" | "dark" | "system")}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `2px solid ${themeMode === t.value ? "#6366f1" : "transparent"}`,
                    background: themeMode === t.value ? alpha("#6366f1", 0.08) : "transparent",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    outline: `1px solid`,
                    outlineColor: themeMode === t.value ? "#6366f1" : "divider",
                    "&:hover": { background: alpha("#6366f1", 0.05) },
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: 50,
                      borderRadius: 1.5,
                      background: t.value === "dark"
                        ? "linear-gradient(135deg, #0a0e17, #1a2035)"
                        : t.value === "light"
                        ? "linear-gradient(135deg, #f8fafc, #e2e8f0)"
                        : "linear-gradient(135deg, #f8fafc 50%, #0a0e17 50%)",
                      mb: 1.5,
                    }}
                  />
                  <Typography fontWeight={themeMode === t.value ? 700 : 600} fontSize={14}>
                    {t.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontSize={12}>{t.desc}</Typography>
                  {themeMode === t.value && (
                    <CheckCircle sx={{ fontSize: 16, color: "#6366f1", mt: 0.5 }} />
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={700} fontSize={15} mb={2.5}>Regional Preferences</Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Default Currency</InputLabel>
                <Select value={currency} label="Default Currency" onChange={(e) => setCurrency(e.target.value)}>
                  <MenuItem value="INR">₹ Indian Rupee (INR)</MenuItem>
                  <MenuItem value="USD">$ US Dollar (USD)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select value={language} label="Language" onChange={(e) => setLanguage(e.target.value)}>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="hi">हिंदी (Hindi)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Default Chart Type</InputLabel>
                <Select value={chartType} label="Default Chart Type" onChange={(e) => setChartType(e.target.value)}>
                  <MenuItem value="line">Line</MenuItem>
                  <MenuItem value="candlestick">Candlestick</MenuItem>
                  <MenuItem value="area">Area</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button variant="contained" onClick={() => toast.success("Preferences saved")}>
              Save Preferences
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

/* ─── Subscription Section ─────────────────────────────────────── */
const SubscriptionSection = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const isFree = user?.userTier !== "PREMIUM";

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={3}>Subscription</Typography>

      {/* Current Plan */}
      <Card
        sx={{
          borderRadius: 3,
          mb: 3,
          background: isFree
            ? theme.palette.mode === "dark" ? "rgba(17,24,39,0.8)" : "#fff"
            : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          border: isFree ? `1px solid ${theme.palette.divider}` : "none",
          boxShadow: isFree ? undefined : "0 8px 30px rgba(99,102,241,0.35)",
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Typography
                sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: isFree ? "text.secondary" : "rgba(255,255,255,0.7)", mb: 0.5 }}
              >
                Current Plan
              </Typography>
              <Typography sx={{ fontSize: 26, fontWeight: 900, color: isFree ? "text.primary" : "#fff" }}>
                {user?.userTier || "Free"}
              </Typography>
              {!isFree && (
                <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                  Renews on March 1, 2026 · ₹299/month
                </Typography>
              )}
            </Box>
            {isFree ? (
              <Button
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  fontWeight: 700,
                  px: 3,
                  py: 1.25,
                  borderRadius: 2.5,
                  boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
                }}
                startIcon={<Star />}
              >
                Upgrade to Premium
              </Button>
            ) : (
              <Button
                variant="outlined"
                sx={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff", "&:hover": { borderColor: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.1)" } }}
              >
                Manage Billing
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={700} fontSize={15} mb={2.5}>What's included in each plan</Typography>
          {[
            { feature: "Market data delay", free: "15 minutes", premium: "Real-time" },
            { feature: "Watchlists", free: "3", premium: "Unlimited" },
            { feature: "Screener exports", free: "100 rows/day", premium: "Unlimited" },
            { feature: "Technical indicators", free: "Basic (MA, EMA)", premium: "15+ indicators" },
            { feature: "Intraday charts", free: "1D only", premium: "1min, 5min, 15min..." },
            { feature: "Chart drawing tools", free: "✕", premium: "✓" },
            { feature: "News feed customization", free: "✕", premium: "✓" },
            { feature: "API access", free: "✕", premium: "Enterprise only" },
          ].map((row, i) => (
            <Box key={row.feature}>
              {i > 0 && <Divider />}
              <Box
                display="flex"
                alignItems="center"
                py={1.5}
                sx={{
                  "& > *": { flex: 1 },
                }}
              >
                <Typography fontSize={14} color="text.secondary">{row.feature}</Typography>
                <Typography fontSize={14} fontWeight={600} textAlign="center">{row.free}</Typography>
                <Typography
                  fontSize={14}
                  fontWeight={700}
                  textAlign="center"
                  sx={{ color: "#6366f1" }}
                >
                  {row.premium}
                </Typography>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

/* ─── Main Component ───────────────────────────────────────────── */
const ProfileSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();

  const [activeSection, setActiveSection] = useState("profile");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const initials = `${user?.firstName?.[0] || "U"}${user?.lastName?.[0] || ""}`.toUpperCase();

  const renderSection = () => {
    switch (activeSection) {
      case "profile": return <ProfileSection />;
      case "security": return <SecuritySection />;
      case "notifications": return <NotificationsSection />;
      case "appearance": return <AppearanceSection />;
      case "subscription": return <SubscriptionSection />;
      default: return <ProfileSection />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={800} letterSpacing={-0.5} mb={0.5}>
          Account Settings
        </Typography>
        <Typography color="text.secondary">
          Manage your profile, security, and preferences
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* ── Sidebar ── */}
        <Grid size={{ xs: 12, md: 3 }}>
          {/* User Card */}
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" py={1}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    fontSize: 22,
                    fontWeight: 800,
                    mb: 1.5,
                  }}
                >
                  {initials}
                </Avatar>
                <Typography fontWeight={700} fontSize={15} textAlign="center">
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontSize={12} textAlign="center">
                  {user?.email}
                </Typography>
                <Chip
                  label={user?.userTier || "FREE"}
                  size="small"
                  sx={{
                    mt: 1,
                    background: alpha("#f59e0b", 0.1),
                    color: "#f59e0b",
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Nav Items */}
          <Card sx={{ borderRadius: 3 }}>
            <List dense sx={{ p: 1 }}>
              {SIDEBAR_ITEMS.map((item) => (
                <ListItemButton
                  key={item.key}
                  selected={activeSection === item.key}
                  onClick={() => setActiveSection(item.key)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.25,
                    "& .MuiListItemIcon-root": {
                      minWidth: 36,
                      color: activeSection === item.key ? "primary.main" : "text.secondary",
                    },
                    "&.Mui-selected": {
                      background: alpha(theme.palette.primary.main, 0.08),
                      color: "primary.main",
                    },
                    "&:hover": {
                      background: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: activeSection === item.key ? 700 : 500, fontSize: 14 }}
                  />
                </ListItemButton>
              ))}

              <Divider sx={{ my: 1 }} />

              <ListItemButton
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  color: "#ef4444",
                  "& .MuiListItemIcon-root": { minWidth: 36, color: "#ef4444" },
                  "&:hover": { background: alpha("#ef4444", 0.06) },
                }}
              >
                <ListItemIcon><Logout /></ListItemIcon>
                <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
              </ListItemButton>

              <ListItemButton
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                sx={{
                  borderRadius: 2,
                  color: "text.disabled",
                  "& .MuiListItemIcon-root": { minWidth: 36, color: "text.disabled" },
                  "&:hover": { background: alpha("#ef4444", 0.04), color: "#ef4444" },
                }}
              >
                <ListItemIcon><DeleteForever /></ListItemIcon>
                <ListItemText primary="Delete Account" primaryTypographyProps={{ fontWeight: 500, fontSize: 13 }} />
              </ListItemButton>
            </List>
          </Card>
        </Grid>

        {/* ── Main Content ── */}
        <Grid size={{ xs: 12, md: 9 }}>
          {showDeleteConfirm && (
            <Alert
              severity="error"
              sx={{ borderRadius: 2, mb: 3 }}
              action={
                <Box display="flex" gap={1}>
                  <Button size="small" color="inherit" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                  <Button size="small" color="error" variant="contained" onClick={() => toast.error("Account deletion requires email verification — feature coming soon")}>
                    Delete
                  </Button>
                </Box>
              }
            >
              <strong>Delete Account?</strong> This action is permanent and cannot be undone. All your data, watchlists, and preferences will be lost.
            </Alert>
          )}

          {renderSection()}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfileSettings;
