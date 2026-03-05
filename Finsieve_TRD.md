# TECHNICAL REQUIREMENTS DOCUMENT (TRD)
# Finsieve - 360° Investment Intelligence Platform

**Document Version:** 1.0  
**Date:** February 08, 2026  
**Prepared By:** Technical Architecture Team  
**Project Name:** Finsieve

---

## TABLE OF CONTENTS

1. [Technical Overview](#1-technical-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [API Specifications](#4-api-specifications)
5. [Security Specifications](#5-security-specifications)
6. [Performance Requirements](#6-performance-requirements)
7. [Integration Specifications](#7-integration-specifications)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Monitoring & Observability](#9-monitoring--observability)
10. [Disaster Recovery & Backup](#10-disaster-recovery--backup)

---

## 1. TECHNICAL OVERVIEW

### 1.1 System Architecture

**Architecture Pattern:** Microservices-based, Cloud-Native Architecture

**Key Components:**
1. **Presentation Layer:** React (Web), React Native (Mobile)
2. **API Gateway Layer:** Kong/AWS API Gateway
3. **Service Layer:** Node.js microservices
4. **Data Layer:** PostgreSQL (relational), Redis (cache), MongoDB (user data)
5. **Integration Layer:** Data ingestion pipelines
6. **Infrastructure:** AWS/GCP with Kubernetes orchestration

### 1.2 Technology Stack

#### Frontend

**Web Application:**
- Framework: React 18+ with TypeScript
- State Management: Redux Toolkit / Zustand
- UI Library: Material-UI v5 / Ant Design
- Charting: TradingView Lightweight Charts / Highcharts
- Data Grid: AG-Grid
- Build Tool: Vite
- Testing: Jest, React Testing Library

**iOS Application:**
- Framework: React Native 0.73+ / Swift (native modules)
- Navigation: React Navigation
- State: Redux Toolkit
- Charts: React Native Chart Kit / Native iOS Charts
- Minimum Version: iOS 14+

**Android Application:**
- Framework: React Native 0.73+ / Kotlin (native modules)
- Navigation: React Navigation
- State: Redux Toolkit
- Charts: React Native Chart Kit / MPAndroidChart
- Minimum Version: Android 8.0 (API 26+)

#### Backend

- **Primary Language:** Node.js (TypeScript)
- **API Framework:** Express.js / Fastify
- **Authentication:** JWT, OAuth 2.0 (Passport.js)
- **Data Processing:** Python (Pandas, NumPy for calculations)
- **Real-time:** WebSocket (Socket.io)
- **API Documentation:** Swagger/OpenAPI 3.0
- **Testing:** Jest, Supertest, Postman

#### Databases

- **Primary Database:** PostgreSQL 15+ (Time-series extension: TimescaleDB)
- **Cache Layer:** Redis 7+ (Redis Cluster for HA)
- **Document Store:** MongoDB 6+ (User preferences, watchlists)
- **Search Engine:** Elasticsearch 8+ (Instrument search, news)
- **Message Queue:** Apache Kafka / AWS SQS (Data ingestion)

#### DevOps & Infrastructure

- **Cloud Provider:** AWS (Primary) / GCP (Backup)
- **Containerization:** Docker
- **Orchestration:** Kubernetes (EKS/GKE)
- **CI/CD:** GitHub Actions / GitLab CI
- **Monitoring:** Prometheus + Grafana, ELK Stack
- **APM:** New Relic / DataDog
- **CDN:** CloudFlare / AWS CloudFront
- **DNS:** Route 53

#### Security

- **WAF:** AWS WAF / Cloudflare WAF
- **Secrets Management:** AWS Secrets Manager / HashiCorp Vault
- **SSL/TLS:** Let's Encrypt / AWS Certificate Manager
- **DDoS Protection:** AWS Shield / Cloudflare
- **Security Scanning:** SonarQube, OWASP ZAP

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
├──────────────┬──────────────────┬───────────────────────────┤
│   Web App    │   iOS App        │   Android App             │
│   (React)    │   (React Native) │   (React Native)          │
└──────┬───────┴────────┬─────────┴──────────┬────────────────┘
       │                │                    │
       └────────────────┼────────────────────┘
                        │
              ┌─────────▼──────────┐
              │   CDN (CloudFlare) │
              └─────────┬──────────┘
                        │
              ┌─────────▼──────────┐
              │   API Gateway      │
              │   (Kong/AWS)       │
              │   - Rate Limiting  │
              │   - Authentication │
              │   - Load Balancing │
              └─────────┬──────────┘
                        │
       ┌────────────────┼────────────────┐
       │                │                │
┌──────▼─────┐  ┌──────▼─────┐  ┌──────▼──────┐
│  User      │  │  Market    │  │  Analytics  │
│  Service   │  │  Data      │  │  Service    │
│            │  │  Service   │  │             │
└──────┬─────┘  └──────┬─────┘  └──────┬──────┘
       │                │                │
       │        ┌───────▼────────┐       │
       │        │  Screening     │       │
       │        │  Service       │       │
       │        └───────┬────────┘       │
       │                │                │
┌──────▼────────────────▼────────────────▼──────┐
│              SERVICE BUS (Kafka)              │
└───────────────────────┬───────────────────────┘
                        │
       ┌────────────────┼────────────────┐
       │                │                │
┌──────▼─────┐  ┌──────▼─────┐  ┌──────▼──────┐
│ PostgreSQL │  │   Redis    │  │  MongoDB    │
│ (TimescaleDB)│ │  (Cache)   │  │  (User Data)│
└────────────┘  └────────────┘  └─────────────┘
       │                
┌──────▼─────────────┐
│  Elasticsearch     │
│  (Search & News)   │
└────────────────────┘

┌─────────────────────────────────────────────────┐
│         EXTERNAL INTEGRATIONS                    │
├──────────────┬──────────────┬──────────────────┤
│  NSE/BSE API │  MCX API     │  Crypto APIs     │
│  US Market   │  News APIs   │  Morningstar     │
│  Data Feeds  │              │  (MF Data)       │
└──────────────┴──────────────┴──────────────────┘
```

---

## 3. DATABASE DESIGN

### 3.1 PostgreSQL Schema

#### Table: instruments
```sql
CREATE TABLE instruments (
    instrument_id SERIAL PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    isin VARCHAR(12) UNIQUE,
    asset_class VARCHAR(50) NOT NULL, -- EQUITY, MUTUAL_FUND, COMMODITY, etc.
    exchange VARCHAR(50), -- NSE, BSE, MCX, NYSE, NASDAQ, etc.
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap BIGINT,
    currency VARCHAR(3) DEFAULT 'INR',
    is_active BOOLEAN DEFAULT TRUE,
    listing_date DATE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_instruments_symbol ON instruments(symbol);
CREATE INDEX idx_instruments_asset_class ON instruments(asset_class);
CREATE INDEX idx_instruments_exchange ON instruments(exchange);
```

#### Table: market_data (TimescaleDB Hypertable)
```sql
CREATE TABLE market_data (
    time TIMESTAMPTZ NOT NULL,
    instrument_id INTEGER REFERENCES instruments(instrument_id),
    open DECIMAL(20, 4),
    high DECIMAL(20, 4),
    low DECIMAL(20, 4),
    close DECIMAL(20, 4),
    volume BIGINT,
    turnover DECIMAL(20, 2),
    PRIMARY KEY (time, instrument_id)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('market_data', 'time');

-- Create continuous aggregate for daily data
CREATE MATERIALIZED VIEW market_data_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS day,
    instrument_id,
    first(open, time) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, time) AS close,
    sum(volume) AS volume
FROM market_data
GROUP BY day, instrument_id;
```

#### Table: mutual_fund_details
```sql
CREATE TABLE mutual_fund_details (
    fund_id SERIAL PRIMARY KEY,
    instrument_id INTEGER REFERENCES instruments(instrument_id),
    amc_name VARCHAR(255),
    fund_category VARCHAR(100), -- Equity, Debt, Hybrid, etc.
    fund_sub_category VARCHAR(100),
    risk_level VARCHAR(20), -- Low, Moderate, High, Very High
    aum DECIMAL(20, 2),
    expense_ratio DECIMAL(5, 2),
    exit_load VARCHAR(100),
    min_investment DECIMAL(15, 2),
    min_sip_amount DECIMAL(10, 2),
    launch_date DATE,
    benchmark_index VARCHAR(100),
    fund_manager VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Table: mutual_fund_returns
```sql
CREATE TABLE mutual_fund_returns (
    fund_id INTEGER REFERENCES mutual_fund_details(fund_id),
    return_1d DECIMAL(8, 2),
    return_1w DECIMAL(8, 2),
    return_1m DECIMAL(8, 2),
    return_3m DECIMAL(8, 2),
    return_6m DECIMAL(8, 2),
    return_1y DECIMAL(8, 2),
    return_3y DECIMAL(8, 2),
    return_5y DECIMAL(8, 2),
    return_10y DECIMAL(8, 2),
    return_all DECIMAL(8, 2),
    cagr_3y DECIMAL(8, 2),
    cagr_5y DECIMAL(8, 2),
    volatility_3y DECIMAL(8, 2),
    sharpe_ratio_3y DECIMAL(8, 4),
    alpha DECIMAL(8, 4),
    beta DECIMAL(8, 4),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (fund_id)
);
```

### 3.2 MongoDB Collections

#### Collection: users
```javascript
{
    _id: ObjectId,
    email: String,
    phone: String,
    password_hash: String, // bcrypt hashed
    first_name: String,
    last_name: String,
    user_tier: String, // FREE, PREMIUM, ENTERPRISE
    subscription_expires: Date,
    preferences: {
        theme: String, // light, dark
        language: String, // en, hi
        default_currency: String,
        default_chart_type: String,
        notifications_enabled: Boolean
    },
    oauth_providers: [{
        provider: String, // google, apple
        provider_id: String
    }],
    is_active: Boolean,
    email_verified: Boolean,
    phone_verified: Boolean,
    created_at: Date,
    updated_at: Date,
    last_login: Date
}
```

#### Collection: watchlists
```javascript
{
    _id: ObjectId,
    user_id: ObjectId,
    name: String,
    description: String,
    instruments: [{
        instrument_id: Number, // References PostgreSQL
        asset_class: String,
        added_at: Date,
        notes: String
    }],
    is_default: Boolean,
    created_at: Date,
    updated_at: Date
}
```

### 3.3 Redis Cache Structure

```
# Market data cache (5-minute expiry for real-time, 15-min for delayed)
market:data:{instrument_id} -> JSON
market:quote:{instrument_id} -> JSON

# Screening results cache (10-minute expiry)
screening:{asset_class}:{filter_hash} -> JSON array

# User session cache
session:{session_id} -> JSON

# Rate limiting
ratelimit:{user_id}:{endpoint} -> counter (with TTL)

# Popular instruments (daily refresh)
popular:instruments:{asset_class} -> Sorted Set
```

---

## 4. API SPECIFICATIONS

### 4.1 Base Configuration

**Base URL:** `https://api.finsieve.com/v1`

**Authentication:** Bearer Token (JWT)

**Common Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
X-API-Version: 1.0
```

### 4.2 Authentication APIs

#### POST /auth/register
```json
Request:
{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+919876543210"
}

Response: 201 Created
{
    "user_id": "64f8a9b2c1234567890abcde",
    "email": "user@example.com",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600
}
```

#### POST /auth/login
```json
Request:
{
    "email": "user@example.com",
    "password": "SecurePass123!"
}

Response: 200 OK
{
    "user_id": "64f8a9b2c1234567890abcde",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600,
    "user_tier": "FREE"
}
```

### 4.3 Instruments APIs

#### GET /instruments/search?query={search_term}&asset_class={class}&limit=10
```json
Response: 200 OK
{
    "results": [
        {
            "instrument_id": 12345,
            "symbol": "RELIANCE",
            "name": "Reliance Industries Limited",
            "isin": "INE002A01018",
            "asset_class": "EQUITY",
            "exchange": "NSE",
            "current_price": 2456.75,
            "change_percent": 1.24
        }
    ],
    "total_count": 1,
    "query_time_ms": 45
}
```

#### GET /instruments/{instrument_id}/chart?period={1D|5D|1M|6M|1Y|5Y|ALL}&interval={1m|5m|15m|1h|1d}
```json
Response: 200 OK
{
    "instrument_id": 12345,
    "symbol": "RELIANCE",
    "period": "1M",
    "interval": "1d",
    "data": [
        {
            "timestamp": "2026-01-08T09:15:00Z",
            "open": 2430.50,
            "high": 2445.75,
            "low": 2425.00,
            "close": 2440.25,
            "volume": 18900567
        }
    ],
    "total_points": 22
}
```

### 4.4 Screening APIs

#### POST /screening/equity
```json
Request:
{
    "filters": {
        "market_cap": { "min": 10000000000, "max": null },
        "pe_ratio": { "min": 0, "max": 30 },
        "returns_1y": { "min": 15, "max": null },
        "sector": ["Technology", "Financial Services"],
        "dividend_yield": { "min": 1, "max": null }
    },
    "sorting": [
        { "field": "returns_1y", "order": "desc" },
        { "field": "market_cap", "order": "desc" }
    ],
    "page": 1,
    "limit": 50
}

Response: 200 OK
{
    "results": [
        {
            "instrument_id": 12345,
            "symbol": "TCS",
            "name": "Tata Consultancy Services",
            "current_price": 3856.40,
            "market_cap": 1402580000000,
            "pe_ratio": 29.45,
            "returns_1y": 24.56,
            "dividend_yield": 1.35,
            "sector": "Technology"
        }
    ],
    "pagination": {
        "total_count": 128,
        "page": 1,
        "limit": 50,
        "total_pages": 3
    }
}
```

### 4.5 WebSocket API (Real-time Data)

**WebSocket URL:** `wss://ws.finsieve.com/v1`

```javascript
// Connection
const ws = new WebSocket('wss://ws.finsieve.com/v1');

// Authentication
ws.send(JSON.stringify({
    type: 'AUTH',
    token: 'eyJhbGciOiJIUzI1NiIs...'
}));

// Subscribe to Instrument Updates
ws.send(JSON.stringify({
    type: 'SUBSCRIBE',
    channel: 'market_data',
    instruments: [12345, 67890, 11223]
}));

// Receiving updates
{
    "type": "MARKET_UPDATE",
    "instrument_id": 12345,
    "symbol": "RELIANCE",
    "price": 2456.75,
    "change": 30.25,
    "change_percent": 1.24,
    "volume": 15678900,
    "timestamp": "2026-02-08T15:30:15Z"
}
```

---

## 5. SECURITY SPECIFICATIONS

### 5.1 Authentication & Authorization

**JWT Token Structure:**
```javascript
{
    "header": {
        "alg": "HS256",
        "typ": "JWT"
    },
    "payload": {
        "user_id": "64f8a9b2c1234567890abcde",
        "email": "user@example.com",
        "tier": "PREMIUM",
        "iat": 1707398400,
        "exp": 1707402000
    }
}
```

**Access Control:**
- **Free Tier:** 100 API calls/day, 15-min delayed data, max 3 watchlists
- **Premium Tier:** 10,000 API calls/day, real-time data, unlimited watchlists
- **Enterprise Tier:** Unlimited API calls, dedicated support, API access

### 5.2 Data Encryption

- **In Transit:** TLS 1.3 for all API communications
- **At Rest:** AES-256 encryption for sensitive user data
- **Password Storage:** bcrypt with salt rounds = 12
- **API Keys:** Encrypted with envelope encryption

### 5.3 Rate Limiting

**API Rate Limits:**
- Free Tier: 100 requests/day, 10 requests/minute
- Premium Tier: 10,000 requests/day, 100 requests/minute
- Enterprise Tier: Custom limits

**Implementation:** Token bucket algorithm with Redis

### 5.4 Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 6. PERFORMANCE REQUIREMENTS

### 6.1 Response Time SLAs

| Endpoint Category | Target Response Time (p95) | Max Response Time (p99) |
|-------------------|---------------------------|------------------------|
| Authentication | 200ms | 500ms |
| Search | 300ms | 800ms |
| Instrument Details | 200ms | 500ms |
| Screening | 500ms | 1500ms |
| Chart Data | 400ms | 1000ms |
| Comparison | 600ms | 1500ms |
| Watchlist Operations | 300ms | 700ms |

### 6.2 Throughput Requirements

- **Concurrent Users:** 10,000 (Phase 1), scalable to 100,000
- **API Requests:** 1,000 req/sec (Phase 1), 10,000 req/sec (Phase 2)
- **WebSocket Connections:** 5,000 concurrent (Phase 1)
- **Database Queries:** < 100ms for 95% of queries

### 6.3 Caching Strategy

**Multi-Layer Caching:**

1. **CDN Level (CloudFlare):**
   - Static assets: 30-day cache
   - API responses (public data): 5-minute cache

2. **Application Level (Redis):**
   - Market quotes: 5-second cache (real-time), 15-min cache (delayed)
   - Screening results: 10-minute cache
   - Instrument details: 1-hour cache
   - News: 15-minute cache

3. **Database Level:**
   - PostgreSQL query cache
   - Materialized views for aggregated data (refreshed hourly)

---

## 7. INTEGRATION SPECIFICATIONS

### 7.1 External Data Providers

#### NSE/BSE Integration
```javascript
const fetchNSEData = async (symbols) => {
    const response = await axios.get('https://api.nseindia.com/api/equity-stockIndices', {
        params: { index: 'NIFTY 50' },
        headers: {
            'User-Agent': 'Mozilla/5.0...',
            'Accept': 'application/json'
        }
    });
    
    return processNSEData(response.data);
};
```

#### Cryptocurrency APIs
```javascript
const fetchCryptoData = async (coinIds) => {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
            vs_currency: 'inr',
            ids: coinIds.join(',')
        }
    });
    
    return response.data;
};
```

### 7.2 Data Ingestion Pipeline

**Architecture:**
```
Data Sources → Kafka → Stream Processors → Database → Cache → API
```

**Kafka Topics:**
- `market-data-raw` (Raw market feed)
- `market-data-processed` (Processed and validated)
- `news-feed` (News articles)
- `alerts` (Price alerts, notifications)

---

## 8. DEPLOYMENT ARCHITECTURE

### 8.1 Infrastructure Setup

**AWS Services Used:**
- **Compute:** EKS (Kubernetes) for container orchestration
- **Database:** RDS (PostgreSQL), ElastiCache (Redis), DocumentDB (MongoDB)
- **Storage:** S3 for static assets, backups
- **CDN:** CloudFront
- **Load Balancer:** Application Load Balancer (ALB)
- **Monitoring:** CloudWatch, X-Ray
- **Secrets:** Secrets Manager
- **CI/CD:** CodePipeline, CodeBuild

**Kubernetes Cluster:**
- **Node Groups:**
  - API nodes (t3.xlarge): 3-10 nodes (auto-scaling)
  - Worker nodes (t3.large): 2-8 nodes (data processing)
  - Monitoring nodes (t3.medium): 2 nodes

**Database Configuration:**
- **PostgreSQL RDS:** db.r5.2xlarge (Multi-AZ)
- **Redis Cluster:** cache.r5.xlarge (3 shards, 2 replicas each)
- **MongoDB:** M30 cluster (3-node replica set)

### 8.2 CI/CD Pipeline

**Pipeline Stages:**
1. **Code Commit** → GitHub
2. **Build** → Docker image creation
3. **Test** → Unit tests, integration tests
4. **Security Scan** → SonarQube, OWASP dependency check
5. **Deploy to Staging** → EKS staging cluster
6. **Automated Testing** → E2E tests, load tests
7. **Manual Approval** → Product owner sign-off
8. **Deploy to Production** → Blue-green deployment
9. **Post-Deployment** → Smoke tests, monitoring

**Deployment Strategy:** Blue-Green with Canary releases
- Deploy to 10% traffic → Monitor → Gradually increase to 100%

---

## 9. MONITORING & OBSERVABILITY

### 9.1 Metrics Collection

**Application Metrics:**
- Request rate, error rate, latency (RED metrics)
- CPU, memory, disk usage
- Database connection pool stats
- Cache hit/miss ratio
- API endpoint-specific metrics

**Business Metrics:**
- User registrations, logins
- Subscription conversions
- Feature usage (screening, comparison, watchlist)
- Search queries
- Export operations

### 9.2 Logging

**Log Levels:**
- ERROR: Application errors, exceptions
- WARN: Potential issues, degraded performance
- INFO: Important business events (user login, subscription)
- DEBUG: Detailed diagnostic information

**Log Format (JSON):**
```json
{
    "timestamp": "2026-02-08T15:30:00Z",
    "level": "INFO",
    "service": "market-data-service",
    "trace_id": "abc123def456",
    "user_id": "64f8a9b2c1234567890abcde",
    "message": "Screening request processed",
    "metadata": {
        "asset_class": "EQUITY",
        "filters_count": 5,
        "results_count": 128,
        "response_time_ms": 450
    }
}
```

### 9.3 Alerting

**Alert Conditions:**
- API error rate > 1% for 5 minutes
- Response time p95 > 2 seconds for 10 minutes
- Database connection pool > 80% for 5 minutes
- Disk usage > 85%
- Pod crash loop detected
- Data feed failure for > 5 minutes

**Alert Channels:**
- PagerDuty (critical alerts)
- Slack (warning alerts)
- Email (info alerts)

---

## 10. DISASTER RECOVERY & BACKUP

### 10.1 Backup Strategy

- **Database:** Daily full backups + continuous transaction log backups
- **Retention:** 30 days for daily backups, 7 days for transaction logs
- **Testing:** Monthly disaster recovery drills

### 10.2 Recovery Objectives

**RTO (Recovery Time Objective):** 4 hours  
**RPO (Recovery Point Objective):** 1 hour

### 10.3 Failover Strategy

- Multi-AZ deployment for databases
- Cross-region read replicas
- Automated failover for database clusters

---

**End of Technical Requirements Document**
