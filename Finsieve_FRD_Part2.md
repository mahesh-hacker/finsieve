# FUNCTIONAL REQUIREMENTS DOCUMENT (FRD) - PART 2
# Finsieve - 360° Investment Intelligence Platform
# WORKFLOWS & MOBILE SPECIFICATIONS

---

## 6. MOBILE APPLICATION SPECIFICATIONS

### 6.1 Platform-Specific Features

**iOS Features:**
- **Face ID / Touch ID:** Biometric login (optional, user-enabled)
- **3D Touch / Haptic Feedback:** Quick actions from home screen
- **Widgets:** Home screen widget showing top watchlist (iOS 14+)
- **Siri Shortcuts:** "Hey Siri, show me RELIANCE stock price"
- **Share Sheet:** Native iOS share for reports, watchlists
- **App Clips:** Lightweight experience for shared watchlists

**Android Features:**
- **Fingerprint / Face Unlock:** Biometric login
- **Home Screen Widgets:** Watchlist widget (multiple sizes)
- **Quick Settings Tile:** Toggle real-time data updates
- **Share Targets:** Direct share to WhatsApp, Email
- **App Shortcuts:** Long-press app icon for quick actions

### 6.2 Offline Capabilities

**Offline Mode:**
- **Last Fetched Data:** Display with "Last updated: X minutes ago" indicator
- **Cached Charts:** Last loaded chart data viewable
- **Watchlist:** Fully functional with cached data
- **Search:** Recent searches available
- **Sync on Reconnect:** Auto-sync when connection restored

**Data Caching Strategy:**
- Cache instrument details for 1 hour
- Cache watchlist data for 30 minutes
- Cache screening results for 15 minutes
- Cache news for 1 hour

### 6.3 Performance Optimization

**Lazy Loading:**
- Load images as they come into viewport
- Infinite scroll for lists (20 items at a time)
- Charts load after page elements

**App Size:**
- Target APK/IPA size: < 50 MB initial download
- On-demand resources for less-used features
- Code splitting

---

## 7. WORKFLOWS

### WORKFLOW 1: USER ONBOARDING

```
START
│
├─ User opens app/website for first time
│
├─ Splash screen (2 seconds)
│   └─ Finsieve logo + tagline: "Your 360° Investment Hub"
│
├─ Onboarding Carousel (Swipeable, 3 slides):
│   ├─ Slide 1: "Track Global Markets"
│   │   └─ Image: World map with market indices
│   ├─ Slide 2: "Compare & Analyze"
│   │   └─ Image: Side-by-side comparison screen
│   └─ Slide 3: "Screen & Discover"
│       └─ Image: Screener results
│   └─ [Skip] or [Next →]
│
├─ Registration Screen
│   ├─ Options:
│   │   ├─ "Continue with Google" (OAuth)
│   │   ├─ "Continue with Apple" (OAuth)
│   │   ├─ "Continue with Email"
│   │   └─ "Continue with Phone"
│   └─ [Already have an account? Log In]
│
├─ [If Email/Phone selected]
│   ├─ Form:
│   │   ├─ First Name
│   │   ├─ Last Name
│   │   ├─ Email / Phone
│   │   └─ Password (with strength meter)
│   ├─ [Terms & Conditions] checkbox
│   └─ [Create Account] button
│   │
│   ├─ Backend: Create account → Send verification email/SMS
│   │
│   └─ Verification Screen:
│       ├─ "We've sent a verification code to [email/phone]"
│       ├─ OTP input (6 digits)
│       ├─ [Verify] button
│       └─ [Resend Code] (30-second countdown)
│
├─ Account Verified ✓
│
├─ Preference Setup (Optional, Skippable):
│   ├─ "Customize Your Experience"
│   ├─ Select Interests (Multi-select):
│   │   ├─ Indian Stocks
│   │   ├─ US Stocks
│   │   ├─ Mutual Funds
│   │   ├─ Commodities
│   │   ├─ Cryptocurrencies
│   │   └─ Bonds
│   ├─ [Skip] or [Continue →]
│   │
│   ├─ Select Sectors (Multi-select):
│   │   ├─ Technology
│   │   ├─ Banking & Finance
│   │   ├─ Healthcare
│   │   └─ [10 more sectors...]
│   └─ [Skip] or [Continue →]
│
├─ Guided Tour (Optional, Skippable):
│   ├─ Tooltip 1: "Search for any stock or fund here"
│   ├─ Tooltip 2: "Access all markets from here"
│   ├─ Tooltip 3: "Create watchlists to track favorites"
│   └─ [Got it!] or [Skip Tour]
│
└─ Redirect to Dashboard
    └─ Welcome message: "Welcome to Finsieve, [Name]!"

END
```

