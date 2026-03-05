/**
 * Global Market Hours Configuration
 * All times converted to UTC for accurate market status checking
 */

export const MARKET_HOURS = {
  // ═══════════════════════════════════════════════════════
  // ASIA-PACIFIC MARKETS
  // ═══════════════════════════════════════════════════════

  India: {
    name: "NSE India",
    timezone: "Asia/Kolkata",
    sessions: [
      {
        open: { hour: 9, minute: 15 },
        close: { hour: 15, minute: 30 }, // 9:15 AM - 3:30 PM IST
      },
    ],
    utcOffset: 5.5, // IST is UTC+5:30
    updateFrequency: 5000, // 5 seconds during market hours (frequent; 1s can trigger NSE rate limits)
  },

  Japan: {
    name: "Japan Exchange Group",
    timezone: "Asia/Tokyo",
    sessions: [
      {
        open: { hour: 9, minute: 0 },
        close: { hour: 11, minute: 30 }, // Morning session
      },
      {
        open: { hour: 12, minute: 30 },
        close: { hour: 15, minute: 0 }, // Afternoon session
      },
    ],
    utcOffset: 9, // JST is UTC+9
    updateFrequency: 5000, // 5 seconds
  },

  "Hong Kong": {
    name: "Hong Kong Stock Exchange",
    timezone: "Asia/Hong_Kong",
    sessions: [
      {
        open: { hour: 9, minute: 30 },
        close: { hour: 12, minute: 0 }, // Morning session
      },
      {
        open: { hour: 13, minute: 0 },
        close: { hour: 16, minute: 0 }, // Afternoon session
      },
    ],
    utcOffset: 8, // HKT is UTC+8
    updateFrequency: 5000, // 5 seconds
  },

  China: {
    name: "Shanghai Stock Exchange",
    timezone: "Asia/Shanghai",
    sessions: [
      {
        open: { hour: 9, minute: 30 },
        close: { hour: 11, minute: 30 }, // Morning session
      },
      {
        open: { hour: 13, minute: 0 },
        close: { hour: 15, minute: 0 }, // Afternoon session
      },
    ],
    utcOffset: 8, // CST is UTC+8
    updateFrequency: 5000, // 5 seconds
  },

  Australia: {
    name: "Australian Securities Exchange",
    timezone: "Australia/Sydney",
    sessions: [
      {
        open: { hour: 10, minute: 0 },
        close: { hour: 16, minute: 0 }, // 10:00 AM - 4:00 PM AEDT
      },
    ],
    utcOffset: 11, // AEDT is UTC+11 (varies with DST)
    updateFrequency: 5000, // 5 seconds
  },

  // ═══════════════════════════════════════════════════════
  // EUROPEAN MARKETS
  // ═══════════════════════════════════════════════════════

  "United Kingdom": {
    name: "London Stock Exchange",
    timezone: "Europe/London",
    sessions: [
      {
        open: { hour: 8, minute: 0 },
        close: { hour: 16, minute: 30 }, // 8:00 AM - 4:30 PM GMT
      },
    ],
    utcOffset: 0, // GMT is UTC+0 (UTC+1 during BST)
    updateFrequency: 5000, // 5 seconds
  },

  Germany: {
    name: "Frankfurt Stock Exchange",
    timezone: "Europe/Berlin",
    sessions: [
      {
        open: { hour: 9, minute: 0 },
        close: { hour: 17, minute: 30 }, // 9:00 AM - 5:30 PM CET
      },
    ],
    utcOffset: 1, // CET is UTC+1 (UTC+2 during CEST)
    updateFrequency: 5000, // 5 seconds
  },

  France: {
    name: "Euronext Paris",
    timezone: "Europe/Paris",
    sessions: [
      {
        open: { hour: 9, minute: 0 },
        close: { hour: 17, minute: 30 }, // 9:00 AM - 5:30 PM CET
      },
    ],
    utcOffset: 1, // CET is UTC+1
    updateFrequency: 5000, // 5 seconds
  },

  // ═══════════════════════════════════════════════════════
  // AMERICAS MARKETS
  // ═══════════════════════════════════════════════════════

  "United States": {
    name: "NYSE/NASDAQ",
    timezone: "America/New_York",
    sessions: [
      {
        open: { hour: 9, minute: 30 },
        close: { hour: 16, minute: 0 }, // 9:30 AM - 4:00 PM EST
      },
    ],
    utcOffset: -5, // EST is UTC-5 (UTC-4 during EDT)
    updateFrequency: 5000, // 5 seconds
  },

  Canada: {
    name: "Toronto Stock Exchange",
    timezone: "America/Toronto",
    sessions: [
      {
        open: { hour: 9, minute: 30 },
        close: { hour: 16, minute: 0 }, // 9:30 AM - 4:00 PM EST
      },
    ],
    utcOffset: -5, // EST is UTC-5
    updateFrequency: 5000, // 5 seconds
  },

  // ═══════════════════════════════════════════════════════
  // 24/7 MARKETS
  // ═══════════════════════════════════════════════════════

  Crypto: {
    name: "Cryptocurrency Markets",
    timezone: "UTC",
    sessions: [
      {
        open: { hour: 0, minute: 0 },
        close: { hour: 23, minute: 59 }, // 24/7
      },
    ],
    utcOffset: 0,
    updateFrequency: 10000, // 10 seconds (crypto is volatile)
    alwaysOpen: true,
  },

  Commodities: {
    name: "Commodity Markets",
    timezone: "America/New_York",
    sessions: [
      {
        open: { hour: 8, minute: 0 },
        close: { hour: 17, minute: 0 }, // 8:00 AM - 5:00 PM EST (CME hours)
      },
    ],
    utcOffset: -5,
    updateFrequency: 10000, // 10 seconds
  },

  // ═══════════════════════════════════════════════════════
  // DAILY UPDATE MARKETS
  // ═══════════════════════════════════════════════════════

  MutualFunds: {
    name: "Mutual Funds",
    timezone: "Asia/Kolkata",
    sessions: [
      {
        open: { hour: 18, minute: 0 }, // NAV published around 6 PM IST
        close: { hour: 18, minute: 30 },
      },
    ],
    utcOffset: 5.5,
    updateFrequency: 3600000, // 1 hour (daily updates only)
    dailyUpdate: true,
  },
};

