# Finsieve Integration Summary

**Last updated:** March 5, 2026  
**Purpose:** Single reference for all integrations implemented in the Finsieve 360° Investment Intelligence Platform.

---

## 1. Overview

Finsieve integrates:

- **Database:** PostgreSQL (Supabase) with schema, migrations, and auth tables
- **Backend ↔ Frontend:** REST API (`/api/v1/*`), WebSocket (`/ws/market`), env-based config
- **Auth:** JWT access/refresh, email verification, password reset, protected routes
- **Market data:** NSE India (REST + WebSocket), US/Global (Yahoo Finance), schedulers
- **Brokers:** Upstox, Zerodha, Angel One (OAuth + REST + WebSocket where applicable)
- **Deployment:** Vercel (frontend) → Railway (backend) → Supabase (database)

---

## 2. Database Integration

### 2.1 Stack

- **Provider:** Supabase (PostgreSQL)
- **Schema:** `finsieve-backend/src/database/schema.sql`
- **Migrations:** `migration_500_fix.sql` (auth fixes), optional `supabase_fix_columns.sql`

### 2.2 Key Tables

| Table | Purpose |
|-------|---------|
| `users` | Auth, tiers (FREE/PREMIUM/ENTERPRISE), email verification |
| `refresh_tokens` | JWT refresh with `revoked_at` |
| `email_verification_tokens` | Email verification flow |
| `global_indices` | NSE + US + global indices (single store) |
| `watchlists`, `watchlist_items` | User watchlists, multi-asset |
| `user_preferences` | Theme, currency, notifications |
| `screening_presets` | Saved screening configs |
| `comparison_history` | Comparison sessions |
| `market_data_cache` | Cached market data with TTL |

### 2.3 Connection

- Backend uses `DATABASE_URL` (e.g. Supabase connection string).
- Schema applied via Supabase SQL Editor; migration run if 500 on login/register (see [DEPLOYMENT_FULL_STACK.md](./DEPLOYMENT_FULL_STACK.md)).

---

## 3. Backend–Frontend Integration

### 3.1 API Base

- **Base URL:** `VITE_API_BASE_URL` (e.g. `https://<railway-url>/api/v1`)
- **Health:** `GET /health` (DB connectivity)
- **Root:** `GET /` (API info)

### 3.2 Frontend Env (Vercel / `.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend API root (e.g. `https://xxx.up.railway.app/api/v1`) |
| `VITE_MARKET_WS_URL` | Market WebSocket (e.g. `wss://xxx.up.railway.app/ws/market`) |
| `VITE_ENCRYPTION_KEY` | Must match backend `ENCRYPTION_KEY` (chatbot, sensitive payloads) |

### 3.3 CORS & Origins

- Backend: `ALLOWED_ORIGINS`, `FRONTEND_URL` for CORS and redirects.
- Production: Frontend origin (e.g. `https://finsieve-tau.vercel.app`) must be in `ALLOWED_ORIGINS`.

---

## 4. Authentication Integration

### 4.1 Implemented Flows

- **Register:** `POST /api/v1/auth/register` (bcrypt, JWT, default watchlist/preferences, optional welcome email)
- **Login:** `POST /api/v1/auth/login` (access + refresh tokens)
- **Refresh:** `POST /api/v1/auth/refresh` (cookie or body refresh token)
- **Logout:** `POST /api/v1/auth/logout` (revoke refresh token)
- **Forgot password:** `POST /api/v1/auth/forgot-password`
- **Reset password:** `POST /api/v1/auth/reset-password`
- **Verify email:** `POST /api/v1/auth/verify-email`
- **Me:** `GET /api/v1/auth/me` (protected)

### 4.2 Backend Env

- `JWT_SECRET`, `JWT_REFRESH_SECRET` (min 32 chars each)
- Email (e.g. Nodemailer) config if welcome/verification emails used

### 4.3 Protected Routes (Frontend + Backend)

- **Frontend:** Screening, Comparison, Watchlists behind `ProtectedRoute`; unauthenticated → `/login`.
- **Backend:** Watchlists, Screening, Comparison, Broker token, Chatbot (where applicable) use `authenticate` middleware; 401 when no/invalid token.

---

## 5. Market Data Integrations

### 5.1 NSE India