---

### WORKFLOW 2: EQUITY SCREENING

```
START: User wants to screen Indian equities
│
├─ User navigates to "Indian Equities" → "Screener"
│
├─ Screener Page Loads
│   ├─ Left Panel: Filters (Collapsible sections)
│   ├─ Right Panel: Results Table
│   └─ Top: "Showing 5,234 stocks" (Updates dynamically)
│
├─ USER ACTION: Apply Filters
│   │
│   ├─ FILTER 1: Market Cap
│   │   ├─ User clicks "Market Cap" section (expands)
│   │   ├─ Input: Min [10000] Max [blank]
│   │   ├─ Unit: [Crores]
│   │   └─ Result count: "Showing 1,456 stocks"
│   │
│   ├─ FILTER 2: P/E Ratio
│   │   ├─ Input: Min [0] Max [30]
│   │   └─ Result count: "Showing 892 stocks"
│   │
│   ├─ FILTER 3: Returns (1Y)
│   │   ├─ Input: Min [15] Max [blank]
│   │   └─ Result count: "Showing 234 stocks"
│   │
│   ├─ FILTER 4: Sector
│   │   ├─ Multi-select: "Technology", "Financial Services"
│   │   └─ Result count: "Showing 128 stocks"
│   │
│   └─ FILTER 5: Dividend Yield
│       ├─ Input: Min [1] Max [blank]
│       └─ Result count: "Showing 87 stocks"
│
├─ USER ACTION: Apply Sorting
│   ├─ Click "Returns (1Y)" column header
│   ├─ Sort: Descending ↓
│   ├─ Shift-click "Market Cap" (Secondary sort)
│   └─ Results sorted by: Returns(1Y) DESC, Market Cap DESC
│
├─ RESULTS DISPLAYED
│   ├─ Table: Symbol, Name, Price, Change%, Market Cap, P/E, Returns, Yield
│   ├─ Pagination: "Page 1 of 2" [50 per page]
│   └─ Actions: [View] [Add to Watchlist] [Compare]
│
├─ USER ACTION: Save Screen (Optional)
│   ├─ Click "Save Screen"
│   ├─ Modal:
│   │   ├─ Name: "High Growth Large Caps"
│   │   ├─ Description: [Optional]
│   │   └─ Make Public: [Checkbox]
│   ├─ Click [Save]
│   └─ Success: "Screen saved!"
│
├─ USER ACTION: Export Results
│   ├─ Click "Export"
│   ├─ Select: Format = Excel, Rows = All
│   ├─ Click [Export]
│   └─ Download: "Finsieve_Equities_2026-02-08.xlsx"
│
├─ USER ACTION: Compare Stocks
│   ├─ Select checkboxes: TCS, Infosys, Wipro
│   ├─ Click [Compare Selected]
│   └─ Redirect to Comparison Page
│
└─ END

Backend Processing:
1. Receive filters
2. Build dynamic SQL query
3. Check Redis cache
4. Query PostgreSQL if cache miss
5. Format as JSON
6. Cache in Redis (TTL: 10 min)
7. Return to frontend
```

---

### WORKFLOW 3: MUTUAL FUND COMPARISON

