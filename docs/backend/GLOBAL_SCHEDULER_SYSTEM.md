# 🌍 Global Market Scheduler System

## Overview

Finsieve now features an intelligent, time-zone aware scheduling system that automatically updates market data based on actual trading hours across the globe. This eliminates unnecessary API calls when markets are closed and ensures real-time updates when markets are active.

---

## 📊 Scheduler Architecture

### 1. **NSE India Scheduler** 🇮🇳

- **Market**: National Stock Exchange of India
- **Trading Hours**: 9:15 AM - 3:30 PM IST
- **Update Frequency**: **1 second** (ultra-fast)
- **Status**: Active during market hours only
- **File**: `src/scheduler/nseDataScheduler.js`

**Why so fast?**

- Indian market is highly volatile
- NSE provides free real-time API
- Core market for Indian users

---

### 2. **Global Market Scheduler** 🌍

- **Markets Covered**:
  - 🇺🇸 United States (NYSE/NASDAQ)
  - 🇬🇧 United Kingdom (LSE)
  - 🇩🇪 Germany (Frankfurt)
  - 🇫🇷 France (Euronext)
  - 🇯🇵 Japan (JPX)
  - 🇭🇰 Hong Kong (HKEX)
  - 🇨🇳 China (Shanghai)
  - 🇦🇺 Australia (ASX)
  - 🇨🇦 Canada (TSX)

- **Update Frequency**: **5 seconds** (when market is open)
- **Intelligence**: Automatically detects open/closed status
- **File**: `src/scheduler/globalMarketScheduler.js`

**Market Hours (IST Equivalent)**:

| Region           | Markets     | IST Timing                             |
| ---------------- | ----------- | -------------------------------------- |
| **Asia-Pacific** |
| Japan            | JPX Tokyo   | 5:30 AM – 11:30 AM & 1:00 PM – 5:30 PM |
| Hong Kong        | HKEX        | 7:00 AM – 11:30 AM & 2:30 PM – 6:30 PM |
| China            | Shanghai    | 7:00 AM – 11:30 AM & 2:30 PM – 5:30 PM |
| Australia        | ASX         | 4:30 AM – 10:30 AM (approx)            |
| India            | NSE         | 9:15 AM – 3:30 PM                      |
| **Europe**       |
| UK               | LSE London  | 1:30 PM – 10:00 PM                     |
| Germany          | Frankfurt   | 1:30 PM – 11:00 PM                     |
| France           | Euronext    | 1:30 PM – 11:00 PM                     |
| **Americas**     |
| USA              | NYSE/NASDAQ | 7:00 PM – 1:30 AM (next day)           |
| Canada           | TSX         | 7:00 PM – 1:30 AM (next day)           |

---

### 3. **Cryptocurrency Scheduler** ₿

- **Markets**: All major cryptocurrencies (BTC, ETH, etc.)
- **Trading Hours**: **24/7** - Never closes!
- **Update Frequency**: **10 seconds**
- **Data Source**: CoinGecko API
- **File**: `src/scheduler/cryptoScheduler.js`

**Why 24/7?**

- Crypto markets operate continuously
- High volatility requires frequent updates
- Global trading across all time zones

---

### 4. **Commodities Scheduler** 🛢️

- **Markets**: CME commodities (Gold, Silver, Crude Oil, etc.)
- **Trading Hours**: 8:00 AM - 5:00 PM EST (5:30 PM - 3:30 AM IST)
- **Update Frequency**: **10 seconds** (when market is open)
- **Status**: Time-aware, only runs during CME hours
- **File**: `src/scheduler/commoditiesScheduler.js`

**Commodities Tracked**:

- Gold (GC=F)
- Silver (SI=F)
- Crude Oil (CL=F)
- Natural Gas (NG=F)
- Copper (HG=F)

---

### 5. **Mutual Funds Scheduler** 📊

- **Market**: Indian Mutual Funds
- **Update Time**: **6:00 PM IST** (daily)
- **Update Frequency**: Once per day
- **Data Source**: AMFI (Association of Mutual Funds in India)
- **File**: `src/scheduler/mutualFundsScheduler.js`

**Why once daily?**

- NAV (Net Asset Value) is published once per day
- NAV calculation happens after market close
- No intraday updates available

---

## 🚀 How It Works

### Market Hours Configuration

All market timings are centrally managed in:

```javascript
src / config / marketHours.js;
```

**Key Features**:

- ✅ Timezone-aware (uses `Intl` API)
- ✅ Session-based (handles lunch breaks)
- ✅ Weekend detection (skip Sat/Sun)
- ✅ UTC conversion for accuracy
- ✅ Configurable update frequencies

