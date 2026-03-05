# BUSINESS REQUIREMENTS DOCUMENT (BRD)
# Finsieve - 360° Investment Intelligence Platform

**Document Version:** 1.0  
**Date:** February 08, 2026  
**Prepared By:** Business Analysis Team  
**Project Sponsor:** Finsieve Management Team

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Scope Definition](#2-scope-definition)
3. [Stakeholder Analysis](#3-stakeholder-analysis)
4. [Business Requirements](#4-business-requirements)
5. [User Personas](#5-user-personas)
6. [Success Metrics & KPIs](#6-success-metrics--kpis)
7. [Risk Analysis](#7-risk-analysis)
8. [Implementation Approach](#8-implementation-approach)
9. [Budget Estimate](#9-budget-estimate)
10. [Approval & Sign-Off](#10-approval--sign-off)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Project Overview

**Project Name:** Finsieve - 360° Investment Intelligence Platform

Finsieve aims to become India's premier investment research and comparison platform by providing retail and institutional investors with a unified, comprehensive view of global and domestic investment opportunities across multiple asset classes.

### 1.2 Business Objectives

**Primary Goals:**
- Create a one-stop investment research platform covering 8+ asset classes
- Enable sophisticated comparison and screening capabilities across all investment instruments
- Provide institutional-grade analytics to retail investors
- Build a sustainable, scalable platform across web and mobile channels

### 1.3 Business Case

**Market Opportunity:**
- India's retail investor base growing at 25% CAGR
- Fragmented investment research landscape with no unified platform
- Increasing demand for multi-asset portfolio strategies
- Gap in comprehensive screening tools for Indian investors

**Expected Business Benefits:**
- User base target: 500K users in Year 1, 2M users by Year 3
- Revenue streams: Freemium subscriptions, API access, institutional licenses
- Market positioning: Alternative to Screener.in, Morningstar, TradingView combined
- Competitive advantage: Only platform offering 360° view of Indian + Global markets

---

## 2. SCOPE DEFINITION

### 2.1 In-Scope

**Asset Classes Covered:**

1. **Global Indices** (50+ major indices)
2. **Indian Equities** (NSE/BSE listed stocks)
3. **US Equities** (NYSE/NASDAQ listed stocks)
4. **Indian Mutual Funds** (All AMFI registered schemes)
5. **Indian Commodities** (MCX/NCDEX)
6. **Indian Bonds** (Corporate + Government)
7. **Indian Treasury Securities** (G-Secs, T-Bills)
8. **Cryptocurrencies** (Top 100 by market cap)

**Core Features:**

- Real-time and delayed market data visualization
- Advanced screening with 50+ parameters per asset class
- Side-by-side comparison (up to 5 instruments)
- Historical performance charts (1D to All-time)
- Custom sorting and filtering
- Watchlist creation and management
- Portfolio tracking (view-only in Phase 1)
- Market news and updates aggregation
- Export capabilities (PDF, Excel, CSV)

**Platform Coverage:**

- Responsive Web Application
- Native iOS Application (iOS 14+)
- Native Android Application (Android 8+)
- API for third-party integration (Phase 2)

### 2.2 Out-of-Scope (Phase 1)

- Direct trading/transaction capabilities
- Advisory services or investment recommendations
- Real-time alerts and notifications (planned for Phase 2)
- Social features (community, discussions)
- Backtesting capabilities
- International mutual funds (ex-India, ex-US)
- Derivatives (Futures & Options)
- Alternative investments (REITs, InvITs, AIFs)

### 2.3 Assumptions

- Data feeds will be procured from licensed vendors (NSE, BSE, MCX, Bloomberg, Morningstar)
- Users will not require KYC for basic access
- Compliance with SEBI regulations for investment information platforms
- Cloud infrastructure (AWS/Azure/GCP) will be utilized
- Third-party APIs available for crypto data
- User authentication will be email/phone-based

### 2.4 Constraints

- **Regulatory:** Must comply with SEBI guidelines on investment information dissemination
- **Technical:** Real-time data limited by exchange licensing costs
- **Budget:** Initial development budget allocated for 12-month MVP
- **Data:** 15-minute delayed data for free tier; real-time for premium
- **Legal:** Cannot provide buy/sell recommendations without SEBI RIA license

---

## 3. STAKEHOLDER ANALYSIS

| Stakeholder Group | Interest | Influence | Engagement Strategy |
|-------------------|----------|-----------|---------------------|
| Retail Investors | Primary users seeking investment research | High | Beta testing, feedback loops |
| Wealth Managers | Using platform for client research | Medium | B2B partnerships, API access |
| Financial Advisors | Research tool for client recommendations | Medium | Professional tier, training |
| Data Vendors | Revenue from data licensing | High | Contract negotiations, SLAs |
| Regulatory Bodies | Compliance with financial regulations | High | Regular compliance audits |
| Investors/Board | ROI, growth metrics | High | Monthly business reviews |
| Development Team | Delivery of technical solution | Medium | Agile sprints, daily standups |

---

## 4. BUSINESS REQUIREMENTS

### 4.1 Functional Requirements

**FR-001: Multi-Asset Class Data Display**
- **Priority:** High
- **Description:** System shall display market data for all 8 defined asset classes
- **Business Value:** Core differentiator from single-asset platforms
- **Acceptance Criteria:** User can navigate and view data for any of the 8 asset classes within 2 clicks

**FR-002: Advanced Screening Engine**
- **Priority:** High
- **Description:** Enable filtering based on 50+ parameters per asset class
- **Business Value:** Attract serious investors who need sophisticated research tools
- **Acceptance Criteria:** 
  - Minimum 50 screening parameters for equities
  - Minimum 30 parameters for mutual funds
  - Results returned within 3 seconds for any filter combination

**FR-003: Comparative Analysis**
- **Priority:** High
- **Description:** Allow side-by-side comparison of up to 5 instruments
- **Business Value:** Enable informed decision-making
- **Acceptance Criteria:** 
  - Support comparison within same asset class
  - Display 20+ comparison metrics
  - Visual representation (charts/graphs) included

**FR-004: Custom Sorting**
- **Priority:** High
- **Description:** Multi-dimensional sorting across time periods and metrics
- **Business Value:** Quick access to top/bottom performers
- **Acceptance Criteria:**
  - Sort by returns: 1Y, 3Y, 5Y, 10Y, All-time
  - Sort by risk metrics: Volatility, Sharpe Ratio, Beta
  - Ascending/Descending toggle
  - Multi-level sorting (primary + secondary sort)

**FR-005: Interactive Charts**
- **Priority:** High
- **Description:** Historical performance visualization with technical indicators
- **Business Value:** Visual analysis capability
- **Acceptance Criteria:**
  - Time periods: 1D, 5D, 1M, 6M, 1Y, 5Y, All
  - Chart types: Line, Candlestick, Area
  - Technical indicators: MA, EMA, RSI, MACD, Bollinger Bands
  - Zoom and pan functionality

**FR-006: Watchlist Management**
- **Priority:** Medium
- **Description:** Create and manage multiple watchlists
- **Business Value:** User retention and personalization
- **Acceptance Criteria:**
  - Create up to 10 watchlists (free tier)
  - Unlimited watchlists (premium tier)
  - Add/remove instruments
  - Watchlist-level performance tracking

**FR-007: User Authentication & Profiles**
- **Priority:** High
- **Description:** Secure user registration and profile management
- **Business Value:** User data security and personalization
- **Acceptance Criteria:**
  - Email/Phone registration
  - OAuth integration (Google, Apple)
  - Profile customization
  - Subscription tier management

**FR-008: Data Export**
- **Priority:** Medium
- **Description:** Export screening results and reports
- **Business Value:** Professional utility for advisors
- **Acceptance Criteria:**
  - Export formats: PDF, Excel, CSV
  - Include charts in PDF exports
  - Limit: 100 records per export (free), unlimited (premium)

**FR-009: Search Functionality**
- **Priority:** High
- **Description:** Global search across all instruments
- **Business Value:** Quick access to any security
- **Acceptance Criteria:**
  - Auto-complete suggestions
  - Search by name, symbol, ISIN
  - Return results within 1 second
  - Display recent searches

**FR-010: Market News Integration**
- **Priority:** Medium
- **Description:** Aggregate relevant news for each instrument
- **Business Value:** Contextual information for investors
- **Acceptance Criteria:**
  - Display top 5 news items per instrument
  - Update frequency: Real-time
  - Source attribution
  - Filter by news category

### 4.2 Non-Functional Requirements

**NFR-001: Performance**
- Page load time: < 2 seconds for 90th percentile
- API response time: < 500ms for data queries
- Chart rendering: < 1 second for any time period
- Support 10,000 concurrent users initially
- Scale to 100,000 concurrent users by Year 2

**NFR-002: Availability**
- System uptime: 99.5% (excluding planned maintenance)
- Planned maintenance: Off-market hours (10 PM - 6 AM IST)
- Disaster recovery: RPO 1 hour, RTO 4 hours

**NFR-003: Security**
- Data encryption: TLS 1.3 for data in transit
- Database encryption at rest
- Password policy: Minimum 8 characters, alphanumeric + special chars
- Session timeout: 30 minutes of inactivity
- Two-factor authentication (optional in Phase 1, mandatory for premium)
- OWASP Top 10 compliance

**NFR-004: Scalability**
- Horizontal scaling capability
- Database partitioning by asset class
- CDN for static content delivery
- Microservices architecture for independent scaling

**NFR-005: Usability**
- Intuitive UI requiring < 30 minutes learning curve
- Mobile-responsive design (supports screens from 320px width)
- Accessibility: WCAG 2.1 Level AA compliance
- Multi-language support (English, Hindi in Phase 1)

**NFR-006: Data Accuracy**
- 99.95% data accuracy for market prices
- Data latency: 15-minute delay (free tier), real-time (premium)
- Data validation checks before display
- Automated reconciliation with source systems daily

**NFR-007: Compliance**
- SEBI guidelines for investment platforms
- Data privacy: Compliance with DPDPA 2023 (India)
- GDPR compliance for international users
- Regular security audits (quarterly)
- Data retention policy: User data for 7 years post-account closure

---

## 5. USER PERSONAS

### Persona 1: Retail Investor Raj
- **Age:** 28-35
- **Income:** ₹8-15 LPA
- **Experience:** 2-3 years in markets
- **Goals:** Build long-term wealth, compare mutual funds before investing
- **Pain Points:** Information scattered across multiple platforms
- **Platform Usage:** Primarily mobile (70%), web (30%)
- **Key Features:** Mutual fund comparison, simple screening, watchlists

### Persona 2: Professional Wealth Manager Priya
- **Age:** 35-45
- **AUM:** ₹50-200 Cr
- **Experience:** 10+ years
- **Goals:** Research for client portfolios, generate investment reports
- **Pain Points:** Need comprehensive data, no single source of truth
- **Platform Usage:** Primarily web (80%), mobile (20%)
- **Key Features:** Advanced screening, export capabilities, multi-asset comparison

### Persona 3: Active Trader Arjun
- **Age:** 25-40
- **Portfolio:** ₹10-50 lakhs
- **Experience:** 5+ years
- **Goals:** Identify trading opportunities, technical analysis
- **Pain Points:** Slow platforms, limited charting tools
- **Platform Usage:** Web (60%), mobile (40%)
- **Key Features:** Advanced charts, real-time data, quick screening

### Persona 4: NRI Investor Neha
- **Age:** 30-45
- **Income:** $80-150K USD
- **Experience:** 3-5 years
- **Goals:** Invest in India from abroad, track Indian + US markets
- **Pain Points:** Need both markets in one place, currency conversion
- **Platform Usage:** Primarily web (90%)
- **Key Features:** Multi-country coverage, currency-adjusted returns

---

## 6. SUCCESS METRICS & KPIs

### 6.1 User Acquisition Metrics
- Monthly Active Users (MAU): Target 50K by Month 6, 200K by Month 12
- Daily Active Users (DAU): Target 15K by Month 6, 60K by Month 12
- DAU/MAU Ratio: > 30%
- New User Registration: 5,000/month by Month 3
- User Acquisition Cost (CAC): < ₹500

### 6.2 Engagement Metrics
- Average Session Duration: > 8 minutes
- Sessions per User per Week: > 3
- Screens Comparison Created: 10,000/month by Month 6
- Watchlists Created: 20,000 by Month 12
- Charts Viewed: 100,000/month by Month 6

### 6.3 Conversion Metrics
- Free to Premium Conversion: 3-5% by Month 12
- Churn Rate: < 5% monthly
- Average Revenue Per User (ARPU): ₹300/month

### 6.4 Technical Metrics
- Platform Uptime: > 99.5%
- Average Page Load Time: < 2 seconds
- API Success Rate: > 99%
- Mobile App Crash Rate: < 0.5%

### 6.5 Business Metrics
- Monthly Recurring Revenue (MRR): ₹30 lakhs by Month 12
- Customer Lifetime Value (LTV): ₹5,000
- LTV:CAC Ratio: > 3:1
- Net Promoter Score (NPS): > 40

---

## 7. RISK ANALYSIS

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Data vendor licensing costs exceed budget | Medium | High | Negotiate multi-year contracts, explore alternative vendors, phased rollout |
| Regulatory changes restrict information sharing | Low | High | Maintain legal counsel, build flexible architecture, compliance monitoring |
| User adoption slower than projected | Medium | High | Aggressive marketing, freemium model, referral programs, content marketing |
| Technical scalability issues | Medium | Medium | Cloud-native architecture, load testing, auto-scaling, CDN implementation |
| Competition from established players | High | Medium | Focus on unique value proposition, faster feature delivery, superior UX |
| Data accuracy issues damage reputation | Low | High | Multiple data source validation, automated monitoring, quick issue resolution |
| Mobile app store rejections | Low | Medium | Follow guidelines strictly, prepare documentation, maintain good relationship |
| Cybersecurity breach | Low | Critical | Penetration testing, security audits, insurance, incident response plan |

---

## 8. IMPLEMENTATION APPROACH

### Phase 1 (Months 1-4): MVP Development
- Core infrastructure setup
- User authentication system
- Indian Equities module (screening, comparison, charts)
- Mutual Funds module
- Web application launch
- Beta user testing (1,000 users)

### Phase 2 (Months 5-8): Feature Expansion
- Mobile apps (iOS + Android) launch
- Add US Equities, Global Indices
- Advanced charting with technical indicators
- Watchlist functionality
- Premium subscription launch

### Phase 3 (Months 9-12): Comprehensive Coverage
- Add Commodities, Bonds, Treasury, Crypto
- Export functionality
- News integration
- Performance optimization
- Marketing push for user acquisition

### Phase 4 (Year 2): Advanced Features
- Real-time alerts
- Portfolio analytics
- API for third-party access
- Mobile app widgets
- Institutional tier

---

## 9. BUDGET ESTIMATE

### Development Costs (Year 1)
- Development Team (6 FTE): ₹1.2 Cr
- UI/UX Design: ₹15 lakhs
- Cloud Infrastructure: ₹20 lakhs
- **Total Development: ₹1.35 Cr**

### Data & Licensing
- Market Data Feeds: ₹40 lakhs/year
- News API: ₹10 lakhs/year
- **Total Data: ₹50 lakhs**

### Operations
- Marketing & User Acquisition: ₹60 lakhs
- Legal & Compliance: ₹15 lakhs
- Miscellaneous: ₹10 lakhs
- **Total Operations: ₹85 lakhs**

### **Grand Total Year 1: ₹2.7 Crores**

---

## 10. APPROVAL & SIGN-OFF

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Business Sponsor | | | |
| Product Owner | | | |
| Technical Lead | | | |
| Compliance Officer | | | |

---

**End of Business Requirements Document**