```
START: User wants to compare 3 mutual funds
│
├─ Navigate to "Mutual Funds" → "Compare"
│
├─ Comparison Page Loads
│   └─ Search bar: "Add funds to compare (2-5 funds)"
│
├─ USER ACTION: Add Fund 1
│   ├─ Type "HDFC Top 100"
│   ├─ Autocomplete shows suggestions
│   ├─ Select "HDFC Top 100 Fund - Direct - Growth"
│   └─ Fund added to queue
│
├─ USER ACTION: Add Funds 2 & 3
│   ├─ Add "ICICI Pru Bluechip - Direct - Growth"
│   └─ Add "Axis Bluechip - Direct - Growth"
│
├─ Comparison Queue: 3 Funds
│   └─ [Compare Now] button enabled
│
├─ USER CLICKS: [Compare Now]
│
├─ BACKEND PROCESSING:
│   ├─ Fetch data for all 3 funds
│   ├─ Query mutual_fund_details
│   ├─ Query mutual_fund_returns
│   ├─ Fetch historical NAV (5 years)
│   ├─ Fetch portfolio holdings
│   └─ Return JSON
│
├─ COMPARISON PAGE RENDERS
│   │
│   ├─ SECTION 1: Fund Cards
│   │   └─ 3 cards: Name, NAV, Change, AUM, Expense Ratio
│   │
│   ├─ SECTION 2: Performance Chart
│   │   ├─ Bar chart: Returns across periods
│   │   └─ Table with color-coded best/worst
│   │
│   ├─ SECTION 3: Risk Metrics
│   │   └─ Std Dev, Sharpe, Alpha, Beta
│   │
│   ├─ SECTION 4: Fund Details
│   │   └─ AUM, Expense, Exit Load, Manager
│   │
│   ├─ SECTION 5: Historical NAV Chart
│   │   └─ Line chart (5 years, 3 overlaid lines)
│   │
│   └─ SECTION 6: Portfolio Composition
│       ├─ Top 10 Holdings (3 columns)
│       └─ Sector Allocation (3 pie charts)
│
├─ USER ACTION: Export as PDF
│   ├─ Click [Export as PDF]
│   ├─ Backend generates PDF with all data
│   └─ Download: "Finsieve_MF_Comparison.pdf"
│
├─ USER ACTION: Share Comparison
│   ├─ Click [Share]
│   ├─ Generate link: https://finsieve.com/compare/abc123
│   ├─ Modal: Copy link, social share buttons
│   └─ User shares via WhatsApp/Email
│
└─ END

Shareable Link Behavior:
- Opens read-only comparison
- No login required
- Banner: "Sign up to create your own"
```

---

### WORKFLOW 4: WATCHLIST MANAGEMENT

```
START: User wants to track favorite stocks
│
├─ Navigate to "Watchlists"
│
├─ Watchlists Page Loads
│   ├─ Sidebar: List of watchlists
│   │   ├─ "My Tech Stocks" ⭐ (Default)
│   │   ├─ "High Dividend Stocks"
│   │   └─ [+ Create New]
│   └─ Main Panel: Current watchlist
│
├─ SCENARIO A: Create New Watchlist
│   ├─ Click [+ Create New Watchlist]
│   ├─ Modal:
│   │   ├─ Name: "Nifty 50 Stocks"
│   │   ├─ Description: "Tracking NIFTY 50"
│   │   └─ Set as Default: [unchecked]
│   ├─ Click [Create]
│   ├─ Backend: Create in MongoDB
│   └─ New watchlist appears in sidebar
│
├─ SCENARIO B: Add Instruments
│   │
│   ├─ METHOD 1: Via Search
│   │   ├─ Type "Reliance"
│   │   ├─ Click result
│   │   ├─ Click [Add to This Watchlist]
│   │   └─ Instrument added
│   │
│   ├─ METHOD 2: From Screener
│   │   ├─ On screener page, see TCS
│   │   ├─ Click [+ Watchlist] icon
│   │   ├─ Select "Nifty 50 Stocks"
│   │   └─ Success: "TCS added"
│   │
│   └─ Add more: Infosys, HDFC Bank, ICICI Bank
│
├─ WATCHLIST DISPLAY
│   │
│   ├─ Header:
│   │   ├─ Name: "Nifty 50 Stocks"
│   │   ├─ Stats: 4 instruments, +1.24% today
│   │   └─ Actions: [Edit] [Delete] [Set Default]
│   │
│   └─ Instruments Table:
│       ┌──────────┬────────┬────────┬─────────┬────────┐
│       │ Symbol   │ Price  │ Change │ Change% │ Actions│
│       ├──────────┼────────┼────────┼─────────┼────────┤
│       │ RELIANCE │ 2456.75│ +30.25 │ +1.24%  │ [...]  │
│       │ TCS      │ 3856.40│ +45.60 │ +1.20%  │ [...]  │
│       │ HDFCBANK │ 1623.80│ +12.30 │ +0.76%  │ [...]  │
│       │ ICICIBANK│ 1089.25│ -3.85  │ -0.35%  │ [...]  │
│       └──────────┴────────┴────────┴─────────┴────────┘
│
├─ SCENARIO C: Add Personal Notes
│   ├─ Click [Add Note] for ICICI Bank
│   ├─ Type: "Watch for Q4 results"
│   ├─ Backend: Update MongoDB
│   └─ Note displayed in table
│
├─ SCENARIO D: Real-Time Updates (WebSocket)
│   ├─ Frontend: Establish WebSocket connection
│   ├─ Subscribe to instrument IDs
│   ├─ Receive update: RELIANCE price → 2457.50
│   ├─ Update UI instantly (green flash animation)
│   └─ Recalculate watchlist stats
│
├─ SCENARIO E: Remove Instrument
│   ├─ Desktop: Click [...] → Remove
│   ├─ Mobile: Swipe left → [Delete]
│   ├─ Confirmation: "Remove HDFCBANK?"
│   ├─ Backend: Pull from MongoDB array
│   └─ Row removed with fade-out
│
├─ SCENARIO F: Watchlist Performance Chart (Premium)
│   ├─ Click "View Performance Chart"
│   ├─ Modal: Line chart of portfolio value
│   ├─ Compare with NIFTY 50 benchmark
│   └─ Time periods: 1M, 3M, 6M, 1Y
│
├─ SCENARIO G: Set as Default
│   ├─ Click [Set as Default]
│   ├─ Backend: Update is_default flags
│   └─ ⭐ appears next to watchlist name
│
└─ END

Additional Features:
- Offline: Show cached data with timestamp
- Pull-to-Refresh on mobile
- Export to Excel/CSV
- Share watchlist (Premium)
```