- **REST:** `realNSEData.service.js` — NSE session/cookies, `/api/allIndices`, bulk upsert into `global_indices`.
- **WebSocket:** `nseIndicesWebSocket.service.js` — Nifty 50 stream (`streamer.nseindia.com`), live ticks → DB + broadcast to clients.
- **Scheduler:** `nseDataScheduler.js` — 1s REST updates during NSE hours; Nifty 50 WebSocket when market open.
- **Stocks:** `nseStocks.service.js` — gainers, losers, volume, 52w high/low, quote; used by Indian Equities UI.

**API base:** `finsieve-backend/src/routes/nse.routes.js`  
Endpoints: `/api/v1/nse/update`, `/api/v1/nse/status`, `/api/v1/nse/stocks/*`, `/api/v1/nse/index/:indexName`, etc.

### 5.2 US & Global (Yahoo Finance)

- **Service:** `usIndicesUpdate.service.js` — US indices (e.g. DJI, SPX, IXIC, RUT, VIX, SOX) + global (FTSE, DAX, CAC, N225, HSI, etc.) via Yahoo Finance.
- **Scheduler:** `usMarketScheduler.js` or global scheduler — e.g. 10s/5s updates; DB writes to `global_indices`.

**API base:** `finsieve-backend/src/routes/us.routes.js`, `globalIndices.routes.js`  
Endpoints: `/api/v1/us/update`, `/api/v1/us/indices`, `/api/v1/us/stocks`, `/api/v1/global-indices/*`, etc.

### 5.3 Unified Market API (Frontend)

- **Market routes:** `GET /api/v1/market/indices`, `/indices/major`, `/indices/country/:country`, `/indices/:symbol`, `/historical`, `/status`.
- **Frontend:** Dashboard and Indian Equities poll indices (e.g. every 3s); data sourced from `global_indices` (NSE + US/global).

---

## 6. Scheduler Integration

| Scheduler | File | Frequency | Role |
|-----------|------|-----------|------|
| NSE India | `nseDataScheduler.js` | 1s (market hours) | NSE indices REST + Nifty 50 WebSocket |
| US/Global | `usMarketScheduler.js` / `globalMarketScheduler.js` | 5–10s | US & global indices via Yahoo Finance |
| NSE Stocks | `nseStocksScheduler.js` | Optional | NSE stocks data; can push via WebSocket |

All started from `server.js` after DB connect. Market-hours logic (e.g. IST for NSE, US sessions for global) reduces calls when markets are closed.

---

## 7. WebSocket Integration

### 7.1 Market Data Broadcaster

- **Service:** `marketDataBroadcaster.service.js` (ws library)
- **Path:** `/ws/market` (attached to same HTTP server as Express)
- **Role:** Broadcasts live index/price updates to all connected frontend clients (e.g. NSE ticks, scheduler-driven updates).

### 7.2 Frontend Consumption

- **Hook:** `useMarketWebSocket.ts` (or equivalent) — connects to `VITE_MARKET_WS_URL`, subscribes to channels, updates UI (e.g. dashboard, Indian Equities).
- **Realtime docs:** `docs/frontend/REALTIME_UPDATES_STATUS.md`, `REALTIME_UPDATES_IMPLEMENTATION.md`.

### 7.3 NSE Nifty 50 Stream

- Backend subscribes to NSE Nifty 50 WebSocket; on tick, updates DB and pushes via Market Data Broadcaster so frontend gets sub-second updates without polling.

---

## 8. Broker Integrations

### 8.1 Upstox

- **Auth:** OAuth2 — `/api/v1/broker/upstox/auth`, `/upstox/callback`; token stored via `/upstox/token` (protected).
- **Data:** REST quotes, historical, intraday; WebSocket for live ticks (Upstox v2 protobuf).
- **Service:** `upstox.service.js`

### 8.2 Zerodha (Kite)

- **Auth:** OAuth2 — `/api/v1/broker/zerodha/auth`, `/zerodha/callback`; token via `/zerodha/token` (protected).
- **Data:** REST quotes/historical; WebSocket `wss://ws.kite.trade` for live ticks.
- **Service:** `zerodha.service.js`

### 8.3 Angel One

- **Auth:** Login (user/API) — `POST /api/v1/broker/angelone/login`; Smart Stream WebSocket for NSE/BSE/MCX.
- **Service:** `angelone.service.js`