### Intelligent Scheduling

Each scheduler:

1. **Checks market status** before every update
2. **Only fetches data** when market is OPEN
3. **Logs status changes** (OPEN → CLOSED transitions)
4. **Respects time zones** using native timezone handling

Example:

```javascript
const isOpen = isMarketOpen("United States");

if (isOpen) {
  // Fetch and update data
  await updateUSIndices();
} else {
  // Skip update, market closed
  console.log("🔴 US Market is CLOSED");
}
```

---

## 📡 API Endpoints

### Get Market Status

```http
GET /api/v1/market/status
```

**Response**:

```json
{
  "success": true,
  "data": {
    "allMarkets": {
      "United States": {
        "name": "NYSE/NASDAQ",
        "isOpen": true,
        "status": "OPEN",
        "timezone": "America/New_York",
        "localTime": "Mon, Feb 11, 2026, 09:45 AM",
        "updateFrequency": 5000,
        "sessions": [
          { "open": "09:30", "close": "16:00" }
        ]
      },
      "India": { ... },
      "Crypto": { ... }
    },
    "openMarkets": ["United States", "Crypto"],
    "openMarketsCount": 2,
    "marketTimingsIST": { ... },
    "timestamp": "2026-02-11T14:15:00.000Z",
    "istTime": "11/2/2026, 7:45:00 pm"
  }
}
```

### Force Update All Markets

```http
POST /api/v1/market/update
```

Triggers immediate update for all currently open markets.

---

## 🔧 Technical Details

### Server Integration

File: `src/server.js`

```javascript
// Import schedulers
import nseDataScheduler from "./scheduler/nseDataScheduler.js";
import globalMarketScheduler from "./scheduler/globalMarketScheduler.js";
import cryptoScheduler from "./scheduler/cryptoScheduler.js";
import commoditiesScheduler from "./scheduler/commoditiesScheduler.js";
import mutualFundsScheduler from "./scheduler/mutualFundsScheduler.js";

// Start all schedulers
nseDataScheduler.start();
globalMarketScheduler.start();
cryptoScheduler.start();
commoditiesScheduler.start();
mutualFundsScheduler.start();

// Graceful shutdown
process.on("SIGINT", () => {
  nseDataScheduler.stop();
  globalMarketScheduler.stop();
  cryptoScheduler.stop();
  commoditiesScheduler.stop();
  mutualFundsScheduler.stop();
  process.exit(0);
});
```

### Logging

Each scheduler logs:

- ✅ Start/stop events
- ✅ Market open/close transitions
- ✅ Update progress (every 1 minute for frequent updates)
- ✅ Success/error messages
- ✅ Data summaries (top items with prices)

**Example Console Output**:

```
🌍 ================================
📡 STARTING MARKET DATA SCHEDULERS
🌍 ================================

🇮🇳 Starting NSE India Scheduler...
⏰  Market Hours: 9:15 AM - 3:30 PM IST
⏱️  Update Frequency: 1 second
✅ NSE Scheduler started successfully

🌍 Starting Global Market Scheduler...
📊 Current Market Status:
═══════════════════════════════════════════════════════
Asia-Pacific:
  🟢 NSE India                     OPEN    (1s updates)
  🔴 Japan Exchange Group          CLOSED  (5s updates)
  🔴 Hong Kong Stock Exchange      CLOSED  (5s updates)

Europe:
  🟢 London Stock Exchange         OPEN    (5s updates)
  🟢 Frankfurt Stock Exchange      OPEN    (5s updates)

Americas:
  🔴 NYSE/NASDAQ                   CLOSED  (5s updates)

₿ Starting Cryptocurrency Scheduler...
⏱️  Update Frequency: 10 seconds (24/7)
✅ Crypto Scheduler started successfully

🛢️  Starting Commodities Scheduler...
⏰  Market Hours: 8:00 AM - 5:00 PM EST (CME)
🔴 Commodities Market is CLOSED

📊 Starting Mutual Funds Scheduler...
⏰  Update Time: 6:00 PM IST (daily)
✅ Mutual Funds Scheduler started successfully

🌍 ================================
✅ ALL SCHEDULERS STARTED
🌍 ================================
```

---

## 📈 Update Frequencies Summary

| Market         | Frequency      | Reason                                    |
| -------------- | -------------- | ----------------------------------------- |
| NSE India      | **1 second**   | Free API, ultra-fast, core market         |
| US Indices     | **5 seconds**  | Moderate volatility, Yahoo Finance limits |
| Global Markets | **5 seconds**  | Balanced performance                      |
| Crypto         | **10 seconds** | 24/7 operation, API rate limits           |
| Commodities    | **10 seconds** | Moderate volatility                       |
| Mutual Funds   | **Daily**      | NAV published once per day                |