---

### WORKFLOW 5: INSTRUMENT DETAIL PAGE

```
START: User views detailed stock information
│
├─ Search "Reliance" → Click result
│
├─ Redirect to: /equities/RELIANCE
│
├─ PAGE LOADS (Progressive)
│   │
│   ├─ HEADER (Loads First):
│   │   ├─ Logo + Name: "Reliance Industries Ltd"
│   │   ├─ Symbol: RELIANCE | NSE | INE002A01018
│   │   ├─ Sector: Energy | Industry: Refineries
│   │   │
│   │   ├─ PRICE CARD:
│   │   │   ├─ ₹2,456.75 (Large, bold)
│   │   │   ├─ +₹30.25 (+1.24%) [Green ↑]
│   │   │   └─ Last Updated: 15:29:45 IST
│   │   │
│   │   └─ BUTTONS:
│   │       ├─ [+ Add to Watchlist]
│   │       ├─ [Compare]
│   │       └─ [Share]
│   │
│   ├─ KEY STATISTICS GRID:
│   │   ┌──────────┬──────────┬──────────┬──────────┐
│   │   │ Open     │ High     │ Low      │ Prev Close│
│   │   │ 2430.50  │ 2468.90  │ 2425.00  │ 2426.50  │
│   │   ├──────────┼──────────┼──────────┼──────────┤
│   │   │ Volume   │ Mkt Cap  │ P/E      │ Div Yield│
│   │   │ 1.57 Cr  │ 17.85L Cr│ 28.45    │ 0.45%    │
│   │   └──────────┴──────────┴──────────┴──────────┘
│   │
│   ├─ INTERACTIVE CHART:
│   │   ├─ Type: [Line] [Candlestick] [Area]
│   │   ├─ Period: [1D] [5D] [1M] [6M] [1Y] [5Y] [All]
│   │   ├─ Default: Line, 1-year
│   │   ├─ Tooltip on hover
│   │   └─ Indicators (Premium): MA, RSI, MACD
│   │
│   ├─ PERFORMANCE TABLE:
│   │   └─ Returns: 1M, 3M, 6M, 1Y, 3Y, 5Y
│   │
│   ├─ FUNDAMENTALS (Expandable):
│   │   ├─ Revenue, Profit, ROE, ROCE
│   │   └─ [View Full Financials →]
│   │
│   ├─ LATEST NEWS (5 items):
│   │   ├─ [Positive] "Q3 profit rises 12%"
│   │   ├─ Economic Times • 2h ago
│   │   └─ [Read More →]
│   │
│   └─ SIMILAR STOCKS:
│       └─ ONGC, BPCL, IOC (horizontal cards)
│
├─ USER ACTION: Add to Watchlist
│   ├─ Click [+ Add to Watchlist]
│   ├─ Dropdown:
│   │   ├─ ○ My Tech Stocks
│   │   ├─ ● Nifty 50 Stocks ← Selected
│   │   └─ [+ Create New]
│   ├─ Optional: Add Note
│   ├─ Click [Add]
│   │
│   ├─ BACKEND:
│   │   ├─ Check if already in watchlist
│   │   ├─ Update MongoDB:
│   │   │   db.watchlists.updateOne(
│   │   │     { _id: 'abc123' },
│   │   │     { $push: { instruments: {...} } }
│   │   │   )
│   │   └─ Return success
│   │
│   ├─ FRONTEND:
│   │   ├─ Toast: "RELIANCE added ✓"
│   │   └─ Button: [✓ In Watchlist] (disabled, green)
│   │
│   └─ User can add to other watchlists too
│
├─ USER ACTION: Compare
│   ├─ Click [Compare]
│   ├─ Added to comparison queue (bottom bar)
│   ├─ Continue browsing, add more
│   └─ Click [Compare Now] → Comparison Page
│
├─ USER ACTION: Share
│   ├─ Click [Share]
│   ├─ Modal:
│   │   ├─ Link: finsieve.com/equities/RELIANCE
│   │   ├─ [Copy Link]
│   │   ├─ Social: WhatsApp, Email, Twitter
│   │   └─ QR Code
│   └─ Copy to clipboard
│
├─ USER ACTION: Change Chart Period
│   ├─ Click [5Y]
│   ├─ Check cache
│   ├─ API: GET /instruments/12345/chart?period=5Y
│   ├─ Backend:
│   │   ├─ Check Redis cache
│   │   ├─ If miss: Query PostgreSQL
│   │   ├─ Cache result (TTL: 1h)
│   │   └─ Return JSON
│   ├─ Render 5Y chart
│   └─ Smooth transition animation
│
├─ USER ACTION: Add Indicator (Premium)
│   ├─ Click [Indicators ▼]
│   ├─ Select "50 SMA"
│   ├─ Calculate client-side
│   ├─ Overlay on chart (orange line)
│   └─ Toggle on/off
│
└─ END

Performance Optimizations:
- Progressive loading
- Lazy load images
- Prefetch on hover
- Client-side caching
- WebSocket for real-time (Premium)
```

