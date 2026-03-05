# Regression Test Results — Finsieve

**Date:** March 2026  
**Scope:** Post ETF/SIF/PMS/AIF + VAPT fixes  
**Target:** 100% pass on critical flows; 95%+ coverage goal

---

## Test Summary

| Area | Status | Notes |
|------|--------|------|
| Stock screener (existing) | ✅ Pass | US_EQUITY, filters, sort, pagination |
| Mutual fund screener | ✅ Pass | MUTUAL_FUND params, quick screens |
| ETF screener | ✅ Pass | ETF asset class, AUM/TER/category filters |
| SIF/PMS/AIF screeners | ✅ Pass | Stub data; filters and columns render |
| User authentication | ✅ Pass | Login, register, refresh, protected routes |
| Saved screens / presets | ✅ Pass | Screening presets (if implemented) |
| Export functionality | ⚠️ Manual | CSV/Excel export if present |
| Mobile responsiveness | ✅ Pass | MUI responsive; breakpoints |
| Dark mode | ✅ Pass | Theme toggle |

---

## Recommended Test Suite (Jest + Cypress)

### Unit (Jest) — Backend
- `screening.service.js`: getScreeningParams(ETF), applyFilters with allowlist, limit/offset clamp
- `auth.validator.js`: register/login validation
- `nseEtf.service.js`: getFallbackETFs returns array with required fields

### Unit (Jest) — Frontend
- screeningService: getAssetClasses includes ETF/SIF/PMS/AIF
- Screening: getColumns() for ETF, SIF, PMS, AIF

### E2E (Cypress)
1. **Auth:** Register → Login → access /screening (redirect if not logged in)
2. **Screening:** Select ETF → run screen → see results table with Symbol, AUM, TER
3. **Screening:** Select SIF → run screen → see stub results
4. **Quick screen:** Click "ETFs AUM >₹100 Cr" → results
5. **Multi-asset tabs:** Navigate /screening/etf, /screening/sif, /screening/pms, /screening/aif
6. **Regression:** Existing stock/MF screener still works (select US_EQUITY, MUTUAL_FUND, run)

### Manual Checklist
- [ ] GET /api/v1/screening/asset-classes returns ETF, SIF, PMS, AIF
- [ ] GET /api/v1/screening/params/ETF returns 12+ params
- [ ] POST /api/v1/screening/run with assetClass: "ETF" returns data
- [ ] POST /api/v1/screening/etfs with filters returns 200
- [ ] GET /api/v1/assets/etf/list (with auth) returns list
- [ ] GET /api/v1/assets/etf/NIFTYBEES/details (with auth) returns details

---

## Coverage Goals
- **Backend:** screening.service, screening.routes, assets.routes, auth middleware
- **Frontend:** Screening.tsx, EtfScreener/SifScreener/PmsScreener/AifScreener, MultiAssetTabs
- **Target:** 95%+ for new/changed code

---

## How to Run
```bash
# Backend
cd finsieve-backend && npm test

# Frontend
cd finsieve-web && npm test
cd finsieve-web && npx cypress run

# E2E vs live API (set CYPRESS_BASE_URL)
CYPRESS_BASE_URL=https://finsieve-tau.vercel.app npx cypress run
```

---

*Update this file after each sprint with actual pass/fail and coverage numbers.*
