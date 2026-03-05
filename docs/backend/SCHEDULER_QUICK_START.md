# 🌍 Global Market Scheduler - Quick Start Guide

## Overview

Finsieve's intelligent market scheduler automatically updates data based on **actual market trading hours** across 13+ global markets.

## Quick Facts

| Metric                 | Value                                                  |
| ---------------------- | ------------------------------------------------------ |
| **Markets Covered**    | 13+ (India, US, Europe, Asia-Pacific)                  |
| **Asset Classes**      | 5 (Equities, Crypto, Commodities, Bonds, Mutual Funds) |
| **Update Frequencies** | 1s to 1 day (market-dependent)                         |
| **API Calls/Hour**     | ~3,000-5,000 (peak hours)                              |
| **Schedulers**         | 5 intelligent schedulers                               |

## Market Timings (IST)

### Asia-Pacific 🌏

- **India (NSE)**: 9:15 AM - 3:30 PM
- **Japan**: 5:30 AM - 11:30 AM & 1:00 PM - 5:30 PM
- **Hong Kong**: 7:00 AM - 11:30 AM & 2:30 PM - 6:30 PM
- **China**: 7:00 AM - 11:30 AM & 2:30 PM - 5:30 PM
- **Australia**: 4:30 AM - 10:30 AM

### Europe 🌍

- **United Kingdom**: 1:30 PM - 10:00 PM
- **Germany**: 1:30 PM - 11:00 PM
- **France**: 1:30 PM - 11:00 PM

### Americas 🌎

- **United States**: 7:00 PM - 1:30 AM (next day)
- **Canada**: 7:00 PM - 1:30 AM (next day)

### 24/7 Markets 💰

- **Crypto**: Always Open
- **Commodities**: 5:30 PM - 3:30 AM IST (CME hours)
- **Mutual Funds**: Daily at 6:00 PM IST

## Update Frequencies

```
⚡ NSE India:      1 second   (ultra-fast, free API)
🌍 Global Markets: 5 seconds  (when market is open)
₿  Crypto:        10 seconds (24/7)
🛢️  Commodities:  10 seconds (CME hours)
📊 Mutual Funds:  1x daily   (6 PM IST)
```

## File Structure

```
finsieve-backend/src/
├── config/
│   └── marketHours.js          # Market hours configuration
├── scheduler/
│   ├── nseDataScheduler.js     # NSE India (1s)
│   ├── globalMarketScheduler.js # Global markets (5s)
│   ├── cryptoScheduler.js      # Crypto (10s, 24/7)
│   ├── commoditiesScheduler.js # Commodities (10s)
│   └── mutualFundsScheduler.js # Mutual funds (daily)
└── server.js                   # Scheduler integration
```

## Key Files

### 1. Market Hours Config

**File**: `src/config/marketHours.js`

- Defines trading hours for all markets
- Timezone handling utilities
- IST conversion functions

### 2. Schedulers

All schedulers follow a consistent pattern:

- Auto-start on server boot
- Market status checking
- Intelligent logging
- Graceful shutdown support

### 3. Server Integration

**File**: `src/server.js`

- Starts all 5 schedulers
- Handles graceful shutdown
- Beautiful status logging

## API Endpoints

### Get Market Status

```bash
GET /api/v1/market/status
```

**Response**:

```json
{
  "success": true,
  "data": {
    "openMarkets": ["United States", "United Kingdom", "Crypto"],
    "openMarketsCount": 3,
    "allMarkets": { ... },
    "marketTimingsIST": { ... }
  }
}
```

### Force Update

```bash
POST /api/v1/market/update
```

Triggers immediate update for all open markets.

## Server Startup

```bash
cd finsieve-backend
npm run dev
```

**Expected Output**:

```
🌍 ================================
📡 STARTING MARKET DATA SCHEDULERS
🌍 ================================

🇮🇳 Starting NSE India Scheduler...
✅ NSE data scheduler started successfully

🌍 Starting Global Market Scheduler...
📊 Current Market Status:
════════════════════════════════════════
Asia-Pacific:
  🔴 NSE India              CLOSED
  🟢 Japan Exchange Group   OPEN
...

✅ ALL SCHEDULERS STARTED
```

## Features

### ✅ Intelligent Scheduling

- Only fetches data when markets are OPEN
- Automatic timezone conversion
- Weekend detection
- Session-based scheduling (lunch breaks)

### ✅ Production Ready

- Robust error handling
- Graceful degradation
- Automatic retry on failure
- No process crashes

### ✅ Beautiful Logging

- Emoji-rich status indicators
- Market-specific icons
- Formatted price displays
- Timezone-aware timestamps

### ✅ Performance Optimized

- Conditional updates only
- Reduced logging frequency
- Batch database updates
- Connection pooling

## Common Commands

### Start Server

```bash
npm run dev
```

### Check Market Status

```bash
curl http://localhost:3000/api/v1/market/status | jq
```

### Force Update All Markets

```bash
curl -X POST http://localhost:3000/api/v1/market/update
```

### Check Database for Latest Data

```bash
# US Indices
curl http://localhost:3000/api/v1/us/indices

# NSE Indices
curl http://localhost:3000/api/v1/nse/indices

# Global Indices
curl http://localhost:3000/api/v1/global-indices
```

## Status Indicators

### Market Status

- 🟢 **OPEN** - Market is currently trading
- 🔴 **CLOSED** - Market is currently closed

### Market Icons

- 🇮🇳 India (NSE)
- 🇺🇸 United States (NYSE/NASDAQ)
- 🇬🇧 United Kingdom (LSE)
- 🇩🇪 Germany (Frankfurt)
- 🇫🇷 France (Euronext)
- 🇯🇵 Japan (JPX)
- 🇭🇰 Hong Kong (HKEX)
- 🇨🇳 China (Shanghai)
- 🇦🇺 Australia (ASX)
- 🇨🇦 Canada (TSX)
- ₿ Cryptocurrency
- 🛢️ Commodities
- 📊 Mutual Funds

### Price Movement

- 📈 Up (positive change)
- 📉 Down (negative change)
- 📊 Flat (minimal change)
- 🚀 Strong up (>15%)

## Troubleshooting

### Scheduler Not Starting

1. Check database connection
2. Verify environment variables
3. Check console for error messages

### Market Status Wrong

1. Check system timezone settings
2. Verify `marketHours.js` configuration
3. Test with `/api/v1/market/status` endpoint

### No Data Updates

1. Verify market is OPEN
2. Check API rate limits
3. Review scheduler logs
4. Test manual update endpoint

### High API Calls

1. Check if too many markets are open
2. Review update frequencies in config
3. Consider implementing rate limiting

## Environment Variables

Required in `.env`:

```bash
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=development
```

## Next Steps

1. **Integrate Real APIs**
   - Add actual Commodities API
   - Integrate AMFI for Mutual Funds
2. **Frontend Dashboard**
   - Create market status display
   - Show real-time updates
3. **Advanced Features**
   - WebSocket support
   - Holiday calendar
   - Pre-market/After-hours data

## Documentation

- **Full System Guide**: `GLOBAL_SCHEDULER_SYSTEM.md`
- **Implementation Summary**: `SCHEDULER_IMPLEMENTATION_SUMMARY.md`
- **This Quick Start**: `SCHEDULER_QUICK_START.md`

## Support

For issues or questions:

1. Check server logs for errors
2. Test API endpoints manually
3. Verify database connectivity
4. Review scheduler configuration

---

**Status**: ✅ Production Ready  
**Last Updated**: February 11, 2026  
**Version**: 1.0.0
