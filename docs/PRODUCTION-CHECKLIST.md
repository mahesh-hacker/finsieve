# Production Readiness Checklist — Finsieve

**Target:** Production-ready deploy with Lighthouse 95+, zero critical VAPT issues.

---

## 1. Security (VAPT)
- [x] **VAPT-REPORT.md** — OWASP Top 10 audit done; all findings remediated or documented
- [x] **Screening** — Filter field allowlist; limit/offset clamped (1–500, 0–10000)
- [x] **CORS** — `ALLOWED_ORIGINS` set in production
- [x] **Helmet** — CSP, X-Frame-Options, etc.
- [ ] **npm audit** — Run in backend and frontend; fix critical/high before release

---

## 2. Regression Testing
- [ ] **Jest** — Unit tests for screening service, auth validator, new routes
- [ ] **Cypress** — E2E: login, screening (stock, MF, ETF), tabs, protected routes
- [ ] **REGRESSION-RESULTS.md** — Updated with actual pass/fail and coverage
- Target: **95%+** pass rate on critical flows

---

## 3. Performance (Lighthouse 95+)
- [ ] **LCP** &lt; 2.5s — Optimize images (Next/Image or Vite + lazy load), critical CSS
- [ ] **FID / INP** &lt; 100ms — Minimize main-thread work; defer non-critical JS
- [ ] **CLS** &lt; 0.1 — Reserve space for images/charts; avoid layout shift
- [ ] **Bundle size** &lt; 2MB (gzipped) — Code-split routes; tree-shake MUI
- [ ] **Lighthouse CI** — Add to GitHub Actions (optional)

### Quick wins
- Lazy-load routes: `React.lazy()` for Screening, Comparison, Watchlists
- Compress assets; use CDN for static assets (Vercel does this)
- PWA: add `manifest.json` and service worker if required

---

## 4. Deployment Steps
1. [x] Fix all VAPT issues (see VAPT-REPORT.md)
2. [ ] Pass regression suite (95%+)
3. [ ] Deploy backend to Railway; env vars set (incl. `ALLOWED_ORIGINS`, `FRONTEND_URL`)
4. [ ] Deploy frontend to Vercel; set `VITE_API_BASE_URL`, `VITE_MARKET_WS_URL`, `VITE_ENCRYPTION_KEY`
5. [ ] Verify: https://finsieve-tau.vercel.app → login, screening (all asset classes), ETF/SIF/PMS/AIF tabs
6. [ ] Custom domain (e.g. finsieve.in): add in Vercel and DNS
7. [ ] Analytics: GA4 / Hotjar if required

---

## 5. Post-Deploy
- [ ] **HTTPS only** — Vercel/Railway enforce; ensure no mixed content
- [ ] **HSTS** — Enabled by platform or via Helmet
- [ ] **Monitoring** — Health check `/health`; log errors to service of choice
- [ ] **Backup** — Supabase/DB backups per provider settings
- [ ] **Push to GitHub** — After every successful deployment, commit and push changes so the repo stays in sync (`git add . && git commit -m "chore: post-deployment sync" && git push origin main`)

---

*Complete this checklist before going live and after major releases.*
