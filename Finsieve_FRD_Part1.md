# FUNCTIONAL REQUIREMENTS DOCUMENT (FRD)
# Finsieve - 360° Investment Intelligence Platform

**Document Version:** 1.0  
**Date:** February 08, 2026  
**Prepared By:** Product & Design Team  
**Project Name:** Finsieve

---

## TABLE OF CONTENTS

1. [Introduction](#1-introduction)
2. [User Management](#2-user-management)
3. [Asset Class Modules](#3-asset-class-modules)
4. [Core Features](#4-core-features)
5. [User Interface Specifications](#5-user-interface-specifications)
6. [Mobile Application Specifications](#6-mobile-application-specifications)
7. [Workflows](#7-workflows)

---

## 1. INTRODUCTION

### 1.1 Purpose
This Functional Requirements Document (FRD) details the functional specifications for the Finsieve investment platform, translating business requirements into specific system behaviors and features.

### 1.2 Scope
This document covers all user-facing features, workflows, and system behaviors for the web and mobile applications across all supported asset classes.

---

## 2. USER MANAGEMENT

### 2.1 User Registration

**Feature ID:** UM-001

**Description:** New users can create an account using email or phone number, or via OAuth providers.

**Preconditions:** None

**User Flow:**
1. User navigates to registration page
2. User selects registration method (Email/Phone/Google/Apple)
3. User provides required information:
   - Email/Phone: Email address, password, first name, last name
   - OAuth: Automatic profile fetch from provider
4. System validates input:
   - Email format validation
   - Password strength check (min 8 chars, 1 uppercase, 1 number, 1 special char)
   - Duplicate account check
5. System sends verification email/SMS
6. User clicks verification link/enters OTP
7. System creates account and logs user in
8. User redirected to onboarding flow

**Acceptance Criteria:**
- Email validation follows RFC 5322 standard
- Password encrypted using bcrypt with salt rounds = 12
- Verification email/SMS sent within 30 seconds
- Account created with FREE tier by default
- User profile created in database
- Welcome email sent post-verification

**Error Handling:**
- Email/Phone already exists → "Account already exists. Please log in."
- Invalid email format → "Please enter a valid email address."
- Weak password → "Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character."
- OAuth failure → "Unable to authenticate with [Provider]. Please try again."

### 2.2 User Login

**Feature ID:** UM-002

**Description:** Registered users can log in using credentials or OAuth.

**User Flow:**
1. User navigates to login page
2. User enters email/phone and password OR selects OAuth provider
3. System validates credentials
4. For correct credentials:
   - System generates JWT access token (1-hour expiry)
   - System generates refresh token (30-day expiry)
   - System updates last_login timestamp
   - User redirected to dashboard
5. For incorrect credentials:
   - System increments failed attempt counter
   - After 5 failed attempts: Account locked for 15 minutes

**Acceptance Criteria:**
- Login successful within 2 seconds for valid credentials
- JWT token contains user_id, tier, permissions
- Session maintained until token expires or user logs out
- "Remember Me" option stores refresh token (30 days)

**Security Features:**
- Rate limiting: Max 5 login attempts per 15 minutes per IP
- Account lockout after 5 failed attempts
- CAPTCHA after 3 failed attempts
- Login notification email for new device

### 2.3 Profile Management

**Feature ID:** UM-003

**Description:** Users can view and update their profile information.

**Editable Fields:**
- First name, Last name
- Phone number (with re-verification)
- Password (requires current password)
- Preferences:
  - Default currency (INR, USD)
  - Theme (Light, Dark, Auto)
  - Language (English, Hindi)
  - Default chart type (Line, Candlestick, Area)
  - Email notifications (On/Off)

**User Flow (Password Change):**
1. User navigates to Settings → Security
2. User enters current password
3. User enters new password (2x for confirmation)
4. System validates current password
5. System checks new password strength
6. System updates password hash
7. System invalidates all existing sessions except current
8. System sends password change confirmation email
9. Success message displayed

**Acceptance Criteria:**
- Profile updates reflected immediately
- Password change requires current password verification
- Email/Phone change requires re-verification
- Session invalidation after password change (except current device)

---

## 3. ASSET CLASS MODULES

### 3.1 Indian Equities Module

**Feature ID:** EQ-001

**Description:** Display Indian equity stocks (NSE/BSE) with comprehensive data and screening capabilities.

**Data Points Displayed:**
- **Basic:** Symbol, Name, ISIN, Exchange, Sector, Industry
- **Price:** Current Price, Open, High, Low, Previous Close, Volume, Turnover
- **Valuation:** Market Cap, P/E Ratio, P/B Ratio, Div Yield, EPS
- **Performance:** 1D, 1W, 1M, 3M, 6M, 1Y, 3Y, 5Y returns
- **Risk:** Beta, Volatility (30D, 90D, 1Y), 52W High/Low
- **Fundamentals:** Revenue, Profit, ROE, ROCE, Debt-to-Equity

**Screening Parameters (50+ total):**

*Valuation Filters:*
- Market Cap (₹ range)
- P/E Ratio (range)
- P/B Ratio (range)
- Price-to-Sales Ratio
- EV/EBITDA
- Dividend Yield (% range)

*Performance Filters:*
- Returns: 1D, 1W, 1M, 3M, 6M, 1Y, 3Y, 5Y (% range)
- Price Change (₹ or % from 52W High/Low)
- Volume (shares or ₹ value range)

*Fundamental Filters:*
- Revenue Growth (QoQ, YoY %)
- Profit Growth (QoQ, YoY %)
- ROE (% range)
- ROCE (% range)
- Debt-to-Equity ratio
- Current Ratio
- Quick Ratio

*Technical Filters:*
- 50-day Moving Average (Above/Below)
- 200-day Moving Average (Above/Below)
- RSI (range 0-100)
- Volume above average (Yes/No, % threshold)

*Classification Filters:*
- Exchange (NSE, BSE, Both)
- Sector (dropdown: 11 sectors)
- Industry (dropdown: 100+ industries)
- Market Cap Category (Large, Mid, Small)
- Index Membership (NIFTY 50, SENSEX, etc.)

**Acceptance Criteria:**
- Screening returns results within 3 seconds for any filter combination
- Results are paginated (50 per page by default, configurable to 100/250)
- All data points updated every 15 minutes (free tier) or real-time (premium)
- Filters are combinable (AND logic)
- User can save filter presets for future use

### 3.2 Mutual Funds Module

**Feature ID:** MF-001

**Description:** Comprehensive mutual fund research and comparison platform.

**Data Points Displayed:**
- **Basic:** Fund Name, AMC, Category, Sub-category, ISIN
- **Performance:** Current NAV, Returns (1D, 1W, 1M, 3M, 6M, 1Y, 3Y, 5Y, 10Y, Since Inception)
- **Risk-Adjusted:** CAGR (3Y, 5Y), Sharpe Ratio, Standard Deviation, Alpha, Beta
- **Fund Details:** AUM, Expense Ratio, Exit Load, Min Investment, Min SIP Amount
- **Portfolio:** Top 10 Holdings, Sector Allocation, Asset Allocation
- **Additional:** Fund Manager, Launch Date, Benchmark Index, Risk Level

**Screening Parameters (30+):**

*Category Filters:*
- Category: Equity, Debt, Hybrid, Solution-Oriented, Other
- Sub-category: Large Cap, Mid Cap, Small Cap, Multi Cap, Flexi Cap, etc.
- Risk Level: Low, Moderate, High, Very High

*Performance Filters:*
- Returns (1Y, 3Y, 5Y, 10Y): % range
- CAGR (3Y, 5Y): % range
- Trailing Returns vs. Benchmark (Outperformance/Underperformance %)

*Risk Filters:*
- Standard Deviation (3Y, 5Y): % range
- Sharpe Ratio (3Y, 5Y): range
- Beta (range)
- Alpha (range)

*Fund Characteristics:*
- AUM (₹ range)
- Expense Ratio (% range)
- Exit Load (Yes/No, % range)
- Min Investment Amount (₹ range)
- Min SIP Amount (₹ range)
- Fund Age (years range)

**Acceptance Criteria:**
- Comparison loads within 2 seconds
- Visual charts render properly on all devices
- Export includes all comparison metrics and charts
- Historical chart supports up to 10-year view
- Color-coded performance (green for positive, red for negative)

### 3.3 US Equities Module

**Feature ID:** US-001

**Description:** US stock market data (NYSE, NASDAQ) with INR conversion.

**Data Points:**
- **Basic:** Ticker, Company Name, Exchange, Sector, Industry, Market Cap (USD & INR)
- **Price:** Current Price (USD), Change, % Change, Volume, 52W High/Low
- **Valuation:** P/E, P/B, PEG Ratio, Dividend Yield
- **Performance:** Returns in USD and INR (1M, 3M, 6M, 1Y, 3Y, 5Y)
- **Currency:** Live USD/INR exchange rate displayed

**Currency Handling:**
- Default display: USD (with INR in parentheses)
- User can toggle: "Show all in INR"
- Returns calculated in both currencies (to account for forex movement)
- Clear indication: "Returns in USD" or "Returns in INR"

**Acceptance Criteria:**
- Currency conversion uses live exchange rates (updated every 5 minutes)
- Returns shown in both USD and INR
- Clear labeling of currency throughout
- Forex rate displayed with timestamp

### 3.4 Global Indices Module

**Feature ID:** GI-001

**Description:** Display 50+ major global indices with real-time/delayed quotes.

**Indices Covered:**
- **India:** NIFTY 50, SENSEX, NIFTY Bank, NIFTY IT, etc. (20+)
- **US:** S&P 500, NASDAQ 100, Dow Jones, Russell 2000
- **Europe:** FTSE 100, DAX, CAC 40, Euro Stoxx 50
- **Asia-Pacific:** Nikkei 225, Hang Seng, Shanghai Composite, ASX 200
- **Others:** MSCI World, MSCI Emerging Markets

**Data Displayed:**
- Current Value, Change, % Change
- Open, High, Low, Previous Close
- Intraday Chart (1D, 5D)
- Historical performance (1M, 3M, 6M, YTD, 1Y, 3Y, 5Y, 10Y)
- Top constituents (if applicable)
- Related ETFs/Index Funds

**Acceptance Criteria:**
- All indices updated every 5 minutes (delayed) or real-time (premium)
- Dashboard loads within 2 seconds
- Historical data available for at least 10 years
- Charts support zoom and pan functionality

### 3.5 Commodities Module

**Feature ID:** CM-001

**Description:** Indian commodities trading data (MCX, NCDEX).

**Commodities Covered:**
- **Metals:** Gold, Silver, Copper, Zinc, Aluminum, Lead, Nickel
- **Energy:** Crude Oil, Natural Gas
- **Agriculture:** Wheat, Rice, Soybean, Cotton, Sugar, Turmeric, Jeera, etc.

**Data Points:**
- Current Price (per contract unit)
- Change, % Change
- Open, High, Low, Volume
- Open Interest
- Contract specifications (size, expiry, tick size)
- Basis (Spot vs. Futures difference)

**Screening Parameters:**
- Commodity Type (Metals, Energy, Agriculture, Spices)
- Exchange (MCX, NCDEX)
- % Change (range)
- Volume (range)
- Contract Expiry (This Month, Next Month, Far Month)
- Price Range

### 3.6 Bonds Module

**Feature ID:** BD-001

**Description:** Corporate and Government bonds in India.

**Bond Types:**
- Corporate Bonds (Listed on NSE/BSE)
- Government Securities (G-Secs)
- State Development Loans (SDLs)
- Treasury Bills (T-Bills)

**Data Points:**
- Bond Name, ISIN, Issuer
- Face Value, Issue Date, Maturity Date
- Coupon Rate (%), Payment Frequency
- Current Price, YTM (Yield to Maturity)
- Credit Rating (CRISIL, ICRA, etc.)
- Accrued Interest
- Duration, Modified Duration
- Trading Volume

**Screening Parameters:**
- Bond Type (Corporate, G-Sec, SDL, T-Bill)
- Issuer (Government, PSU, Private Corp)
- Credit Rating (AAA, AA+, AA, A+, etc.)
- Maturity (< 1Y, 1-3Y, 3-5Y, 5-10Y, >10Y)
- YTM (% range)
- Coupon Rate (% range)
- Sector (for corporate bonds)

### 3.7 Cryptocurrency Module

**Feature ID:** CR-001

**Description:** Top 100 cryptocurrencies by market cap.

**Cryptocurrencies Covered:**
- Major: Bitcoin (BTC), Ethereum (ETH), BNB, XRP, Cardano, Solana, etc.
- Top 100 by market capitalization (updated weekly)

**Data Points:**
- Symbol, Name, Blockchain
- Current Price (USD & INR), 24H Change
- Market Cap (USD & INR), Rank
- 24H Volume, Circulating Supply, Max Supply
- All-Time High, All-Time High Date
- Performance: 1H, 24H, 7D, 30D, 90D, 1Y
- Website, Whitepaper Link

**Screening Parameters:**
- Market Cap Rank (1-10, 11-50, 51-100)
- Market Cap (USD/INR range)
- Price (USD/INR range)
- 24H % Change (range)
- 24H Volume (USD/INR range)
- Circulating Supply % (vs. Max Supply)

**Special Features:**
- **Dominance Chart:** Bitcoin vs. Altcoin market cap pie chart
- **Correlation Matrix:** Show correlation between top cryptos
- **Exchange Listings:** Platforms where the crypto is traded
- **Disclaimer:** "Cryptocurrency investments are subject to high market risk. Please conduct your own research."

---

## 4. CORE FEATURES

### 4.1 Advanced Screening Engine

**Feature ID:** SC-001

**Description:** Powerful multi-parameter screening across all asset classes.

**Capabilities:**
- Combine 50+ parameters per asset class
- Multi-level sorting (primary + secondary + tertiary)
- Save custom screening presets (up to 10 for free, unlimited for premium)
- Share screening presets with other users (public presets)
- Real-time result count as filters are applied
- Export screening results

**Filter Types:**
- **Range Filters:** Min/Max input (e.g., Market Cap ₹1000 Cr - ₹10,000 Cr)
- **Dropdown Filters:** Single or multi-select (e.g., Sector, Exchange)
- **Boolean Filters:** Yes/No toggle (e.g., Dividend Paying)
- **Comparison Filters:** Greater than, Less than benchmark

**Preset Screens (Pre-built by Finsieve):**

*Equities:*
- "Warren Buffett Stocks" (High ROE, Low Debt, Consistent Earnings)
- "Dividend Aristocrats" (Consistent dividend growth for 10+ years)
- "Breakout Stocks" (Price > 50 DMA & 200 DMA, High Volume)
- "Value Stocks" (Low P/E, Low P/B, High Dividend Yield)

*Mutual Funds:*
- "Top Performing Large Cap Funds" (3Y CAGR > 20%, Low Expense Ratio)
- "Best SIP Funds" (Consistent returns, Low volatility)
- "Tax Saver ELSS" (Category = ELSS, 3Y Returns sorted)

**Acceptance Criteria:**
- Filters apply instantly (< 1 second for result count update)
- Full screening results load within 3 seconds
- Saved presets persist across sessions
- Public presets discoverable in community section
- Export includes all visible columns

### 4.2 Comparison Tool

**Feature ID:** CM-001

**Description:** Side-by-side comparison of up to 5 instruments.

**Comparison Types:**
- Equity vs. Equity (same exchange or cross-exchange)
- Mutual Fund vs. Mutual Fund (even different categories)
- Bond vs. Bond
- Crypto vs. Crypto
- Mixed comparisons (with appropriate disclaimers)

**Comparison Metrics (Equities Example):**

*Price & Valuation:*
- Current Price, Market Cap
- P/E, P/B, PEG, EV/EBITDA
- Dividend Yield, Payout Ratio

*Performance:*
- Returns: 1M, 3M, 6M, 1Y, 3Y, 5Y
- Volatility: 30D, 90D, 1Y
- 52W High/Low, % from 52W High/Low

*Fundamentals:*
- Revenue (TTM), Revenue Growth (YoY)
- Net Profit (TTM), Profit Growth (YoY)
- ROE, ROCE, Debt/Equity

*Technical:*
- Beta, Alpha
- 50 DMA, 200 DMA (Price vs. DMA)
- RSI (14-day)

**Comparison Visualization:**
- **Table View:** All metrics in rows, instruments in columns
- **Chart View:** Overlaid price/NAV chart (normalized to 100 at start date)
- **Radar Chart:** Multi-dimensional comparison (for selected metrics)
- **Heatmap:** Color-coded best/worst performer for each metric

**Acceptance Criteria:**
- Comparison loads within 2 seconds
- All charts render properly on desktop and mobile
- Shared links are publicly accessible (no login required for viewing)
- PDF export includes all metrics and charts
- Comparison persists across page refreshes

### 4.3 Interactive Charts

**Feature ID:** CH-001

**Description:** Advanced, interactive charting with technical indicators.

**Chart Types:**
- Line Chart (default for long-term view)
- Candlestick Chart (default for short-term, intraday)
- Area Chart (alternative to line)
- Bar Chart (OHLC bars)

**Time Periods:**
- Intraday: 1 Minute, 5 Minute, 15 Minute, 30 Minute, 1 Hour (premium)
- Daily: 1 Day, 5 Days, 1 Month
- Long-term: 3 Months, 6 Months, YTD, 1 Year, 3 Years, 5 Years, 10 Years, All

**Technical Indicators (Premium Feature):**
- **Moving Averages:** SMA (20, 50, 100, 200), EMA (12, 26, 50, 200)
- **Momentum:** RSI (14), MACD (12, 26, 9), Stochastic
- **Volatility:** Bollinger Bands (20, 2), ATR
- **Volume:** Volume bars, Volume SMA
- **Others:** Fibonacci Retracement, Support/Resistance lines

**Chart Features:**
- **Zoom:** Pinch to zoom (mobile), scroll wheel (desktop)
- **Pan:** Drag to pan across timeline
- **Crosshair:** Hover to see exact values at any point
- **Drawing Tools (Premium):** Trend Lines, Horizontal Lines, Fibonacci, Annotations
- **Comparison Overlay:** Overlay multiple instruments on same chart
- **Logarithmic Scale:** Toggle linear/logarithmic Y-axis
- **Event Markers:** Dividend ex-dates, stock splits, bonus issues marked

**Acceptance Criteria:**
- Charts render within 1 second
- Smooth animations for period changes and zoom
- Indicator calculations are accurate
- Charts work on all modern browsers
- Mobile charts are fully functional

### 4.4 Watchlist Management

**Feature ID:** WL-001

**Description:** Create and manage personalized watchlists for quick monitoring.

**Watchlist Features:**
- Create multiple watchlists (3 max for free, unlimited for premium)
- Add any instrument from any asset class to watchlist
- Rename, delete, reorganize watchlists
- Set one watchlist as "Default" (auto-loaded on dashboard)
- Watchlist-level performance tracking
- Quick add from anywhere in the app

**Data Displayed in Watchlist:**
- Instrument Symbol, Name
- Current Price, Day Change (₹ & %)
- Personal Notes (user can add)
- Date Added
- Quick Actions: View Details, Compare, Remove

**Watchlist Aggregates:**
- Total Value (if user has indicated holdings)
- Overall % Change (today)
- Best Performer (today)
- Worst Performer (today)

**Acceptance Criteria:**
- Watchlist updates in real-time (WebSocket for premium, 5-second polling for free)
- Quick add works from every page
- Watchlists sync across devices
- Offline support with last fetched data
- Export to Excel/CSV available

### 4.5 Search Functionality

**Feature ID:** SR-001

**Description:** Global search across all instruments with intelligent autocomplete.

**Search Capabilities:**
- Search by: Name (partial or full), Symbol/Ticker, ISIN, AMC Name
- Fuzzy matching (handles typos)
- Search across all asset classes or filter by specific class
- Results ranked by relevance and popularity

**Autocomplete:**
- Appears after 2 characters typed
- Shows top 10 matching results
- Keyboard navigable
- Recent searches displayed (max 10)

**Acceptance Criteria:**
- Autocomplete appears within 200ms of typing
- Full search results load within 1 second
- Search works offline with cached data (mobile apps)
- Recent searches persist across sessions
- Search is case-insensitive

### 4.6 Data Export

**Feature ID:** EX-001

**Description:** Export data in multiple formats for offline analysis.

**Export Formats:**
- **Excel (.xlsx):** Formatted spreadsheet with formulas
- **CSV (.csv):** Raw data for import into other tools
- **PDF (.pdf):** Professional report with charts and branding

**Exportable Data:**
- Screening results (full list or filtered)
- Comparison reports
- Watchlist data
- Individual instrument data
- Charts (as images in PDF)

**Export Limits:**
- Free Tier: 100 rows per export, 10 exports/day
- Premium Tier: Unlimited rows, unlimited exports

**Acceptance Criteria:**
- Export generation time < 5 seconds for up to 1000 rows
- Files open properly in respective applications
- File naming is consistent and descriptive
- Export includes disclaimer and data source attribution
- Charts in PDF are high-resolution (300 DPI minimum)

### 4.7 News Integration

**Feature ID:** NW-001

**Description:** Aggregate and display relevant financial news.

**News Sources:**
- Economic Times, Business Standard, Mint
- Bloomberg, Moneycontrol, Reuters
- Company press releases

**News Display:**
- **Instrument-specific:** Top 5 news items on detail page
- **General Market News:** Dedicated "News" section
- **Customized Feed:** Follow specific sectors/companies (premium)

**News Attributes:**
- Title, Summary (2-3 sentences)
- Source, Author
- Published Date/Time (relative)
- Full Article Link
- Sentiment Tag: Positive/Neutral/Negative (AI-powered)
- Related Instruments

**Acceptance Criteria:**
- News updated every 15 minutes
- News loading doesn't block page rendering
- Sentiment tags displayed when confidence > 70%
- News accessible without login

---

## 5. USER INTERFACE SPECIFICATIONS

### 5.1 Responsive Design

**Screen Size Support:**
- **Desktop:** 1920x1080 and above (optimized), 1366x768 minimum
- **Tablet:** 768px - 1024px width
- **Mobile:** 375px - 414px width, 320px minimum

**Layout Adaptations:**
- **Desktop:** Multi-column layouts, sidebar navigation
- **Tablet:** Collapsible sidebars, simplified tables
- **Mobile:** Single column, bottom navigation, swipeable cards

### 5.2 Navigation Structure

**Web Application (Desktop):**

*Top Navigation Bar:*
- Logo (left) - Returns to dashboard
- Search Bar (center)
- User Menu (right) - Profile, Settings, Logout
- Upgrade to Premium (if free user)

*Left Sidebar:*
```
Dashboard
─────────
Markets
  ├─ Indian Equities
  ├─ US Equities
  ├─ Mutual Funds
  ├─ Commodities
  ├─ Bonds
  ├─ Treasury Securities
  ├─ Cryptocurrencies
  └─ Global Indices
─────────
Tools
  ├─ Screener
  ├─ Compare
  └─ Watchlists
─────────
News
Settings
Help & Support
```

**Mobile Application:**

*Bottom Tab Navigation:*
```
[Dashboard] [Markets] [Screener] [Watchlist] [More]
```

### 5.3 Color Scheme & Branding

**Primary Colors:**
- **Primary Blue:** #1E40AF
- **Success Green:** #10B981
- **Danger Red:** #EF4444
- **Warning Yellow:** #F59E0B
- **Neutral Gray:** #6B7280

**Light Theme:**
- Background: #FFFFFF
- Text Primary: #111827
- Borders: #E5E7EB

**Dark Theme:**
- Background: #111827
- Text Primary: #F9FAFB
- Borders: #374151

### 5.4 Typography

**Font Family:**
- **Primary:** Inter (Sans-serif)
- **Monospace:** Roboto Mono (for prices)

**Font Sizes:**
- **H1:** 32px (Page titles)
- **H2:** 24px (Section headings)
- **Body:** 16px (Standard text)
- **Small:** 14px (Secondary info)

### 5.5 Accessibility

**WCAG 2.1 Level AA Compliance:**
- Color contrast ratio minimum 4.5:1
- All elements keyboard-accessible
- Focus indicators visible
- ARIA labels for screen readers
- Alt text for all images

---

**End of FRD Part 1**

*(Continued in Finsieve_FRD_Part2.md)*