---

## 🌐 Timezone Handling

### Philosophy

All market hours are stored in **local timezone** with UTC offset for reference.

### Implementation

```javascript
// Check if US market is open
const now = new Date();
const nyTime = new Date(
  now.toLocaleString("en-US", { timeZone: "America/New_York" }),
);
const currentHour = nyTime.getHours();
const isOpen = currentHour >= 9 && currentHour < 16;
```

### Why this approach?

- ✅ Handles Daylight Saving Time automatically
- ✅ No manual UTC calculations needed
- ✅ Works across all platforms (Windows, macOS, Linux)
- ✅ Native JavaScript, no external libraries

---

## 🧪 Testing

### Check Scheduler Status

```javascript
// In Node.js REPL or debug console
import globalMarketScheduler from "./src/scheduler/globalMarketScheduler.js";
console.log(globalMarketScheduler.getStatus());
```

### Force Update

```javascript
await globalMarketScheduler.forceUpdateAllOpenMarkets();
```

### Check Market Hours

```javascript
import { isMarketOpen, getAllMarketStatus } from "./src/config/marketHours.js";

console.log(isMarketOpen("United States")); // true/false
console.log(getAllMarketStatus()); // Full status object
```

---

## 🔮 Future Enhancements

### Planned Features

- [ ] WebSocket support for real-time push updates
- [ ] Market pre-open/post-close session handling
- [ ] Holiday calendar integration (NYSE holidays, etc.)
- [ ] Dynamic frequency adjustment based on volatility
- [ ] Circuit breaker support (halt trading detection)
- [ ] Historical data backfilling
- [ ] Performance metrics dashboard

### API Integrations Needed

- [ ] Commodities API (currently placeholder)
- [ ] AMFI Mutual Funds API integration
- [ ] Bond market data provider
- [ ] Options & Derivatives data

---

## 📝 Maintenance

### Adding New Markets

1. Add market config to `src/config/marketHours.js`
2. Create or update relevant scheduler
3. Add symbol mapping for data fetching
4. Update documentation

### Changing Update Frequencies

Edit `updateFrequency` in `src/config/marketHours.js`:

```javascript
"United States": {
  // ...
  updateFrequency: 5000, // 5 seconds
}
```

### Debugging Market Hours

```bash
# Check current market status
curl http://localhost:3000/api/v1/market/status

# Force update all markets
curl -X POST http://localhost:3000/api/v1/market/update
```

---

## 🎯 Performance Optimization

### Current Optimizations

✅ **Conditional Updates**: Only fetch when market is open
✅ **Reduced Logging**: Log every Nth update (not every update)
✅ **Batched Updates**: Update multiple indices in single query
✅ **Database Upserts**: ON CONFLICT UPDATE pattern
✅ **Connection Pooling**: Reuse database connections

### Resource Usage

| Scheduler    | API Calls/Hour (when open) | DB Writes/Hour |
| ------------ | -------------------------- | -------------- |
| NSE India    | 3,600 (1s × 3600s)         | 3,600          |
| US Markets   | 720 (5s × 3600s)           | 720            |
| Crypto       | 360 (10s × 3600s)          | 360            |
| Commodities  | 360 (10s × 3600s)          | 360            |
| Mutual Funds | 1 (daily)                  | 1              |

**Total**: ~5,000 API calls/hour during peak hours (all markets open)

---

## 🛡️ Error Handling

Each scheduler includes:

- Try-catch blocks for all API calls
- Graceful degradation (continue on single failure)
- Error logging with context
- Automatic retry on next interval
- No process crash on API failures

Example:

```javascript
try {
  await updateUSIndices();
  console.log("✅ Updated US indices");
} catch (error) {
  console.error("❌ Error updating US indices:", error.message);
  // Continue running, retry on next interval
}
```

---

## 📚 References

- [NSE India API](https://www.nseindia.com/)
- [Yahoo Finance API](https://github.com/gadicc/node-yahoo-finance2)
- [CoinGecko API](https://www.coingecko.com/en/api)
- [CME Group Trading Hours](https://www.cmegroup.com/)
- [AMFI India](https://www.amfiindia.com/)

---

## 🤝 Contributing

When adding new schedulers:

1. Follow existing patterns
2. Add to `marketHours.js` first
3. Implement intelligent status checking
4. Include comprehensive logging
5. Update this documentation

---

**Last Updated**: February 11, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
