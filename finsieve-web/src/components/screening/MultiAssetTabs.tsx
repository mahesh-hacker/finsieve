/**
 * MultiAssetTabs — Switch between All, ETF, SIF, PMS, AIF screeners
 * Matches existing design system (MUI Tabs + Router)
 */
import { Box, Tabs, Tab } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const TAB_ROUTES = [
  { label: "All", value: "/screening" },
  { label: "ETF", value: "/screening/etf" },
  { label: "SIF", value: "/screening/sif" },
  { label: "PMS", value: "/screening/pms" },
  { label: "AIF", value: "/screening/aif" },
];

export default function MultiAssetTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = TAB_ROUTES.findIndex((t) => t.value === location.pathname);
  const tabIndex = current >= 0 ? current : 0;

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
      <Tabs
        value={tabIndex}
        onChange={(_, v) => navigate(TAB_ROUTES[v]?.value ?? "/screening")}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ minHeight: 42 }}
      >
        {TAB_ROUTES.map((tab, i) => (
          <Tab key={tab.value} label={tab.label} id={`screener-tab-${i}`} />
        ))}
      </Tabs>
    </Box>
  );
}
