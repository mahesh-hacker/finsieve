/**
 * NSE Stocks Real-Time Scheduler
 *
 * During India market hours (9:15 AM - 3:30 PM IST), fetches live stock data
 * (top gainers, losers, high volume, 52W high/low) from NSE and broadcasts
 * to all connected frontend clients via WebSocket — similar to Zerodha/Groww/Angel One.
 *
 * Update frequency: 8 seconds (balances freshness with NSE rate limits).
 */

import nseStocksService from "../services/nseStocks.service.js";
import marketDataBroadcaster from "../services/marketDataBroadcaster.service.js";
import { isMarketOpen, MARKET_HOURS } from "../config/marketHours.js";

const INDEX_NAME = "NIFTY 50";
const DEFAULT_INTERVAL_MS = 8000;   // Free: 8 seconds
const PREMIUM_INTERVAL_MS = 1000;   // Premium/Enterprise: 1 second

class NSEStocksScheduler {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.intervalMs = DEFAULT_INTERVAL_MS;
    this.lastUpdateTime = null;
    this.updateCount = 0;
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 5;
  }

  start() {
    if (this.isRunning) {
      console.log("⚠️  NSE Stocks Scheduler is already running");
      return;
    }

    console.log("🇮🇳 Starting NSE Stocks Real-Time Scheduler...");
    console.log(`   Gainers / Losers / Volume / 52W every ${this.intervalMs / 1000}s (market hours)`);

    this.isRunning = true;
    this.runUpdate();

    this.intervalId = setInterval(() => {
      this.runUpdate();
    }, this.intervalMs);

    console.log("✅ NSE Stocks scheduler started");
  }

  setUpdateFrequency(ms) {
    const next = Math.max(1000, Math.min(ms, 60000));
    if (next === this.intervalMs) return;
    this.intervalMs = next;
    if (!this.isRunning) return;
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.runUpdate(), this.intervalMs);
    console.log(`⚡ NSE Stocks: update interval set to ${this.intervalMs / 1000}s`);
  }

  stop() {
    if (!this.isRunning) return;

    console.log("🛑 Stopping NSE Stocks scheduler...");
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.lastUpdateTime = null;
    console.log("✅ NSE Stocks scheduler stopped");
  }

  async runUpdate() {
    if (!isMarketOpen("India")) {
      this.consecutiveErrors = 0;
      return;
    }

    try {
      const timestamp = new Date().toISOString();

      const [gainersLosers, volumeStocks, week52High, week52Low] = await Promise.allSettled([
        nseStocksService.getGainersLosers(INDEX_NAME),
        nseStocksService.getHighVolumeStocks(INDEX_NAME),
        nseStocksService.get52WeekHighStocks(INDEX_NAME),
        nseStocksService.get52WeekLowStocks(INDEX_NAME),
      ]);

      const payload = {
        type: "stocks_update",
        country: "India",
        timestamp,
        gainers: gainersLosers.status === "fulfilled" ? (gainersLosers.value?.gainers ?? gainersLosers.value?.NIFTY?.data ?? []) : [],
        losers: gainersLosers.status === "fulfilled" ? (gainersLosers.value?.losers ?? gainersLosers.value?.NIFTY?.declines ?? []) : [],
        volume: volumeStocks.status === "fulfilled" ? (volumeStocks.value ?? []) : [],
        week52High: week52High.status === "fulfilled" ? (week52High.value ?? []) : [],
        week52Low: week52Low.status === "fulfilled" ? (week52Low.value ?? []) : [],
      };

      if (marketDataBroadcaster.clients.size > 0) {
        marketDataBroadcaster.broadcastAll(payload);
      }

      this.lastUpdateTime = new Date();
      this.updateCount++;
      this.consecutiveErrors = 0;

      const logEvery = Math.max(15, Math.ceil(120000 / this.intervalMs));
      if (this.updateCount % logEvery === 0) {
        console.log(
          `✅ NSE Stocks #${this.updateCount}: gainers=${payload.gainers.length} losers=${payload.losers.length} volume=${payload.volume.length}`
        );
      }
    } catch (err) {
      this.consecutiveErrors++;
      if (this.consecutiveErrors <= this.maxConsecutiveErrors) {
        console.error("❌ NSE Stocks scheduler error:", err.message);
      }
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      updateIntervalMs: this.intervalMs,
      lastUpdateTime: this.lastUpdateTime,
      updateCount: this.updateCount,
      isMarketOpen: isMarketOpen("India"),
    };
  }
}

const nseStocksScheduler = new NSEStocksScheduler();
export default nseStocksScheduler;
