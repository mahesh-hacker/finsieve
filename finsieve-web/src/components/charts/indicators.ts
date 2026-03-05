/**
 * Technical indicator calculations
 * All functions operate on arrays of { time, open, high, low, close, volume }
 * and return Lightweight Charts series data arrays.
 */

export interface Candle {
  time:   number; // Unix seconds
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
}

export interface LinePoint { time: number; value: number; }

// ─── Simple Moving Average ────────────────────────────────────────────────────
export function calcSMA(candles: Candle[], period: number): LinePoint[] {
  const result: LinePoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += candles[i - j].close;
    result.push({ time: candles[i].time, value: sum / period });
  }
  return result;
}

// ─── Exponential Moving Average ───────────────────────────────────────────────
export function calcEMA(candles: Candle[], period: number): LinePoint[] {
  if (candles.length < period) return [];
  const k = 2 / (period + 1);
  const result: LinePoint[] = [];
  let ema = candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
  result.push({ time: candles[period - 1].time, value: ema });

  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    result.push({ time: candles[i].time, value: ema });
  }
  return result;
}

// ─── Relative Strength Index ──────────────────────────────────────────────────
export function calcRSI(candles: Candle[], period = 14): LinePoint[] {
  if (candles.length < period + 1) return [];
  const result: LinePoint[] = [];

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const delta = candles[i].close - candles[i - 1].close;
    if (delta > 0) gains  += delta;
    else           losses -= delta;
  }
  let avgGain = gains  / period;
  let avgLoss = losses / period;
  const pushRSI = (i: number) => {
    const rs  = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    result.push({ time: candles[i].time, value: Math.round(rsi * 100) / 100 });
  };
  pushRSI(period);

  for (let i = period + 1; i < candles.length; i++) {
    const delta = candles[i].close - candles[i - 1].close;
    const gain  = delta > 0 ? delta : 0;
    const loss  = delta < 0 ? -delta : 0;
    avgGain = (avgGain * (period - 1) + gain)  / period;
    avgLoss = (avgLoss * (period - 1) + loss)  / period;
    pushRSI(i);
  }
  return result;
}

// ─── Bollinger Bands ──────────────────────────────────────────────────────────
export interface BBPoint { time: number; upper: number; middle: number; lower: number; }
export function calcBB(candles: Candle[], period = 20, multiplier = 2): BBPoint[] {
  const result: BBPoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice  = candles.slice(i - period + 1, i + 1);
    const mean   = slice.reduce((s, c) => s + c.close, 0) / period;
    const variance = slice.reduce((s, c) => s + (c.close - mean) ** 2, 0) / period;
    const sd     = Math.sqrt(variance);
    result.push({
      time:   candles[i].time,
      upper:  Math.round((mean + multiplier * sd) * 100) / 100,
      middle: Math.round(mean * 100) / 100,
      lower:  Math.round((mean - multiplier * sd) * 100) / 100,
    });
  }
  return result;
}

// ─── MACD ─────────────────────────────────────────────────────────────────────
export interface MACDPoint { time: number; macd: number; signal: number; histogram: number; }
export function calcMACD(candles: Candle[], fast = 12, slow = 26, signal = 9): MACDPoint[] {
  const fastEMA = calcEMA(candles, fast);
  const slowEMA = calcEMA(candles, slow);

  // Align – slow EMA starts later
  const offset = slow - fast;
  const macdLine = slowEMA.map((p, i) => ({
    time:  p.time,
    value: fastEMA[i + offset].value - p.value,
  }));

  // Signal = EMA(macdLine, signalPeriod)
  const fakeCandles = macdLine.map(p => ({
    time: p.time, open: p.value, high: p.value, low: p.value, close: p.value, volume: 0,
  }));
  const signalLine = calcEMA(fakeCandles, signal);

  const result: MACDPoint[] = [];
  const signalOffset = macdLine.length - signalLine.length;
  for (let i = 0; i < signalLine.length; i++) {
    const macdVal    = macdLine[i + signalOffset].value;
    const signalVal  = signalLine[i].value;
    result.push({
      time:      signalLine[i].time,
      macd:      Math.round(macdVal    * 10000) / 10000,
      signal:    Math.round(signalVal  * 10000) / 10000,
      histogram: Math.round((macdVal - signalVal) * 10000) / 10000,
    });
  }
  return result;
}

// ─── Volume histogram colors ──────────────────────────────────────────────────
export function buildVolumeData(candles: Candle[]) {
  return candles.map(c => ({
    time:  c.time,
    value: c.volume,
    color: c.close >= c.open ? "rgba(38, 166, 154, 0.6)" : "rgba(239, 83, 80, 0.6)",
  }));
}
