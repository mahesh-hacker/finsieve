/**
 * Finsieve Pricing Plans — Single Source of Truth
 * Tier mapping: FREE → explorer | PREMIUM → pro | ENTERPRISE → elite
 */

export type PlanId = "explorer" | "pro" | "elite";
export type BillingPeriod = "monthly" | "quarterly" | "yearly";

export interface BillingOption {
  period: BillingPeriod;
  price: number;          // INR, full amount for the period
  perMonth: number;       // effective per-month amount
  savings?: string;       // e.g. "Save 67%"
  label: string;
}

export interface PlanLimits {
  screens: number;
  watchlists: number;
  exports: number;        // per month; Infinity = unlimited
  alerts: number;         // per month; Infinity = unlimited
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  userTier: string;       // matches backend UserTier enum
  billing: BillingOption[];
  features: string[];
  limits: PlanLimits;
  highlighted?: boolean;  // "MOST POPULAR" badge
  trialDays?: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

export const PLANS: Plan[] = [
  {
    id: "explorer",
    name: "Free Explorer",
    tagline: "For investors just getting started",
    userTier: "FREE",
    color: "#6b7280",
    gradientFrom: "rgba(107,114,128,0.08)",
    gradientTo: "rgba(107,114,128,0.02)",
    billing: [
      { period: "yearly", price: 0, perMonth: 0, label: "Free forever" },
    ],
    features: [
      "Basic screeners for ALL 8 asset classes",
      "5 saved screens total",
      "2 watchlists",
      "Basic filters (10–15 per asset)",
      "Live market data",
      "No exports",
      "No price alerts",
    ],
    limits: { screens: 5, watchlists: 2, exports: 0, alerts: 0 },
  },
  {
    id: "pro",
    name: "Pro Active Investor",
    tagline: "For serious investors who need full power",
    userTier: "PREMIUM",
    highlighted: true,
    trialDays: 14,
    color: "#6366f1",
    gradientFrom: "rgba(99,102,241,0.12)",
    gradientTo: "rgba(99,102,241,0.03)",
    billing: [
      {
        period: "monthly",
        price: 299,
        perMonth: 299,
        label: "₹299/month",
      },
      {
        period: "quarterly",
        price: 699,
        perMonth: 233,
        savings: "Save 22%",
        label: "₹699/quarter",
      },
      {
        period: "yearly",
        price: 2499,
        perMonth: 208,
        savings: "Save 30%",
        label: "₹2,499/year",
      },
    ],
    features: [
      "Full screeners for ALL asset classes (50+ filters)",
      "50 saved screens",
      "10 watchlists",
      "CSV / Excel exports (50/month)",
      "100 price alerts/month",
      "Real-time data refresh",
      "Advanced technical indicators",
      "Intraday charts (1m, 5m, 15m, 30m, 60m)",
    ],
    limits: { screens: 50, watchlists: 10, exports: 50, alerts: 100 },
  },
  {
    id: "elite",
    name: "Elite Professional",
    tagline: "For power users, institutions & advisors",
    userTier: "ENTERPRISE",
    trialDays: 14,
    color: "#f59e0b",
    gradientFrom: "rgba(245,158,11,0.10)",
    gradientTo: "rgba(245,158,11,0.02)",
    billing: [
      {
        period: "monthly",
        price: 999,
        perMonth: 999,
        label: "₹999/month",
      },
      {
        period: "quarterly",
        price: 2499,
        perMonth: 833,
        savings: "Save 17%",
        label: "₹2,499/quarter",
      },
      {
        period: "yearly",
        price: 9999,
        perMonth: 833,
        savings: "Save 17%",
        label: "₹9,999/year",
      },
    ],
    features: [
      "UNLIMITED everything — no caps, no limits",
      "500+ advanced filters across all assets",
      "Unlimited screens, watchlists & exports",
      "All alerts + webhook integrations",
      "Full backtesting engine",
      "REST API access",
      "Priority 24/7 support",
      "Early access to new features",
    ],
    limits: {
      screens: Infinity,
      watchlists: Infinity,
      exports: Infinity,
      alerts: Infinity,
    },
  },
];

/** Map backend userTier string → Plan */
export function getPlanByTier(tier: string): Plan {
  return PLANS.find((p) => p.userTier === tier) ?? PLANS[0];
}

/** Get a plan by its id */
export function getPlanById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

/** Feature comparison table rows */
export const FEATURE_COMPARISON = [
  {
    feature: "Screener filters per asset",
    explorer: "10–15 basic",
    pro: "50+ full",
    elite: "500+ advanced",
  },
  {
    feature: "Saved screens",
    explorer: "5",
    pro: "50",
    elite: "Unlimited",
  },
  {
    feature: "Watchlists",
    explorer: "2",
    pro: "10",
    elite: "Unlimited",
  },
  {
    feature: "CSV / Excel exports",
    explorer: "None",
    pro: "50/month",
    elite: "Unlimited",
  },
  {
    feature: "Price alerts",
    explorer: "None",
    pro: "100/month",
    elite: "Unlimited + webhooks",
  },
  {
    feature: "Live market data",
    explorer: "Yes",
    pro: "Yes",
    elite: "Yes",
  },
  {
    feature: "Intraday charts",
    explorer: "1D only",
    pro: "1m / 5m / 15m / 30m / 60m",
    elite: "Full tick data",
  },
  {
    feature: "Technical indicators",
    explorer: "MA, EMA",
    pro: "15+ indicators",
    elite: "All + custom",
  },
  {
    feature: "Backtesting",
    explorer: "None",
    pro: "None",
    elite: "Full engine",
  },
  {
    feature: "API access",
    explorer: "None",
    pro: "None",
    elite: "Unlimited REST API",
  },
  {
    feature: "Priority support",
    explorer: "Email (48h)",
    pro: "Email (12h)",
    elite: "Dedicated (2h SLA)",
  },
  {
    feature: "14-day free trial",
    explorer: "Not applicable",
    pro: "Yes",
    elite: "Yes",
  },
];