**Unified:** `GET /api/v1/broker/status`, `GET /api/v1/broker/historical` (broker-agnostic where applicable).

---

## 9. Other Backend API Modules

| Prefix | Purpose |
|--------|---------|
| `/api/v1/auth` | Auth (see §4) |
| `/api/v1/market` | Indices, major, by country, by symbol, historical, status |
| `/api/v1/nse` | NSE update, status, stocks, index by name |
| `/api/v1/us` | US update, indices, stocks, search, quote, history |
| `/api/v1/global-indices` | List, by region, history, currencies |
| `/api/v1/crypto` | List, overview, trending, search, coin detail, chart |
| `/api/v1/commodities` | List, by category, history |
| `/api/v1/bonds` | List, yield curve, history |
| `/api/v1/mutual-funds` | List, search, scheme detail, history, returns |
| `/api/v1/screening` | Params, run, quick screens (protected) |
| `/api/v1/comparison` | Create, search (protected) |
| `/api/v1/watchlists` | CRUD + items (protected) |
| `/api/v1/broker` | Upstox/Zerodha/Angel One auth and data |
| `/api/v1/chatbot` | Encrypted message endpoint (decrypt/encrypt middleware) |
| `/api/v1/assets` | List/details for ETF, SIF, PMS, AIF (`GET /:type/list`, `/:type/:id/details`) |

### Screening asset-specific (POST, authenticated)
- `POST /api/v1/screening/etfs` — ETF screening (filters, sortBy, sortOrder, limit, offset)
- `POST /api/v1/screening/sif` — SIF screening
- `POST /api/v1/screening/pms` — PMS screening
- `POST /api/v1/screening/aif` — AIF screening

---

## 10. Deployment Integration

| Layer | Service | Config |
|-------|---------|--------|
| **Database** | Supabase | `DATABASE_URL` in backend |
| **Backend** | Railway | Root dir `finsieve-backend`, `npm start`; env: `NODE_ENV`, `DATABASE_URL`, `JWT_*`, `ENCRYPTION_KEY`, `ALLOWED_ORIGINS`, `FRONTEND_URL` |
| **Frontend** | Vercel | `VITE_API_BASE_URL`, `VITE_MARKET_WS_URL`, `VITE_ENCRYPTION_KEY` |

**Flow:** Browser → Vercel (frontend) → Railway (API + WebSocket) → Supabase (DB).  
**Docs:** [DEPLOYMENT_FULL_STACK.md](./DEPLOYMENT_FULL_STACK.md).

---

## 11. Security & Middleware

- **Helmet:** Security headers
- **CORS:** Configured for `ALLOWED_ORIGINS`
- **Rate limiting:** Global + auth-specific limiters
- **Body size:** `express.json` limit (e.g. 100kb)
- **Encryption:** Request/response encryption for chatbot (shared `ENCRYPTION_KEY`)

---

## 12. Related Documentation

- [DEPLOYMENT_FULL_STACK.md](./DEPLOYMENT_FULL_STACK.md) — Full deployment steps
- [backend/AUTH_IMPLEMENTATION_SUMMARY.md](./backend/AUTH_IMPLEMENTATION_SUMMARY.md) — Auth API and flows
- [backend/NSE_REALTIME_UPDATES.md](./backend/NSE_REALTIME_UPDATES.md) — NSE 1s updates and WebSocket
- [backend/US_MARKET_DATA_IMPLEMENTATION.md](./backend/US_MARKET_DATA_IMPLEMENTATION.md) — US/global Yahoo data
- [backend/GLOBAL_SCHEDULER_SYSTEM.md](./backend/GLOBAL_SCHEDULER_SYSTEM.md) — Scheduler design
- [frontend/REALTIME_UPDATES_STATUS.md](./frontend/REALTIME_UPDATES_STATUS.md) — Frontend realtime behaviour
- [INDIAN_EQUITIES_STOCKS.md](./INDIAN_EQUITIES_STOCKS.md) — NSE stocks and Indian Equities UI
- [AUTH_SCREENING_COMPARISON.md](./AUTH_SCREENING_COMPARISON.md) — Auth for Screening & Comparison
- [QA_TEST_REPORT.md](../QA_TEST_REPORT.md) — Test status and known issues

---

*This document is the single place to see what is integrated end-to-end (DB, backend, frontend, brokers, market data, deployment). Update it when adding or changing integrations.*
