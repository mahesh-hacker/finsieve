import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Container,
  alpha,
  useTheme,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Star,
  Bolt,
  WorkspacePremium,
  ArrowForward,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  PLANS,
  FEATURE_COMPARISON,
  type BillingPeriod,
  type Plan,
} from "../../config/plans";
import toast from "react-hot-toast";

// ─── Razorpay checkout scaffold ──────────────────────────────────────────────
// Replace RAZORPAY_KEY_ID with your actual key from env once configured.
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

function initiateCheckout(plan: Plan, period: BillingPeriod, userEmail: string) {
  const billing = plan.billing.find((b) => b.period === period);
  if (!billing || billing.price === 0) return;

  if (!RAZORPAY_KEY) {
    // Payment not yet wired up — show info toast
    toast.success(
      `Redirecting to checkout for ${plan.name} (${billing.label}).\nPayment integration coming soon — contact hello@finsieve.in to subscribe.`,
      { duration: 6000 }
    );
    return;
  }

  const options = {
    key: RAZORPAY_KEY,
    amount: billing.price * 100, // paise
    currency: "INR",
    name: "Finsieve",
    description: `${plan.name} — ${billing.label}`,
    prefill: { email: userEmail },
    theme: { color: plan.color },
    handler: () => {
      toast.success("Payment successful! Your plan will be activated shortly.");
      window.location.href = "/dashboard?plan=" + plan.id + "&period=" + period;
    },
  };

  // @ts-expect-error Razorpay loaded via CDN script
  const rzp = new window.Razorpay(options);
  rzp.open();
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
const PlanCard = ({
  plan,
  selectedPeriod,
  currentTier,
  onSelect,
}: {
  plan: Plan;
  selectedPeriod: BillingPeriod;
  currentTier: string;
  onSelect: (plan: Plan, period: BillingPeriod) => void;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isCurrentPlan = plan.userTier === currentTier;

  // Find the billing option for selected period, fall back to first available
  const billing =
    plan.billing.find((b) => b.period === selectedPeriod) ?? plan.billing[0];

  const isFree = plan.id === "explorer";

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: plan.highlighted
          ? `2px solid ${plan.color}`
          : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        background: plan.highlighted
          ? `linear-gradient(145deg, ${plan.gradientFrom}, ${plan.gradientTo})`
          : isDark
          ? "rgba(17,24,39,0.7)"
          : "background.paper",
        boxShadow: plan.highlighted
          ? `0 8px 40px ${alpha(plan.color, 0.25)}`
          : undefined,
        transition: "all 0.2s",
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Most Popular banner — rendered as top bar inside the card */}
      {plan.highlighted && (
        <Box
          sx={{
            bgcolor: plan.color,
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.5,
            textAlign: "center",
            py: 0.75,
            whiteSpace: "nowrap",
          }}
        >
          MOST POPULAR
        </Box>
      )}

      <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Plan name + icon */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          {plan.id === "explorer" && <Star sx={{ fontSize: 18, color: plan.color }} />}
          {plan.id === "pro" && <Bolt sx={{ fontSize: 18, color: plan.color }} />}
          {plan.id === "elite" && <WorkspacePremium sx={{ fontSize: 18, color: plan.color }} />}
          <Typography sx={{ fontWeight: 800, fontSize: 17, color: plan.color }}>
            {plan.name}
          </Typography>
        </Box>

        <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 2.5 }}>
          {plan.tagline}
        </Typography>

        {/* Price */}
        <Box sx={{ mb: 2 }}>
          {isFree ? (
            <Typography sx={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>
              ₹0
              <Typography component="span" sx={{ fontSize: 14, fontWeight: 400, color: "text.secondary", ml: 0.5 }}>
                /forever
              </Typography>
            </Typography>
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5 }}>
                <Typography sx={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>
                  ₹{billing.perMonth.toLocaleString("en-IN")}
                </Typography>
                <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 0.5 }}>
                  /month
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>
                {billing.label}
              </Typography>
              {billing.savings && (
                <Chip
                  label={billing.savings}
                  size="small"
                  sx={{
                    mt: 0.75,
                    bgcolor: alpha("#10b981", 0.12),
                    color: "#10b981",
                    fontWeight: 700,
                    fontSize: 10,
                    height: 20,
                  }}
                />
              )}
            </>
          )}
        </Box>

        {/* CTA button */}
        {isCurrentPlan ? (
          <Button
            disabled
            fullWidth
            variant="outlined"
            sx={{ mb: 2.5, borderRadius: 2, fontWeight: 700 }}
          >
            Current Plan
          </Button>
        ) : isFree ? (
          <Button
            fullWidth
            variant="outlined"
            onClick={() => onSelect(plan, "yearly")}
            endIcon={<ArrowForward />}
            sx={{
              mb: 2.5,
              borderRadius: 2,
              fontWeight: 700,
              borderColor: plan.color,
              color: plan.color,
              "&:hover": { bgcolor: alpha(plan.color, 0.06), borderColor: plan.color },
            }}
          >
            Get Started Free
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            onClick={() => onSelect(plan, selectedPeriod)}
            endIcon={<ArrowForward />}
            sx={{
              mb: 2.5,
              borderRadius: 2,
              fontWeight: 700,
              bgcolor: plan.color,
              "&:hover": { bgcolor: alpha(plan.color, 0.85) },
              boxShadow: `0 4px 14px ${alpha(plan.color, 0.35)}`,
            }}
          >
            {plan.trialDays ? `Start ${plan.trialDays}-Day Free Trial` : "Subscribe Now"}
          </Button>
        )}

        {plan.trialDays && !isFree && !isCurrentPlan && (
          <Typography sx={{ fontSize: 11, color: "text.disabled", textAlign: "center", mb: 2 }}>
            No credit card required for trial
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Feature list */}
        <Box sx={{ flex: 1 }}>
          {plan.features.map((f) => {
            const isNegative = f.startsWith("No ");
            return (
              <Box key={f} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "flex-start" }}>
                {isNegative ? (
                  <Cancel sx={{ fontSize: 15, color: "text.disabled", mt: 0.2, flexShrink: 0 }} />
                ) : (
                  <CheckCircle sx={{ fontSize: 15, color: plan.color, mt: 0.2, flexShrink: 0 }} />
                )}
                <Typography sx={{ fontSize: 13, color: isNegative ? "text.disabled" : "text.secondary", lineHeight: 1.4 }}>
                  {f}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

// ─── Feature comparison table ─────────────────────────────────────────────────
const ComparisonTable = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const cellStyle = {
    fontSize: 13,
    py: 1.5,
    px: 2,
    textAlign: "center" as const,
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`,
  };

  const headerStyle = {
    ...cellStyle,
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 0.5,
  };

  return (
    <Box sx={{ overflowX: "auto", mt: 6 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, textAlign: "center" }}>
        Full Feature Comparison
      </Typography>
      <Box
        component="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
          bgcolor: isDark ? "rgba(17,24,39,0.5)" : "background.paper",
          borderRadius: 2,
          overflow: "hidden",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        <Box component="thead">
          <Box component="tr" sx={{ bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
            <Box component="th" sx={{ ...headerStyle, textAlign: "left", color: "text.secondary" }}>
              Feature
            </Box>
            <Box component="th" sx={{ ...headerStyle, color: "#6b7280" }}>Free Explorer</Box>
            <Box component="th" sx={{ ...headerStyle, color: "#6366f1" }}>Pro</Box>
            <Box component="th" sx={{ ...headerStyle, color: "#f59e0b" }}>Elite</Box>
          </Box>
        </Box>
        <Box component="tbody">
          {FEATURE_COMPARISON.map((row, i) => (
            <Box
              component="tr"
              key={row.feature}
              sx={{ bgcolor: i % 2 === 0 ? "transparent" : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)" }}
            >
              <Box component="td" sx={{ ...cellStyle, textAlign: "left", fontWeight: 600, color: "text.primary" }}>
                {row.feature}
              </Box>
              {[row.explorer, row.pro, row.elite].map((val, j) => (
                <Box key={j} component="td" sx={{ ...cellStyle, color: val === "None" || val === "Not applicable" ? "text.disabled" : "text.secondary" }}>
                  {val === "None" || val === "Not applicable" ? (
                    <Cancel sx={{ fontSize: 16, color: "text.disabled", verticalAlign: "middle" }} />
                  ) : val === "Yes" ? (
                    <CheckCircle sx={{ fontSize: 16, color: "#10b981", verticalAlign: "middle" }} />
                  ) : (
                    val
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// ─── Main Pricing Page ────────────────────────────────────────────────────────
const Pricing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const currentTier = user?.userTier ?? "FREE";

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");

  const handleSelectPlan = (plan: Plan, period: BillingPeriod) => {
    if (plan.id === "explorer") {
      if (!isAuthenticated) navigate("/register");
      else navigate("/dashboard");
      return;
    }

    if (!isAuthenticated) {
      navigate("/register?plan=" + plan.id + "&period=" + period);
      return;
    }

    initiateCheckout(plan, period, user?.email ?? "");
  };

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Chip
          label="PRODUCTION PRICING"
          size="small"
          sx={{
            bgcolor: "rgba(99,102,241,0.1)",
            color: "#6366f1",
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: 1.5,
            mb: 2,
          }}
        />
        <Typography
          variant="h3"
          sx={{ fontWeight: 900, letterSpacing: "-0.03em", mb: 1.5, fontSize: { xs: 28, sm: 36, md: 42 } }}
        >
          Pick your plan
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: { xs: 14, sm: 16 }, maxWidth: 520, mx: "auto", mb: 3 }}>
          Start free with all 8 asset classes. Upgrade anytime for advanced screeners, exports & alerts.
        </Typography>

        {/* Billing toggle */}
        <ToggleButtonGroup
          value={billingPeriod}
          exclusive
          onChange={(_, v) => { if (v) setBillingPeriod(v); }}
          size="small"
          sx={{
            bgcolor: (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            borderRadius: 2,
            "& .MuiToggleButton-root": {
              border: "none",
              borderRadius: "8px !important",
              px: 2.5,
              py: 0.75,
              fontSize: 13,
              fontWeight: 600,
              textTransform: "none",
              "&.Mui-selected": {
                bgcolor: "background.paper",
                color: "text.primary",
                fontWeight: 800,
                boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
              },
            },
          }}
        >
          <ToggleButton value="monthly">Monthly</ToggleButton>
          <ToggleButton value="quarterly">
            Quarterly
            <Chip label="Save 22%" size="small" sx={{ ml: 1, height: 16, fontSize: 9, fontWeight: 800, bgcolor: "rgba(16,185,129,0.15)", color: "#10b981" }} />
          </ToggleButton>
          <ToggleButton value="yearly">
            Yearly
            <Chip label="Best Value" size="small" sx={{ ml: 1, height: 16, fontSize: 9, fontWeight: 800, bgcolor: "rgba(99,102,241,0.15)", color: "#6366f1" }} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Plan cards */}
      <Box
        sx={{
          display: "flex",
          gap: { xs: 2, md: 3 },
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "flex-start" },
          mb: 3,
        }}
      >
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selectedPeriod={billingPeriod}
            currentTier={currentTier}
            onSelect={handleSelectPlan}
          />
        ))}
      </Box>

      {/* Trust signals */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: { xs: 1.5, sm: 3 },
          mt: 3,
          mb: 1,
        }}
      >
        {[
          "14-day free trial, no credit card needed",
          "Cancel anytime — no lock-in",
          "Secure payments via Razorpay",
          "GST invoice provided",
        ].map((t) => (
          <Box key={t} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <CheckCircle sx={{ fontSize: 14, color: "#10b981" }} />
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{t}</Typography>
          </Box>
        ))}
      </Box>

      {/* FAQ note about Quarterly */}
      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Tooltip title="Elite Quarterly: ₹2,499 for 3 months (₹833/month). Pro Quarterly: ₹699 for 3 months (₹233/month).">
          <Typography sx={{ fontSize: 12, color: "text.disabled", cursor: "help", display: "inline" }}>
            *Quarterly billing billed every 3 months. Hover for details.
          </Typography>
        </Tooltip>
      </Box>

      <Container maxWidth="lg" disableGutters>
        <ComparisonTable />
      </Container>

      {/* Bottom CTA */}
      <Box sx={{ textAlign: "center", mt: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
          Questions? We're here to help.
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 14, mb: 3 }}>
          Talk to our team for custom plans for institutions or bulk seats.
        </Typography>
        <Button
          variant="outlined"
          size="large"
          href="mailto:hello@finsieve.in"
          sx={{ borderRadius: 2.5, fontWeight: 700, px: 4 }}
        >
          Contact Sales
        </Button>
      </Box>
    </Box>
  );
};

export default Pricing;
