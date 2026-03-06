/**
 * usePlan — Feature gate hook
 * Returns the current user's plan and helpers to check feature access.
 */

import { useSelector } from "react-redux";
import { RootState } from "../store";
import { getPlanByTier, type Plan, type PlanLimits } from "../config/plans";

export interface UsePlanResult {
  plan: Plan;
  tier: string;
  isExplorer: boolean;
  isPro: boolean;
  isElite: boolean;
  limits: PlanLimits;
  can: {
    export: boolean;
    setAlerts: boolean;
    useAdvancedFilters: boolean;
    useIntraday: boolean;
    useBacktest: boolean;
    useApi: boolean;
    createScreen: (currentCount: number) => boolean;
    createWatchlist: (currentCount: number) => boolean;
  };
}

export function usePlan(): UsePlanResult {
  const user = useSelector((state: RootState) => state.auth.user);
  const tier = user?.userTier ?? "FREE";
  const plan = getPlanByTier(tier);

  const isExplorer = plan.id === "explorer";
  const isPro = plan.id === "pro";
  const isElite = plan.id === "elite";

  return {
    plan,
    tier,
    isExplorer,
    isPro,
    isElite,
    limits: plan.limits,
    can: {
      export:              !isExplorer,
      setAlerts:           !isExplorer,
      useAdvancedFilters:  !isExplorer,
      useIntraday:         !isExplorer,
      useBacktest:         isElite,
      useApi:              isElite,
      createScreen:        (n) => n < plan.limits.screens,
      createWatchlist:     (n) => n < plan.limits.watchlists,
    },
  };
}