---

## APPENDIX A: ERROR MESSAGES

### User-Friendly Error Messages

**Authentication Errors:**
- "Account already exists. Please log in."
- "Invalid email or password. Please try again."
- "Too many login attempts. Please try again in 15 minutes."

**Data Errors:**
- "No stocks match your criteria. Try adjusting filters."
- "Data temporarily unavailable. Please try again."
- "Unable to load chart. Check your connection."

**Permission Errors:**
- "This feature is available to Premium users. [Upgrade Now]"
- "You've reached your daily export limit. Upgrade for unlimited exports."

**Network Errors:**
- "Connection lost. Showing last updated data from [timestamp]."
- "Unable to connect. Please check your internet connection."

---

## APPENDIX B: KEYBOARD SHORTCUTS (Web)

| Shortcut | Action |
|----------|--------|
| `/` | Focus search bar |
| `S` | Open screener |
| `C` | Open comparison |
| `W` | Go to watchlists |
| `Esc` | Close modal/dropdown |
| `Ctrl/Cmd + K` | Quick command palette |

---

## APPENDIX C: API RESPONSE CODES

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process data |
| 201 | Created | Resource created |
| 400 | Bad Request | Show error message |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show upgrade prompt |
| 404 | Not Found | Show "Not found" page |
| 429 | Rate Limited | Show "Too many requests" |
| 500 | Server Error | Show "Try again later" |

---

**End of Functional Requirements Document**

---

## DOCUMENT REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 08, 2026 | Product Team | Initial release |

---

**Approval Signatures**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Lead Developer | | | |
| UX Designer | | | |
| QA Lead | | | |

---