/**
 * Check if a market is currently open
 * @param {string} country - Country/market name
 * @returns {boolean} - True if market is open
 */
export function isMarketOpen(country) {
  const market = MARKET_HOURS[country];
  if (!market) return false;

  // 24/7 markets are always open
  if (market.alwaysOpen) return true;

  const now = new Date();
  const currentDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday

  // Skip weekends (except crypto which is 24/7)
  if (currentDay === 0 || currentDay === 6) return false;

  // Get local time in market timezone
  const localTime = new Date(
    now.toLocaleString("en-US", { timeZone: market.timezone }),
  );
  const hours = localTime.getHours();
  const minutes = localTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  // Check if within any trading session
  for (const session of market.sessions) {
    const openMinutes = session.open.hour * 60 + session.open.minute;
    const closeMinutes = session.close.hour * 60 + session.close.minute;

    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      return true;
    }
  }

  return false;
}

/**
 * Get all currently open markets
 * @returns {string[]} - Array of country names with open markets
 */
export function getOpenMarkets() {
  return Object.keys(MARKET_HOURS).filter((country) => isMarketOpen(country));
}

/**
 * Get market status for all markets
 * @returns {Object} - Market status for each country
 */
export function getAllMarketStatus() {
  const status = {};

  for (const [country, market] of Object.entries(MARKET_HOURS)) {
    const isOpen = isMarketOpen(country);
    const now = new Date();
    const localTime = new Date(
      now.toLocaleString("en-US", { timeZone: market.timezone }),
    );

    status[country] = {
      name: market.name,
      isOpen,
      status: isOpen ? "OPEN" : "CLOSED",
      timezone: market.timezone,
      localTime: localTime.toLocaleString("en-IN", {
        timeZone: market.timezone,
        hour12: true,
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      updateFrequency: market.updateFrequency,
      sessions: market.sessions.map((s) => ({
        open: `${String(s.open.hour).padStart(2, "0")}:${String(s.open.minute).padStart(2, "0")}`,
        close: `${String(s.close.hour).padStart(2, "0")}:${String(s.close.minute).padStart(2, "0")}`,
      })),
    };
  }

  return status;
}

/**
 * Get IST equivalent times for all markets
 * @returns {Object} - Market timings in IST
 */
export function getMarketTimingsIST() {
  return {
    "Asia-Pacific": {
      Japan: "5:30 AM – 11:30 AM & 1:00 PM – 5:30 PM IST",
      "Hong Kong": "7:00 AM – 11:30 AM & 2:30 PM – 6:30 PM IST",
      China: "7:00 AM – 11:30 AM & 2:30 PM – 5:30 PM IST",
      Australia: "4:30 AM – 10:30 AM IST (approx)",
      India: "9:15 AM – 3:30 PM IST",
    },
    Europe: {
      "United Kingdom": "1:30 PM – 10:00 PM IST",
      Germany: "1:30 PM – 11:00 PM IST",
      France: "1:30 PM – 11:00 PM IST",
    },
    Americas: {
      "United States": "7:00 PM – 1:30 AM IST (next day)",
      Canada: "7:00 PM – 1:30 AM IST (next day)",
    },
    "24/7": {
      Crypto: "Always Open",
      Commodities: "5:30 PM – 3:30 AM IST (approx)",
    },
  };
}

export default {
  MARKET_HOURS,
  isMarketOpen,
  getOpenMarkets,
  getAllMarketStatus,
  getMarketTimingsIST,
};
