# Full-Stack Deployment: Database + Backend + Frontend

**Live frontend:** [https://finsieve-tau.vercel.app](https://finsieve-tau.vercel.app)

---

## Quick setup: Supabase + Railway + Vercel (this project)

### 1. Load schema on Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Copy the full contents of **`finsieve-backend/src/database/schema.sql`** and paste into the editor → **Run**.
3. (Optional) If you had run an older schema before, also run **`finsieve-backend/src/database/supabase_fix_columns.sql`**.

### 2. Deploy backend on Railway

1. Go to [railway.app](https://railway.app) → **New project** → **Deploy from GitHub** → select **finsieve**.
2. **Critical:** Select the new service → **Settings** → **Root Directory** → set to **`finsieve-backend`** → Save.  
   If Root Directory is wrong or empty, the build fails (no `package.json` at repo root).
3. **Build & Deploy:** Leave **Build Command** empty (or `npm install`); **Start Command** = `npm start`. Railway will use `finsieve-backend/railway.json` and `package.json` from the root directory above.
3. **Variables** tab → add (required; app crashes on start if JWT_* are missing):

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres:_%40Mahesh9702@db.grikvekkbfhjlqwdxkgu.supabase.co:5432/postgres` |
| `JWT_SECRET` | **Required.** Any string **at least 32 characters** (e.g. generate: `openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | **Required.** Another string **at least 32 characters** (different from JWT_SECRET) |
| `ENCRYPTION_KEY` | `ff0d0d28eb6d89a4a2c1efd135c3ed7f237e35285a9f80efcbe14656a63769dc` (must match frontend) |
| `ALLOWED_ORIGINS` | `https://finsieve-tau.vercel.app` |
| `FRONTEND_URL` | `https://finsieve-tau.vercel.app` |

If you see **"FATAL: JWT_SECRET must be set and at least 32 characters long"**, add both `JWT_SECRET` and `JWT_REFRESH_SECRET` in Railway → service → **Variables**, each at least 32 characters, then redeploy.

4. **Settings** → **Networking** → **Generate domain** → note the URL (e.g. `https://finsieve-backend-production-xxxx.up.railway.app`).

### 3. Connect Vercel to the backend

1. **Vercel** → your project → **Settings** → **Environment Variables**.
2. Add (replace with your actual Railway URL):

| Variable | Value |
|----------|--------|
| `VITE_API_BASE_URL` | `https://YOUR-RAILWAY-URL/api/v1` |
| `VITE_MARKET_WS_URL` | `wss://YOUR-RAILWAY-URL/ws/market` |
| `VITE_ENCRYPTION_KEY` | `ff0d0d28eb6d89a4a2c1efd135c3ed7f237e35285a9f80efcbe14656a63769dc` |

3. **Redeploy** the frontend (Deployments → ⋮ → Redeploy).

Result: **Vercel (frontend)** → **Railway (API)** → **Supabase (database)**. Login/signup and all API features use the same DB.

---

To get a **fully functional website** (not just frontend), you need all three in the cloud:

| Layer      | Local (current)     | Cloud (target)                    |
|-----------|--------------------|-----------------------------------|
| **Database** | PostgreSQL on your PC | Hosted PostgreSQL (Neon / Supabase / Railway) |
| **Backend**  | Express on localhost:3000 | Railway / Render / Fly.io        |
| **Frontend** | Vite dev server     | Vercel (already deployed)          |

---

## Overview

1. Create a **cloud PostgreSQL** database.
2. Run **schema + seeds** on that database.
3. Deploy the **backend** and set env vars (including DB URL).
4. Set **frontend** env vars to point to the deployed backend and **redeploy**.

---

## Step 1: Cloud PostgreSQL (choose one)

### Option A: Neon (recommended, free tier)

- Sign up: [neon.tech](https://neon.tech)
- Create a project → get **connection string** (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)
- Note: **Host**, **Database**, **User**, **Password**, **Port** (usually 5432)

### Option B: Supabase (direct connection string)

- Sign up: [supabase.com](https://supabase.com)
- New project → **Settings** → **Database** → **Connection string** → **URI**
- Use the **Direct connection** string as `DATABASE_URL` in your backend.  
  **Important:** If your password contains `@` or `:`, URL-encode it in the string (`@` → `%40`, `:` → `%3A`).  
  Example format:  
  `postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres`  
  The backend supports `DATABASE_URL` and will enable SSL for Supabase automatically.

### Option C: Railway

- Sign up: [railway.app](https://railway.app)
- New project → **Add service** → **Database** → **PostgreSQL** → use **Variables** tab for connection details

---

## Step 2: Load schema and seed data into cloud DB

Use the **connection string** or host/user/password from Step 1.

### 2a. Run schema (creates tables)

From your machine (with `psql` installed), or use the provider’s **SQL Editor** (Neon/Supabase have one):

```bash
cd finsieve-backend
psql "postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require" -f src/database/schema.sql
```

Or copy the contents of `src/database/schema.sql` into Neon/Supabase SQL Editor and run it.

### 2b. (Optional) Seed global indices

```bash
psql "YOUR_CONNECTION_STRING" -f src/database/seed_global_indices.sql
```

Or paste `seed_global_indices.sql` into the SQL Editor and run.

### 2c. Fix `users` table if you ran an old schema

If the `users` table has `email_verified` instead of `is_email_verified`, or is missing `is_active`, run **`src/database/supabase_fix_columns.sql`** in the SQL Editor. The main **schema.sql** now creates `is_email_verified` and `is_active` by default.

---

## Step 3: Deploy the backend (Railway or Render)

### Option A: Railway

1. Go to [railway.app](https://railway.app) → **New project** → **Deploy from GitHub repo** → select **finsieve**.
2. Set **Root Directory** to **`finsieve-backend`**.
3. **Variables** (add these; use your real values):

| Variable | Example / notes |
|----------|------------------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` (Railway sets this; you can leave it) |
| `DATABASE_URL` | (Supabase/Neon) full URI, e.g. `postgresql://user:pass@host:5432/db` — if set, DB_HOST etc. are ignored and SSL is used |
| _or_ `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | when not using DATABASE_URL; set `DB_SSL=true` for cloud Postgres |
| `JWT_SECRET` | long random string |
| `JWT_REFRESH_SECRET` | another long random string |
| `ENCRYPTION_KEY` | same 64-char hex as frontend `VITE_ENCRYPTION_KEY` |
| `ALLOWED_ORIGINS` | `https://finsieve-tau.vercel.app` (your Vercel URL) |
| `FRONTEND_URL` | `https://finsieve-tau.vercel.app` |
| `EMAIL_USER` / `EMAIL_PASSWORD` / `EMAIL_FROM_NAME` | if you use email |

4. **SSL:** If the DB URL uses `?sslmode=require`, ensure the `pg` client uses SSL. Railway/Neon often need no extra config when using the full URL. If you use separate vars, some hosts need `PGSSLMODE=require`.
5. Deploy. Note the **public URL** (e.g. `https://finsieve-backend.railway.app`).

### Option B: Render

1. [render.com](https://render.com) → **New** → **Web Service** → connect GitHub → select **finsieve**.
2. **Root Directory:** `finsieve-backend`.
3. **Build:** `npm install`
4. **Start:** `npm start`
5. **Environment:** Add the same variables as in the table above (DB_*, JWT_*, ENCRYPTION_KEY, ALLOWED_ORIGINS, FRONTEND_URL, etc.).
6. Deploy and copy the service URL (e.g. `https://finsieve-api.onrender.com`).

---

## Step 4: Point frontend (Vercel) to the backend

In **Vercel** → your project → **Settings** → **Environment Variables**, set:

| Variable | Value |
|----------|--------|
| `VITE_API_BASE_URL` | `https://your-backend-url.railway.app/api/v1` (or your Render URL + `/api/v1`) |
| `VITE_MARKET_WS_URL` | `wss://your-backend-url.railway.app/ws/market` (or Render URL; use `wss://` in production) |
| `VITE_ENCRYPTION_KEY` | **Same** 64-char hex as backend `ENCRYPTION_KEY` |

Then **Redeploy** the frontend (Deployments → ⋮ → Redeploy).

---

## Step 5: CORS and backend URL

- Backend **ALLOWED_ORIGINS** must include your Vercel URL: `https://finsieve-tau.vercel.app` so the browser allows API calls.
- Frontend **VITE_API_BASE_URL** must be exactly the backend base (e.g. `https://xxx.railway.app/api/v1`).

---

## Checklist

- [ ] Cloud PostgreSQL created (Neon / Supabase / Railway).
- [ ] `schema.sql` (and optionally `seed_global_indices.sql`) run on cloud DB.
- [ ] Backend deployed (Railway or Render) with **Root Directory** = `finsieve-backend`.
- [ ] Backend env vars set: DB_*, JWT_*, ENCRYPTION_KEY, ALLOWED_ORIGINS, FRONTEND_URL.
- [ ] Frontend env vars on Vercel: VITE_API_BASE_URL, VITE_MARKET_WS_URL, VITE_ENCRYPTION_KEY.
- [ ] Vercel redeployed after changing env vars.

After this, the site will be fully functional with database and API in the cloud.

---

## "Network error" on sign-in / login

Usually the frontend cannot reach the backend. Check the following.

### 1. Vercel: `VITE_API_BASE_URL` must point to Railway

- In **Vercel** → project → **Settings** → **Environment Variables** you must have:
  - **`VITE_API_BASE_URL`** = `https://YOUR-RAILWAY-DOMAIN/api/v1`
- Use your **real** Railway URL (e.g. `https://finsieve-backend-production-xxxx.up.railway.app`), with **no trailing slash**.
- **Redeploy Vercel** after adding or changing this. Vite bakes env vars at **build time**, so an old deploy can still call `localhost`.

### 2. Railway: `ALLOWED_ORIGINS` must include your Vercel URL

- In **Railway** → your backend service → **Variables**:
  - **`ALLOWED_ORIGINS`** = `https://finsieve-tau.vercel.app` (no trailing slash)
- If this is wrong or missing, the browser may show a CORS or network-style error.

### 3. Quick check in the browser

- Open **https://finsieve-tau.vercel.app**, open **DevTools** (F12) → **Network** tab.
- Try to sign in and find the failing request (e.g. to `.../auth/login`).
- Check **Request URL**: it must be your Railway URL (e.g. `https://xxx.railway.app/api/v1/auth/login`), not `http://localhost:3000/...`.
- If the URL is still localhost, set `VITE_API_BASE_URL` in Vercel and **redeploy**.

### 4. Test the backend directly

- In a browser or Postman, open: `https://YOUR-RAILWAY-URL/health`
- You should get JSON like `{"status":"healthy",...}`. If that fails, the backend is down or the URL is wrong.

---

## "Encrypted data could not be verified"

This means the backend could not decrypt the request (or the frontend could not decrypt the response). **The encryption key must be exactly the same on both sides.**

1. **Same value everywhere**
   - **Railway (backend):** Variable **`ENCRYPTION_KEY`** = e.g. `ff0d0d28eb6d89a4a2c1efd135c3ed7f237e35285a9f80efcbe14656a63769dc`
   - **Vercel (frontend):** Variable **`VITE_ENCRYPTION_KEY`** = **the exact same string** (copy-paste from Railway, no extra characters).

2. **No extra spaces or newlines**
   - When pasting the key in Railway or Vercel, do not add a space or newline at the end. The code trims keys, but both sides must still be the same after trimming.

3. **Redeploy both after changing the key**
   - Change **ENCRYPTION_KEY** on Railway → redeploy backend.
   - Change **VITE_ENCRYPTION_KEY** on Vercel → redeploy frontend (env vars are baked in at build time).

---

## Railway: "Deployment failed during build process"

1. **Root Directory must be `finsieve-backend`**  
   Your build logs show Railpack analyzing the **repo root** (docs/, finsieve-backend/, finsieve-web/) — so the service is **not** using the backend folder.  
   In Railway: open your **service** (e.g. "finsieve" or "dependable-peace") → **Settings** → find **"Root Directory"** or **"Source"** / **"Watch Paths"** → set **`finsieve-backend`** (no slash in front). Save and trigger a **Redeploy**.  
   After this, the build should see only `finsieve-backend/` (package.json, src/, etc.) and "Script start.sh not found" / "could not determine how to build" will go away.

2. **Use Docker build (recommended)**  
   The repo has **`finsieve-backend/Dockerfile`**. Railway will use it when Root Directory is `finsieve-backend`.  
   If Railway used Nixpacks before: **Settings** → **Build** → ensure no custom builder override, or set **Dockerfile path** to `Dockerfile` (relative to root directory).

3. **Check the actual error**  
   Open the **failed deployment** → **View logs**. The last 20–30 lines usually show the failure (e.g. `npm install` error, missing file, or crash on start). Fix that first.

4. **Env vars at deploy time**  
   Add **Variables** (e.g. `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `ALLOWED_ORIGINS`, `FRONTEND_URL`) **before** the first deploy. The app **crashes on start** if `JWT_SECRET` or `JWT_REFRESH_SECRET` is missing or shorter than 32 characters. Backend requires **Node 22** (yahoo-finance2); Dockerfile and nixpacks.toml are set to Node 22.
