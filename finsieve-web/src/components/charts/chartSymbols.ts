/**
 * DB symbol → Chart symbol mapping for TradingChart / useBrokerHistorical.
 * Extracted for React Fast Refresh (only-export-components) and reuse.
 */

const DB_TO_CHART_SYMBOL: Record<string, string> = {
  // NSE indices
  NIFTY:        "NSE:NIFTY50",
  BANKNIFTY:    "NSE:BANKNIFTY",
  NIFTYIT:      "NSE:NIFTYIT",
  NIFTYMIDCAP:  "NSE:NIFTY50",
  NIFTYNEXT50:  "NSE:NIFTY50",
  NIFTY100:     "NSE:NIFTY50",
  NIFTY200:     "NSE:NIFTY50",
  NIFTY500:     "NSE:NIFTY50",
  NIFTYFMCG:    "NSE:NIFTY50",
  NIFTYAUTO:    "NSE:NIFTY50",
  NIFTYPHARMA:  "NSE:NIFTY50",
  NIFTYMETAL:   "NSE:NIFTY50",
  NIFTYREALTY:  "NSE:NIFTY50",
  NIFTYENERGY:  "NSE:NIFTY50",
  NIFTYINFRA:   "NSE:NIFTY50",
  NIFTYSMLCAP100: "NSE:NIFTY50",
  SENSEX:       "BSE:SENSEX",
  GOLD:         "MCX:GOLD",
  SILVER:       "MCX:SILVER",
  CRUDE:        "MCX:CRUDE",
  CRUDEOIL:     "MCX:CRUDE",
  COPPER:       "MCX:COPPER",
  DJI:          "GLOBAL:^DJI",
  SPX:          "GLOBAL:^GSPC",
  IXIC:         "GLOBAL:^IXIC",
  FTSE:         "GLOBAL:^FTSE",
  DAX:          "GLOBAL:^GDAXI",
  CAC:          "GLOBAL:^FCHI",
  N225:         "GLOBAL:^N225",
  HSI:          "GLOBAL:^HSI",
  KOSPI:        "GLOBAL:^KS11",
  ASX200:       "GLOBAL:^AXJO",
  STOXX50E:     "GLOBAL:^STOXX50E",
  STI:          "GLOBAL:^STI",
  IBEX:         "GLOBAL:^IBEX",
  TSX:          "GLOBAL:^GSPTSE",
  BOVESPA:      "GLOBAL:^BVSP",
  RUT:          "GLOBAL:^RUT",
};

export function resolveChartSymbol(dbSymbol: string, country?: string): string {
  if (dbSymbol.includes(":")) return dbSymbol;
  const mapped = DB_TO_CHART_SYMBOL[dbSymbol.toUpperCase()];
  if (mapped) return mapped;
  if (country === "India" || !country) return `NSE:${dbSymbol}`;
  return `GLOBAL:${dbSymbol}`;
}
