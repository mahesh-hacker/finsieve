/**
 * InvestBot Rule-Based Engine
 * Pure JS - no external AI API required.
 * Pattern matching + decision tree + investment knowledge base.
 */
import { INDIAN_INDICES, INDIAN_STOCKS, SECTORS, SECTOR_KEYWORDS } from "../data/marketData.js";

const DISCLAIMER = `\n\n---\n**IMPORTANT DISCLAIMER:** This is for educational purposes only. Suggestions are based on historical data and are **NOT** guarantees of future returns. Market investments are subject to market risks. Please consult a SEBI-registered investment advisor before investing. Past performance does not guarantee future results. **Invest at your own risk.**`;

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const avg = (a, b) => (a + b) / 2;
const fmt = (n) => {
  if (n >= 1e7) return `Rs ${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `Rs ${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `Rs ${(n / 1e3).toFixed(1)}K`;
  return `Rs ${Math.round(n).toLocaleString("en-IN")}`;
};

// ─── Asset Database ────────────────────────────────────────────────────────────
const ASSETS = [
  // LOW RISK
  {
    name: "Axis Liquid Fund", type: "Liquid MF", risk: "low",
    minRet: 6.5, maxRet: 7.0, minMonths: 1, sip: true,
    aliases: ["axis liquid", "axis liquid fund"],
    fundHouse: "Axis AMC", exchange: "AMFI Registered",
    howToInvest: "Via Groww, Zerodha Coin, Kuvera, MFCentral, or directly at axismf.com",
    why: "Instant liquidity, ultra-safe, better than savings account",
    extra: "Best for parking money short-term. Redemption usually within 1 business day.",
  },
  {
    name: "HDFC Short Term Debt Fund", type: "Debt MF", risk: "low",
    minRet: 6.5, maxRet: 7.5, minMonths: 12, sip: true,
    aliases: ["hdfc short term", "hdfc short term debt"],
    fundHouse: "HDFC AMC", exchange: "AMFI Registered",
    howToInvest: "Via Groww, Zerodha Coin, Kuvera, or directly at hdfcfund.com",
    why: "Stable returns, low credit risk, ideal 1-2 yr horizon",
    extra: "Invests in AAA-rated corporate bonds and G-Secs. Low interest rate risk.",
  },
  {
    name: "ICICI Pru Corporate Bond Fund", type: "Debt MF", risk: "low",
    minRet: 7.0, maxRet: 8.0, minMonths: 18, sip: true,
    aliases: ["icici corporate bond", "icici pru corporate bond", "icici prudential corporate bond"],
    fundHouse: "ICICI Prudential AMC", exchange: "AMFI Registered",
    howToInvest: "Via Groww, Zerodha Coin, or directly at icicipruamc.com",
    why: "Investment-grade bonds, higher yield than pure G-Sec",
    extra: "Minimum 80% in AA+ and above rated corporate bonds. Good for 1.5-3 yr horizon.",
  },
  {
    name: "G-Sec (10-Yr Govt Bond)", type: "Govt Bond", risk: "low",
    minRet: 6.8, maxRet: 7.2, minMonths: 12, sip: false,
    aliases: ["g-sec", "gsec", "g sec", "government bond", "govt bond", "10 year bond"],
    exchange: "NSE / RBI Retail Direct",
    howToInvest: "Via RBI Retail Direct portal (retaildirect.rbi.org.in) or Zerodha/HDFC Securities",
    why: "Zero default risk, backed by Government of India",
    extra: "Yield: ~6.8-7.2% p.a. Fixed coupon paid semi-annually. Sovereign guarantee.",
  },
  {
    name: "RBI Floating Rate Bond", type: "Govt Bond", risk: "low",
    minRet: 8.05, maxRet: 8.05, minMonths: 84, sip: false,
    aliases: ["rbi bond", "rbi floating rate", "rbi floating rate bond 2032"],
    exchange: "Designated Banks",
    howToInvest: "Apply via SBI, HDFC Bank, ICICI Bank, Axis Bank, or Bank of Baroda branches or net banking",
    why: "8.05% GOI-backed, best capital preservation option",
    extra: "7-year tenure. Non-tradeable. Interest paid semi-annually. Suitable for retirees.",
  },
  // MEDIUM RISK
  {
    name: "HDFC Balanced Advantage Fund", type: "Hybrid MF", risk: "medium",
    minRet: 10.0, maxRet: 13.0, minMonths: 36, sip: true,
    aliases: ["hdfc balanced advantage", "hdfc baf", "hdfc balanced"],
    fundHouse: "HDFC AMC", exchange: "AMFI Registered",
    howToInvest: "Via Groww, Zerodha Coin, Kuvera, or directly at hdfcfund.com",
    why: "Dynamic equity-debt allocation, ~11-12% CAGR, lower volatility",
    extra: "Equity allocation varies 30-80% based on market valuation. Good for moderate investors.",
  },
  {
    name: "Gold ETF (Nippon/SBI)", type: "Commodity ETF", risk: "medium",
    minRet: 10.0, maxRet: 13.0, minMonths: 12, sip: true,
    aliases: ["gold etf", "nippon gold etf", "sbi gold etf", "nippon gold", "gold exchange traded fund"],
    exchange: "NSE / BSE",
    howToInvest: "Buy via any demat account (Zerodha, Upstox, Angel One) on NSE/BSE",
    why: "Tracks MCX gold price, ~11-12% 10-yr CAGR, no storage risk",
    extra: "Expense ratio: ~0.3-0.5%. Each unit represents ~1 gram of gold. No purity risk.",
  },
  {
    name: "Sovereign Gold Bond (SGB)", type: "Commodity Bond", risk: "medium",
    minRet: 10.0, maxRet: 14.0, minMonths: 60, sip: false,
    aliases: ["sgb", "sovereign gold bond", "sovereign gold"],
    exchange: "RBI / NSE / BSE",
    howToInvest: "During RBI subscription window via designated banks, brokers, or NSE/BSE online",
    why: "2.5% interest + gold appreciation, tax-free on maturity, RBI-issued",
    extra: "8-yr tenure (exit after 5 yrs). 2.5% annual interest in addition to gold price gains. Capital gains tax-free on maturity.",
  },
  {
    name: "Mirae Asset Large Cap Fund", type: "Large Cap MF", risk: "medium",
    minRet: 12.0, maxRet: 15.0, minMonths: 36, sip: true,
    aliases: ["mirae large cap", "mirae asset large cap", "mirae asset"],
    fundHouse: "Mirae Asset AMC", exchange: "AMFI Registered",
    howToInvest: "Via Groww, Zerodha Coin, Kuvera, or directly at miraeassetmf.co.in",
    why: "Top-rated bluechip fund, ~13-14% CAGR, Nifty 50 + more",
    extra: "Invests in top 100 companies by market cap. Low expense ratio. Consistent 5-star rating.",
  },
  {
    name: "Parag Parikh Flexi Cap Fund", type: "Flexi Cap MF", risk: "medium",
    minRet: 13.0, maxRet: 17.0, minMonths: 36, sip: true,
    aliases: ["parag parikh", "ppfas", "ppfcf", "parag parikh flexi cap", "ppfas flexi cap"],
    fundHouse: "PPFAS AMC", exchange: "AMFI Registered",
    howToInvest: "Via Groww, Zerodha Coin, Kuvera, or directly at amc.ppfas.com",
    why: "Globally diversified, value investing approach, consistent outperformer",
    extra: "Unique: invests ~35% in US tech stocks (ALPHABET, Meta, etc.). Value-focused, low churn. No exit load after 365 days.",
  },
  {
    name: "HDFC Bank", type: "Equity Stock", risk: "medium",
    minRet: 12.0, maxRet: 16.0, minMonths: 36, sip: false,
    aliases: ["hdfc bank stock", "hdfcbank", "hdfc bank nse"],
    exchange: "NSE: HDFCBANK | BSE: 500180",
    sector: "Banking / BFSI",
    roe: "~17%", debtEquity: "Less than 1 (banking)",
    howToInvest: "Buy on NSE/BSE via any demat account (Zerodha, Upstox, Angel One, ICICI Direct)",
    why: "India's largest pvt bank, ROE ~17%, consistent profit growth",
    extra: "Market cap: ~Rs 12 lakh Cr. Strong retail and corporate banking. Merger with HDFC Ltd completed (2023).",
  },
  {
    name: "TCS", type: "Equity Stock", risk: "medium",
    minRet: 13.0, maxRet: 17.0, minMonths: 36, sip: false,
    aliases: ["tata consultancy", "tata consultancy services", "tcs nse", "tcs stock"],
    exchange: "NSE: TCS | BSE: 532540",
    sector: "IT Services",
    roe: "~50%", debtEquity: "Near zero (debt-free)",
    howToInvest: "Buy on NSE/BSE via any demat account (Zerodha, Upstox, Angel One, ICICI Direct)",
    why: "IT bellwether, ROE ~50%, debt-free, strong dividend track record",
    extra: "Largest Indian IT company. ~$29B revenue. Consistent dividend payer. Tata Group backing. Strong order book.",
  },
  {
    name: "Infosys", type: "Equity Stock", risk: "medium",
    minRet: 12.0, maxRet: 16.0, minMonths: 36, sip: false,
    aliases: ["infy", "infosys ltd", "infosys nse", "infosys stock"],
    exchange: "NSE: INFY | BSE: 500209",
    sector: "IT Services",
    roe: "~30%", debtEquity: "Near zero (debt-free)",
    howToInvest: "Buy on NSE/BSE via any demat account (Zerodha, Upstox, Angel One, ICICI Direct)",
    why: "IT leader, ROE ~30%, zero debt, consistent buybacks",
    extra: "2nd largest Indian IT firm. Consistent buyback programs. NYSE listed (ADR: INFY). Strong client retention.",
  },
  // HIGH RISK
  {
    name: "Axis Midcap Fund", type: "Mid Cap MF", risk: "high",
    minRet: 15.0, maxRet: 20.0, minMonths: 60, sip: true,
    aliases: ["axis midcap", "axis mid cap"],
    fundHouse: "Axis AMC", exchange: "AMFI Registered",
    howToInvest: "Via Groww, Zerodha Coin, Kuvera, or directly at axismf.com",
    why: "Midcap 150 CAGR ~17-18% over 10 yrs, needs 5+ yr patience",
    extra: "Invests in companies ranked 101-250 by market cap. High volatility but strong long-term returns.",
  },
  {
    name: "SBI Small Cap Fund", type: "Small Cap MF", risk: "high",
    minRet: 17.0, maxRet: 22.0, minMonths: 60, sip: true,
    aliases: ["sbi small cap", "sbi smallcap", "sbi small cap fund"],
    fundHouse: "SBI Funds Management", exchange: "AMFI Registered",
    howToInvest: "Via Groww, Zerodha Coin, Kuvera, or directly at sbimf.com",
    why: "Highest growth potential, ~20%+ 10-yr CAGR, high short-term swings",
    extra: "Frequently closes for lump sum (high demand). SIP usually open. 5+ year horizon mandatory.",
  },
  {
    name: "Nifty Midcap 150 Index Fund", type: "Index Fund", risk: "high",
    minRet: 15.0, maxRet: 19.0, minMonths: 60, sip: true,
    aliases: ["nifty midcap index", "midcap 150 index fund", "nifty midcap 150"],
    fundHouse: "Multiple AMCs (Motilal, UTI, Nippon)", exchange: "AMFI Registered",
    howToInvest: "Via Groww, Zerodha Coin, or Kuvera - search 'Nifty Midcap 150'",
    why: "Passive mid-cap exposure, low cost (~0.2% TER), ~17% CAGR",
    extra: "Tracks Nifty Midcap 150 index passively. Very low expense ratio vs actively managed funds.",
  },
  {
    name: "Reliance Industries", type: "Equity Stock", risk: "high",
    minRet: 12.0, maxRet: 20.0, minMonths: 36, sip: false,
    aliases: ["ril", "reliance", "jio", "reliance ind", "reliance industries ltd"],
    exchange: "NSE: RELIANCE | BSE: 500325",
    sector: "Conglomerate (Oil, Retail, Telecom)",
    roe: "~10%", debtEquity: "~0.5",
    howToInvest: "Buy on NSE/BSE via any demat account (Zerodha, Upstox, Angel One, ICICI Direct)",
    why: "India's largest co, Jio+Retail growth story, Debt/Eq ~0.5",
    extra: "Diversified across O2C (oil), Jio (telecom), Reliance Retail, and new energy. India's largest company by market cap.",
  },
  {
    name: "L&T", type: "Equity Stock", risk: "high",
    minRet: 13.0, maxRet: 18.0, minMonths: 36, sip: false,
    aliases: ["larsen toubro", "larsen and toubro", "l and t", "lt", "l&t stock"],
    exchange: "NSE: LT | BSE: 500510",
    sector: "Infrastructure / Engineering",
    roe: "~16%", debtEquity: "~1.5 (project-based, expected)",
    howToInvest: "Buy on NSE/BSE via any demat account (Zerodha, Upstox, Angel One, ICICI Direct)",
    why: "Infrastructure giant, strong order book, capex cycle beneficiary",
    extra: "India's largest engineering & construction conglomerate. Benefits from government infra push. Strong 5-yr order pipeline.",
  },
];

// ─── Portfolio Templates ───────────────────────────────────────────────────────
const TEMPLATES = {
  low: [
    { match: a => ["Liquid MF", "Debt MF", "Govt Bond"].includes(a.type), weight: 65 },
    { match: a => a.type === "Hybrid MF",                                  weight: 20 },
    { match: a => ["Commodity ETF", "Commodity Bond"].includes(a.type),    weight: 15 },
  ],
  medium: [
    { match: a => ["Large Cap MF", "Flexi Cap MF"].includes(a.type),       weight: 35 },
    { match: a => a.type === "Hybrid MF",                                  weight: 25 },
    { match: a => ["Debt MF", "Govt Bond"].includes(a.type),               weight: 20 },
    { match: a => ["Commodity ETF", "Commodity Bond"].includes(a.type),    weight: 10 },
    { match: a => ["Mid Cap MF", "Index Fund"].includes(a.type),           weight: 10 },
  ],
  high: [
    { match: a => ["Mid Cap MF", "Index Fund"].includes(a.type),           weight: 30 },
    { match: a => a.type === "Small Cap MF",                               weight: 25 },
    { match: a => ["Large Cap MF", "Flexi Cap MF"].includes(a.type),       weight: 20 },
    { match: a => a.type === "Commodity ETF",                              weight: 15 },
    { match: a => ["Debt MF", "Govt Bond"].includes(a.type),               weight: 10 },
  ],
};

// ─── Specific Asset Lookup ─────────────────────────────────────────────────────
// ─── Sector & Stock Detection ──────────────────────────────────────────────────
function detectSector(text) {
  const t = text.toLowerCase();
  // Check multi-word keys first (longer matches take priority)
  const keys = Object.keys(SECTOR_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (t.includes(key)) return SECTOR_KEYWORDS[key];
  }
  return null;
}

function detectSpecificStock(text) {
  const t = text.toLowerCase();
  for (const stock of INDIAN_STOCKS) {
    if (t.includes(stock.name.toLowerCase())) return stock;
    if (t.includes(stock.symbol.toLowerCase())) return stock;
  }
  return null;
}

function detectSpecificIndex(text) {
  const t = text.toLowerCase();
  // Pass 1: name match (longest names first — "NIFTY Bank" before "NIFTY 50")
  const byName = [...INDIAN_INDICES].sort((a, b) => b.name.length - a.name.length);
  for (const idx of byName) {
    if (t.includes(idx.name.toLowerCase())) return idx;
  }
  // Pass 2: symbol match (longest symbols first — "NIFTYIT" before "NIFTY")
  const bySymbol = [...INDIAN_INDICES].sort((a, b) => b.symbol.length - a.symbol.length);
  for (const idx of bySymbol) {
    if (t.includes(idx.symbol.toLowerCase())) return idx;
  }
  return null;
}

function detectSpecificAsset(text) {
  const t = text.toLowerCase();
  for (const asset of ASSETS) {
    if (t.includes(asset.name.toLowerCase())) return asset;
    if (asset.aliases?.some(alias => t.includes(alias.toLowerCase()))) return asset;
  }
  return null;
}

function buildAssetDetailResponse(asset) {
  const isStock = asset.type === "Equity Stock";
  const isMF = asset.type.includes("MF") || asset.type === "Index Fund";
  const isBond = asset.type.includes("Bond");
  const isETF = asset.type === "Commodity ETF";

  let out = `**${asset.name}**\n`;
  out += `*${asset.type} | ${asset.exchange}*\n\n`;

  out += `**Key Details:**\n\n`;
  out += `| Field | Value |\n`;
  out += `|-------|-------|\n`;
  out += `| Risk Level | **${cap(asset.risk)}** |\n`;
  out += `| Expected Return | ${asset.minRet}-${asset.maxRet}% p.a. |\n`;
  out += `| Min. Recommended Horizon | ${asset.minMonths < 12 ? asset.minMonths + " months" : (asset.minMonths / 12) + " years"} |\n`;
  out += `| SIP Available | ${asset.sip ? "Yes - min Rs 500/month" : "No (lump sum only)"} |\n`;

  if (isStock) {
    out += `| Sector | ${asset.sector} |\n`;
    out += `| ROE | ${asset.roe} |\n`;
    out += `| Debt/Equity | ${asset.debtEquity} |\n`;
  }
  if (isMF || isETF) {
    if (asset.fundHouse) out += `| Fund House | ${asset.fundHouse} |\n`;
  }

  out += `\n**Why Invest:**\n${asset.why}\n`;

  if (asset.extra) {
    out += `\n**Key Facts:**\n${asset.extra}\n`;
  }

  out += `\n**How to Invest:**\n${asset.howToInvest}\n`;

  out += `\n*Want a full portfolio recommendation? Tell me your amount, time horizon, and risk tolerance.*`;
  out += DISCLAIMER;
  return out;
}

// ─── Stock / Index Response Builders ─────────────────────────────────────────
function buildStockDetailResponse(stock) {
  let out = `**${stock.name}**\n`;
  out += `*${stock.cap} | ${stock.sector}*\n\n`;
  out += `| Field | Value |\n`;
  out += `|-------|-------|\n`;
  out += `| NSE Symbol | **${stock.symbol}** |\n`;
  out += `| BSE Code | ${stock.bse} |\n`;
  out += `| Market Cap Tier | ${stock.cap} |\n`;
  out += `| Sector | ${stock.sector} |\n`;
  out += `\n**About:** ${stock.desc}\n`;
  out += `\n**How to Invest:** Buy on NSE/BSE via any demat account (Zerodha, Upstox, Angel One, ICICI Direct, HDFC Sky).\n`;
  out += `\n*For return estimates and portfolio fit, check if this stock is in our investment assets database, or ask "Suggest investments for [amount, horizon, risk]".*`;
  out += DISCLAIMER;
  return out;
}

function buildIndexDetailResponse(idx) {
  let out = `**${idx.name}** (${idx.symbol})\n`;
  out += `*${idx.category} | ${idx.exchange}*\n\n`;
  out += `| Field | Value |\n`;
  out += `|-------|-------|\n`;
  out += `| Exchange | ${idx.exchange} |\n`;
  out += `| Components | ${idx.components > 0 ? idx.components + " stocks" : "Volatility measure"} |\n`;
  out += `| Category | ${idx.category} |\n`;
  if (idx.cagr !== "N/A") out += `| Historical CAGR | ${idx.cagr} p.a. |\n`;
  out += `\n**About:** ${idx.desc}\n`;
  if (idx.cagr !== "N/A") {
    out += `\n**How to Invest in this index:** You cannot buy the index directly. Invest via Index Mutual Funds or ETFs that track this index. Search for "${idx.name} Index Fund" or "${idx.name} ETF" on Groww or Zerodha Coin.\n`;
  }
  out += `\n*Ask "Show me Indian Indices" to see all available indices.*`;
  return out;
}

function buildSectorStocksResponse(sector) {
  const stocks = INDIAN_STOCKS.filter(s => s.sector === sector);
  if (!stocks.length) return `No stocks found for sector: ${sector}`;

  let out = `**${sector} - All Stocks**\n\n`;
  out += `| Company | NSE Symbol | BSE Code | Cap | Description |\n`;
  out += `|---------|------------|----------|-----|-------------|\n`;
  for (const s of stocks) {
    out += `| **${s.name}** | ${s.symbol} | ${s.bse} | ${s.cap} | ${s.desc} |\n`;
  }
  out += `\n*${stocks.length} stocks listed. Ask "Tell me about [company name]" for details on any stock.*`;
  out += `\n*To go back: "Show sectors" | For indices: "Show Indian Indices"*`;
  return out;
}

function buildSectorMenuResponse() {
  let out = `**Indian Equities - Choose a Sector**\n\n`;
  out += `We cover stocks across ${SECTORS.length} sectors on NSE and BSE. Select a sector to view all stocks:\n\n`;
  out += `| # | Sector | Stocks Available |\n`;
  out += `|---|--------|------------------|\n`;
  for (let i = 0; i < SECTORS.length; i++) {
    const count = INDIAN_STOCKS.filter(s => s.sector === SECTORS[i]).length;
    out += `| ${i + 1} | **${SECTORS[i]}** | ${count} stocks |\n`;
  }
  out += `\n*Just type the sector name, e.g., "Banking stocks", "IT sector", "Pharma stocks"*`;
  out += `\n*Total: ${INDIAN_STOCKS.length} stocks across all sectors*`;
  return out;
}

function buildIndicesResponse() {
  const categories = [...new Set(INDIAN_INDICES.map(i => i.category))];
  let out = `**Indian Indices - Complete List**\n\n`;

  for (const cat of categories) {
    const indices = INDIAN_INDICES.filter(i => i.category === cat);
    out += `**${cat}**\n\n`;
    out += `| Index | Symbol | Exchange | Components | CAGR |\n`;
    out += `|-------|--------|----------|------------|------|\n`;
    for (const idx of indices) {
      out += `| **${idx.name}** | ${idx.symbol} | ${idx.exchange} | ${idx.components > 0 ? idx.components : "-"} | ${idx.cagr} |\n`;
    }
    out += "\n";
  }

  out += `*${INDIAN_INDICES.length} indices listed. Ask "Tell me about [index name]" for details on any index.*`;
  out += `\n*To invest in an index: use Index Mutual Funds or ETFs. Ask "What is ETF?" for more.*`;
  return out;
}

// ─── Category Asset Listing ────────────────────────────────────────────────────
function listAssetsByCategory(filter, heading) {
  const assets = ASSETS.filter(filter);
  if (!assets.length) return "";

  let out = `\n\n**${heading}**\n\n`;
  out += `| Asset | Type | Risk | Expected Return | SIP |\n`;
  out += `|-------|------|------|----------------|-----|\n`;
  for (const a of assets) {
    out += `| **${a.name}** | ${a.type} | ${cap(a.risk)} | ${a.minRet}-${a.maxRet}% p.a. | ${a.sip ? "Yes" : "No"} |\n`;
  }
  out += `\n*Ask about any specific asset for full details, e.g., "Tell me about ${assets[0].name}"*`;
  return out;
}

// ─── Entity Parsers ────────────────────────────────────────────────────────────
function parseAmount(text) {
  const t = text.replace(/,/g, "");
  let m;
  m = t.match(/(?:rs\.?|inr|₹)?\s*([\d.]+)\s*(?:crore|cr)\b/i);
  if (m) return parseFloat(m[1]) * 1e7;
  m = t.match(/(?:rs\.?|inr|₹)?\s*([\d.]+)\s*(?:lakh|lacs?|lac)\b/i);
  if (m) return parseFloat(m[1]) * 1e5;
  m = t.match(/(?:rs\.?|inr|₹)?\s*([\d.]+)\s*k\b/i);
  if (m) return parseFloat(m[1]) * 1000;
  m = t.match(/(?:rs\.?|inr|₹)?\s*([\d.]+)\s*thousand\b/i);
  if (m) return parseFloat(m[1]) * 1000;
  m = t.match(/(?:rs\.?|inr|₹)\s*([\d]+)/i);
  if (m) return parseFloat(m[1]);
  m = t.match(/(?<![%yr])\b(\d{5,})\b/);
  if (m) return parseFloat(m[1]);
  return null;
}

function parseHorizon(text) {
  const t = text.toLowerCase();
  if (/long.?term|very long/i.test(t)) return 84;
  if (/medium.?term/i.test(t)) return 36;
  if (/short.?term/i.test(t)) return 12;
  let m;
  m = t.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/);
  if (m) return Math.round(parseFloat(m[1]) * 12);
  m = t.match(/(\d+)\s*months?\b/);
  if (m) return parseInt(m[1]);
  return null;
}

function parseRisk(text) {
  const t = text.toLowerCase();
  if (/\b(low.?risk|safe|conservative|capital.?protect|no.?risk|very safe|secure)\b/.test(t)) return "low";
  if (/\b(high.?risk|aggressive|maximum.?return|high.?return|high.?growth|speculative)\b/.test(t)) return "high";
  if (/\b(medium.?risk|moderate|balanced|medium risk|moderate risk)\b/.test(t) || /\bmedium\b/.test(t)) return "medium";
  return null;
}

function parseMode(text) {
  const t = text.toLowerCase();
  if (/\b(sip|systematic|monthly investment|per month|every month|monthly sip|monthly basis)\b/.test(t)) return "sip";
  if (/\b(lump.?sum|lumpsum|one.?time|onetime|bulk|single invest|at once)\b/.test(t)) return "lumpsum";
  return null;
}

function parseTargetReturn(text) {
  const m = text.match(/(\d+(?:\.\d+)?)\s*%/i);
  return m ? parseFloat(m[1]) : null;
}

function extractEntities(text) {
  return {
    amount: parseAmount(text),
    horizonMonths: parseHorizon(text),
    risk: parseRisk(text),
    mode: parseMode(text),
    targetReturn: parseTargetReturn(text),
  };
}

function mergeEntities(...sets) {
  const merged = {};
  for (const set of sets) {
    for (const [k, v] of Object.entries(set)) {
      if (v !== null && v !== undefined && merged[k] == null) merged[k] = v;
    }
  }
  return merged;
}

// ─── Intent Classifier ────────────────────────────────────────────────────────
function classifyIntent(text) {
  const t = text.toLowerCase().trim();

  if (/^(hi|hello|hey|namaste|namaskar|good\s*(morning|evening|afternoon|day)|howdy|hola|greetings)\b/.test(t)) return "greeting";
  if (/\b(thank(s| you)|thx|ty|great job|well done|awesome|perfect|excellent|very helpful)\b/.test(t)) return "thanks";
  if (/\b(futures?|f&o|f and o|derivatives?|call option|put option|nifty.{0,10}options?|index options?)\b/.test(t)) return "fno";
  if (/\b(help|what can you do|your features|capabilities|how to use|what do you do|how do i use)\b/.test(t)) return "help";

  if (/\b(what is|what are|explain|tell me about|how does|how do|define|meaning of|describe)\b/.test(t)) {
    if (/\bsip\s*(vs?\.?|versus|or)\s*(lump|one.?time)/i.test(t) || /\b(lump|one.?time)\s*(vs?\.?|versus|or)\s*sip/i.test(t)) return "info_sip_vs_lump";
    if (/\bsip\b/.test(t)) return "info_sip";
    if (/\bnifty\b/.test(t)) return "info_nifty";
    if (/\bsensex\b/.test(t)) return "info_sensex";
    if (/\bmutual.?fund\b/.test(t)) return "info_mf";
    if (/\b(equity|stock|share market)\b/.test(t)) return "info_stock";
    if (/\b(bond|debt fund|g.?sec|government bond|debenture)\b/.test(t)) return "info_bond";
    if (/\b(gold|silver|commodity|mcx)\b/.test(t)) return "info_gold";
    if (/\b(fd|fixed.?deposit)\b/.test(t)) return "info_fd";
    if (/\b(sgb|sovereign.?gold.?bond)\b/.test(t)) return "info_sgb";
    if (/\b(etf|exchange.?traded.?fund)\b/.test(t)) return "info_etf";
    if (/\blump.?sum\b/.test(t)) return "info_lumpsum";
    if (/\bcagr\b/.test(t)) return "info_cagr";
    if (/\bnav\b/.test(t)) return "info_nav";
  }

  if (/\b(sip vs|vs sip|compare sip|sip or lump|lump or sip)\b/.test(t)) return "info_sip_vs_lump";

  // Indian Indices
  if (/\b(indian indices|india indices|show indices|list indices|all indices|nse indices|bse indices|market indices|indices list|index list)\b/i.test(t) ||
      /\b(show|list|all|available).{0,15}indic/i.test(t)) return "list_indices";

  // Indian Equities - sector menu
  if (/\b(indian equities|india equities|indian stocks|india stocks|nse stocks|bse stocks|all stocks|stock market|equity market|show equities|list equities)\b/i.test(t) ||
      /\b(show|list|browse).{0,10}(equit|stock)/i.test(t)) return "list_equity_sectors";

  // Show/list category queries
  if (/\b(show|list|all|available|what).{0,20}(mutual fund|mf)\b/i.test(t) || /\b(mutual fund|mf).{0,10}(option|list|available|you have)\b/i.test(t)) return "list_mf";
  if (/\b(show|list|all|available|what).{0,20}(bond|debt)\b/i.test(t) || /\b(bond|debt).{0,10}(option|list|available|you have)\b/i.test(t)) return "list_bond";
  if (/\b(show|list|all|available|what).{0,20}(gold|commodity)\b/i.test(t)) return "list_gold";
  if (/\b(show|list|all).{0,20}(asset|option|investment)\b/i.test(t) || /\ball (asset|option|investment)/i.test(t)) return "list_all";

  // Investment query
  const hasAmount = parseAmount(text) !== null;
  const hasInvestKeyword = /\b(invest|portfolio|allocation|return|risk|sip|lump|horizon|suggest|recommend|plan|where to put|put my money)\b/.test(t);
  if (hasAmount || hasInvestKeyword) return "investment_query";

  return "unclear";
}

// ─── Clarifying Questions ──────────────────────────────────────────────────────
function askAmount() {
  return `I need your **investment amount** to suggest the right portfolio. How much are you looking to invest?

- **Small** - Rs 10,000 to Rs 50,000 (good for liquid funds, debt MFs, ETFs)
- **Medium** - Rs 50,000 to Rs 5 lakh (access to most MFs and stocks)
- **Large** - Rs 5 lakh and above (full diversification possible)

*Just type your amount, e.g., "I want to invest Rs 1 lakh"*`;
}

function askHorizon() {
  return `How long do you plan to stay invested? Your time horizon shapes the entire strategy.

- **Short term** - 1 to 2 years (liquid funds, debt MFs, FDs - safe and stable)
- **Medium term** - 3 to 5 years (hybrid MFs, large cap equity, gold)
- **Long term** - 5 years and above (equity MFs, small/mid cap, stocks - higher growth)

*Reply with your horizon, e.g., "3 years" or "18 months"*`;
}

function askRisk() {
  return `What is your **risk tolerance**? This determines the kind of investments that suit you.

- **Low** - Capital safety is priority. Govt bonds, FDs, debt MFs. Returns: ~7-8% p.a.
- **Medium** - Balanced growth with moderate risk. Hybrid MFs, large cap, gold. Returns: ~11-14% p.a.
- **High** - Maximum growth, willing to absorb short-term swings. Mid/small cap MFs, stocks. Returns: ~15-20% p.a.

*Reply with your choice, e.g., "medium risk" or just "medium"*`;
}

// ─── Investment Recommendation Engine ─────────────────────────────────────────
function buildPortfolio(risk, horizonMonths, mode, amount, targetReturn) {
  const isSip = mode === "sip";
  const effectiveRisk = horizonMonths < 12 ? "low" :
                        horizonMonths < 24 ? (risk === "high" ? "medium" : risk) :
                        risk;

  const eligible = ASSETS.filter(a => {
    const horizonOk = a.minMonths <= horizonMonths;
    const modeOk = isSip ? a.sip : true;
    const returnOk = targetReturn ? a.maxRet >= targetReturn * 0.85 : true;
    const riskOk = a.risk === effectiveRisk ||
                   (effectiveRisk === "medium" && a.risk === "low") ||
                   (effectiveRisk === "high" && a.risk !== "low");
    return horizonOk && modeOk && returnOk && riskOk;
  });

  if (eligible.length === 0) return [];

  const template = TEMPLATES[effectiveRisk] || TEMPLATES.medium;
  const result = [];

  for (const bucket of template) {
    const candidates = eligible.filter(a => bucket.match(a));
    if (candidates.length === 0) continue;
    const best = candidates.sort((a, b) => {
      const aAvg = avg(a.minRet, a.maxRet) - (a.type.includes("Stock") ? 1.5 : 0);
      const bAvg = avg(b.minRet, b.maxRet) - (b.type.includes("Stock") ? 1.5 : 0);
      return bAvg - aAvg;
    })[0];
    result.push({ ...best, weight: bucket.weight, allotment: Math.round(amount * bucket.weight / 100) });
  }

  return result;
}

function projectLumpsum(amount, ratePercent, months) {
  return amount * Math.pow(1 + ratePercent / 100 / 12, months);
}

function projectSip(monthlyAmount, ratePercent, months) {
  const r = ratePercent / 100 / 12;
  return monthlyAmount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

function buildInvestmentResponse(entities, marketContext) {
  const { amount, horizonMonths, risk, mode, targetReturn } = entities;

  if (!amount) return askAmount();
  if (!horizonMonths) return askHorizon();
  if (!risk) return askRisk();

  const effectiveMode = mode || "lumpsum";
  const isSip = effectiveMode === "sip";
  const portfolio = buildPortfolio(risk, horizonMonths, effectiveMode, amount, targetReturn);

  if (portfolio.length === 0) {
    return `Based on your parameters, the safest option for a **${horizonMonths}-month** horizon with **${risk} risk** is a **Liquid Mutual Fund** (e.g., Axis Liquid Fund) returning ~6.5-7% p.a., better than a savings account with instant redemption.${DISCLAIMER}`;
  }

  const years = (horizonMonths / 12).toFixed(1).replace(".0", "");
  const modeLabel = isSip
    ? `Rs ${amount.toLocaleString("en-IN")}/month (SIP)`
    : fmt(amount) + " (Lump Sum)";
  const totalInvested = isSip ? amount * horizonMonths : amount;

  let out = `**Your Investment Summary**\n`;
  out += `- Amount: **${modeLabel}**\n`;
  if (isSip) out += `- Total invested over ${years} yr${years !== "1" ? "s" : ""}: **${fmt(totalInvested)}**\n`;
  out += `- Horizon: **${years} year${years !== "1" ? "s" : ""}** (${horizonMonths} months)\n`;
  out += `- Risk Profile: **${cap(risk)}**\n`;
  if (targetReturn) out += `- Target Return: **${targetReturn}% p.a.**\n`;
  if (marketContext) out += `\n*Live Market: ${marketContext}*\n`;

  out += `\n---\n**Recommended Portfolio**\n\n`;
  out += `| Asset | Type | Expected Return | Risk | Why | Allocation |\n`;
  out += `|-------|------|----------------|------|-----|------------|\n`;
  for (const p of portfolio) {
    out += `| **${p.name}** | ${p.type} | ${p.minRet}-${p.maxRet}% p.a. | ${cap(p.risk)} | ${p.why} | ${p.weight}% (${fmt(p.allotment)}) |\n`;
  }

  const conservativeRate = risk === "low" ? 7 : risk === "medium" ? 11 : 15;
  const optimisticRate   = risk === "low" ? 8 : risk === "medium" ? 14 : 19;
  const conservativeValue = isSip ? projectSip(amount, conservativeRate, horizonMonths) : projectLumpsum(amount, conservativeRate, horizonMonths);
  const optimisticValue   = isSip ? projectSip(amount, optimisticRate, horizonMonths)   : projectLumpsum(amount, optimisticRate, horizonMonths);

  out += `\n---\n**Projected Returns** (approximate, based on historical CAGR)\n\n`;
  out += `| Scenario | Rate | Projected Value |\n`;
  out += `|----------|------|-----------------|\n`;
  out += `| Conservative | ${conservativeRate}% p.a. | **${fmt(conservativeValue)}** |\n`;
  out += `| Optimistic | ${optimisticRate}% p.a. | **${fmt(optimisticValue)}** |\n`;
  out += `\n*Invested: ${fmt(totalInvested)} | Potential gain: ${fmt(Math.abs(conservativeValue - totalInvested))} to ${fmt(Math.abs(optimisticValue - totalInvested))}*\n`;

  if (isSip) {
    out += `\n> **SIP Tip:** Set up SIP via Groww, Zerodha Coin, Kuvera, or MFCentral. Minimum SIP starts at Rs 500/month for most funds above.\n`;
  }

  out += `\n*Ask "Tell me about [asset name]" for detailed info on any of the above options.*`;
  out += DISCLAIMER;
  return out;
}

// ─── Info Response Library ────────────────────────────────────────────────────
const INFO = {
  greeting: () => `Hello! I'm **InvestBot**, your Indian markets investment assistant. I can help you:

- Get **personalised investment suggestions** (stocks, mutual funds, bonds, gold)
- Learn about **investment concepts** (SIP, NIFTY, CAGR, etc.)
- Compare investment options for Indian markets (NSE, BSE, MCX)

Tell me your investment details and I'll suggest a portfolio!

*Example: "I want to invest Rs 50,000 for 2 years with medium risk"*`,

  help: () => `**What I can do:**

**Investment Suggestions**
- Portfolio recommendations based on your amount, horizon, and risk profile
- Covers Mutual Funds, Stocks (NSE), Govt Bonds, Gold, ETFs
- Supports both SIP and Lump Sum modes

**Asset Details**
- Ask "Tell me about [asset]" for specific info on any asset
- Ask "Show me all mutual funds" or "List all stocks" for a category overview

**Information**
- Explain concepts: SIP, CAGR, NAV, NIFTY, Sensex, ETF, SGB, etc.
- Compare investment types (SIP vs Lump Sum, Equity vs Debt, etc.)

**What I avoid**
- Futures and Options (F&O) - outside my scope
- Guaranteed return promises - markets have risk!

*Try: "Suggest investments for Rs 1 lakh, 3 years, medium risk"*`,

  fno: () => `Sorry, I can't help with **Futures and Options (F&O)** at this moment.

F&O are complex derivative instruments with high risk and require deep market expertise. Please consult a SEBI-registered derivatives advisor or a broker like Zerodha or Upstox for F&O guidance.

I can help you with **Mutual Funds, Stocks, Bonds, and Gold investments** instead!`,

  thanks: () => `Happy to help! Feel free to ask anytime if you need investment ideas or have questions about Indian markets. Good luck with your investments!`,

  unclear: () => `I did not quite catch that. I am best at:

- **Investment suggestions** - e.g., "Invest Rs 1 lakh for 2 years, medium risk"
- **Specific asset info** - e.g., "Tell me about TCS" or "Tell me about SBI Small Cap Fund"
- **Category listing** - e.g., "Show me all mutual funds" or "List all stocks"
- **Concept explanations** - e.g., "What is SIP?" or "Explain NIFTY"

What would you like to know?`,

  list_mf: () => {
    const mfs = ASSETS.filter(a => a.type.includes("MF") || a.type === "Index Fund");
    let out = `**All Mutual Funds in Our Database**\n\n`;
    out += `| Asset | Type | Risk | Return Range | Min Horizon | SIP |\n`;
    out += `|-------|------|------|-------------|-------------|-----|\n`;
    for (const a of mfs) {
      const horizon = a.minMonths < 12 ? a.minMonths + " mo" : (a.minMonths / 12) + " yr";
      out += `| **${a.name}** | ${a.type} | ${cap(a.risk)} | ${a.minRet}-${a.maxRet}% p.a. | ${horizon} | ${a.sip ? "Yes" : "No"} |\n`;
    }
    out += `\n*Ask "Tell me about [fund name]" for full details on any fund.*`;
    return out;
  },

  list_stock: () => {
    const stocks = ASSETS.filter(a => a.type === "Equity Stock");
    let out = `**All Stocks in Our Database**\n\n`;
    out += `| Stock | Exchange | Sector | Risk | Return Range | Min Horizon |\n`;
    out += `|-------|---------|--------|------|-------------|-------------|\n`;
    for (const a of stocks) {
      const horizon = a.minMonths / 12 + " yr";
      out += `| **${a.name}** | ${a.exchange} | ${a.sector} | ${cap(a.risk)} | ${a.minRet}-${a.maxRet}% p.a. | ${horizon} |\n`;
    }
    out += `\n*Ask "Tell me about [stock name]" for full details including ROE, Debt/Equity, and how to invest.*`;
    return out;
  },

  list_bond: () => {
    const bonds = ASSETS.filter(a => a.type.includes("Bond") || a.type === "Debt MF" || a.type === "Govt Bond" || a.type === "Liquid MF");
    let out = `**All Debt / Bond Options in Our Database**\n\n`;
    out += `| Asset | Type | Risk | Return Range | Min Horizon | SIP |\n`;
    out += `|-------|------|------|-------------|-------------|-----|\n`;
    for (const a of bonds) {
      const horizon = a.minMonths < 12 ? a.minMonths + " mo" : (a.minMonths / 12) + " yr";
      out += `| **${a.name}** | ${a.type} | ${cap(a.risk)} | ${a.minRet}-${a.maxRet}% p.a. | ${horizon} | ${a.sip ? "Yes" : "No"} |\n`;
    }
    out += `\n*Ask "Tell me about [asset name]" for full details on any option.*`;
    return out;
  },

  list_gold: () => {
    const gold = ASSETS.filter(a => a.type === "Commodity ETF" || a.type === "Commodity Bond");
    let out = `**All Gold / Commodity Options in Our Database**\n\n`;
    out += `| Asset | Type | Risk | Return Range | Min Horizon | SIP |\n`;
    out += `|-------|------|------|-------------|-------------|-----|\n`;
    for (const a of gold) {
      const horizon = a.minMonths < 12 ? a.minMonths + " mo" : (a.minMonths / 12) + " yr";
      out += `| **${a.name}** | ${a.type} | ${cap(a.risk)} | ${a.minRet}-${a.maxRet}% p.a. | ${horizon} | ${a.sip ? "Yes" : "No"} |\n`;
    }
    out += `\n*Ask "Tell me about Gold ETF" or "Tell me about SGB" for full details.*`;
    return out;
  },

  list_all: () => {
    let out = `**All Assets in Our Database (${ASSETS.length} total)**\n\n`;
    out += `| Asset | Type | Risk | Return Range | SIP |\n`;
    out += `|-------|------|------|-------------|-----|\n`;
    for (const a of ASSETS) {
      out += `| **${a.name}** | ${a.type} | ${cap(a.risk)} | ${a.minRet}-${a.maxRet}% p.a. | ${a.sip ? "Yes" : "No"} |\n`;
    }
    out += `\n*Ask "Tell me about [asset name]" for full details on any specific asset.*`;
    out += `\n*For stocks by sector: "Show Indian Equities" | For indices: "Show Indian Indices"*`;
    return out;
  },

  list_indices: () => buildIndicesResponse(),
  list_equity_sectors: () => buildSectorMenuResponse(),

  info_sip: () => `**What is SIP (Systematic Investment Plan)?**

A SIP is a way to invest a **fixed amount regularly** (usually monthly) into a mutual fund.

**How it works:**
- You set up an auto-debit of say Rs 5,000/month
- The money buys MF units at the current NAV (price)
- Over time, you accumulate units across market highs and lows

**Key Benefits:**
| Benefit | Detail |
|---------|--------|
| Rupee Cost Averaging | Buy more units when market is low, fewer when high |
| Discipline | Automatic, no emotional decisions |
| Compounding | Returns compound over time |
| Low entry | Start from as low as Rs 500/month |
| Flexible | Pause, increase, or stop anytime |

**Example:** Rs 5,000/month SIP in a large cap fund for 10 years at ~13% CAGR gives approximately **Rs 12 lakh** (invested Rs 6 lakh, gain Rs 6 lakh)

SIP is ideal for salaried individuals with monthly cash flow.`
  + listAssetsByCategory(a => a.sip && (a.type.includes("MF") || a.type === "Index Fund"), "Mutual Funds That Support SIP"),

  info_lumpsum: () => `**What is Lump Sum Investment?**

A lump sum investment means putting a **single, one-time amount** into an investment at once.

**Best for:**
- Receiving a bonus, inheritance, or asset sale proceeds
- When markets are at a correction or dip (buy low)
- Long-term goals where time in market matters more than timing

**Comparison with SIP:**
| | Lump Sum | SIP |
|--|---------|-----|
| Amount | One-time large | Regular small |
| Risk | Higher (timing risk) | Lower (averaged out) |
| Returns | Higher if timed well | Consistent |
| Best for | Windfall amounts | Regular income |

**Rule of thumb:** Use **SIP for regular income**, **lump sum for bonus or windfall**.`,

  info_sip_vs_lump: () => `**SIP vs Lump Sum - Which is Better?**

| Factor | SIP | Lump Sum |
|--------|-----|----------|
| Entry | Staggered (monthly) | Single entry |
| Timing risk | Low (averaged) | High |
| Ideal for | Regular salary | Bonus/windfall |
| Rupee cost avg | Yes | No |
| Compounding | From each installment | From day 1 on full amount |
| Market timing | Not needed | Matters a lot |
| Minimum amount | Rs 500/month | Usually Rs 5,000+ |

**Verdict:**
- **Falling markets** - Lump sum wins (buy more at low price)
- **Rising or uncertain markets** - SIP wins (spread the risk)
- **Regular income** - Always SIP
- **Large one-time amount** - Split: 30% lump sum now + rest via SIP over 6-12 months`,

  info_nifty: () => `**What is NIFTY?**

NIFTY (National Index Fifty) is India's most tracked **stock market index**, managed by NSE (National Stock Exchange).

**Key facts:**
- Contains **top 50 companies** by market cap listed on NSE
- Represents ~65% of NSE's total market cap
- Base year: 1995, base value: 1,000

**Historical performance:**
| Period | CAGR |
|--------|------|
| 10-year | ~13-14% |
| 5-year | ~12-15% |
| 1-year | Varies |

**Related indices:**
- **NIFTY Next 50** - next 50 companies after NIFTY 50
- **NIFTY Midcap 150** - ~17-18% CAGR historically
- **NIFTY Bank, IT, Pharma** - sectoral indices

You can invest in NIFTY 50 via **Index Mutual Funds** or **ETFs** (e.g., Nippon NIFTY 50 ETF, UTI Nifty Index Fund).`,

  info_sensex: () => `**What is SENSEX?**

SENSEX (Sensitive Index) is India's oldest stock market index, managed by **BSE (Bombay Stock Exchange)**.

**Key facts:**
- Contains **top 30 companies** by market cap on BSE
- Base year: 1978-79, base value: 100
- Usually moves in tandem with NIFTY 50

**NIFTY vs SENSEX:**
| | NIFTY 50 | SENSEX |
|--|---------|--------|
| Exchange | NSE | BSE |
| Companies | 50 | 30 |
| Base | 1,000 (1995) | 100 (1979) |
| More popular for | Derivatives | Historical reference |

Both indices represent the health of the Indian stock market.`,

  info_mf: () => `**What is a Mutual Fund?**

A mutual fund pools money from many investors and invests it in stocks, bonds, or other assets, managed by a professional fund manager.

**Types:**
| Type | Risk | Returns | Ideal Horizon |
|------|------|---------|--------------|
| Liquid / Debt | Low | 6-8% | Less than 1 year |
| Hybrid | Medium | 10-13% | 2-3 years |
| Large Cap Equity | Medium | 12-15% | 3+ years |
| Mid/Small Cap | High | 15-22% | 5+ years |

**How to invest:** AMFI-registered platforms - Groww, Zerodha Coin, Kuvera, Paytm Money, or directly via AMC websites.

**Key terms:**
- **NAV** - Net Asset Value (price per unit)
- **CAGR** - Compounded Annual Growth Rate
- **ELSS** - Equity Linked Savings Scheme (tax-saving MF under 80C)`
  + listAssetsByCategory(a => a.type.includes("MF") || a.type === "Index Fund", "All Available Mutual Funds"),

  info_stock: () => `**What is Stock/Equity Investment?**

Buying a stock means buying a **small ownership share** of a company listed on NSE/BSE.

**Key metrics for picking stocks:**
| Metric | Good Value |
|--------|-----------|
| ROE (Return on Equity) | Greater than 15% |
| Debt/Equity Ratio | Less than 1 |
| P/E Ratio | Compare with sector average |
| Revenue Growth | Consistent year on year |`
  + listAssetsByCategory(a => a.type === "Equity Stock", "All Available Stocks")
  + `\n\n**Risk:** Individual stocks are riskier than MFs. Recommended only for 3+ year horizon.`,

  info_bond: () => `**What are Bonds / Debt Investments?**

Bonds are loans you give to government or corporations. They pay you **fixed interest** (called coupon) and return the principal at maturity.

**Types in India:**
| Type | Issuer | Yield | Safety |
|------|--------|-------|--------|
| G-Sec (Govt Securities) | RBI/Govt | 6.8-7.2% | Highest |
| RBI Floating Rate Bond | RBI | 8.05% | Highest |
| PSU Bonds | Govt companies | 7-8% | Very High |
| Corporate Bonds | Private cos | 7.5-9% | High-Medium |
| Debt Mutual Funds | AMC (managed) | 6.5-8% | High |

**Best for:** Capital preservation, retirees, short-term parking of funds.`
  + listAssetsByCategory(a => ["Debt MF", "Govt Bond", "Liquid MF"].includes(a.type), "All Available Debt / Bond Options"),

  info_gold: () => `**Gold Investment in India**

**10-year CAGR of gold (MCX): ~11-12% p.a.**

**Ways to invest in gold:**
| Option | Pros | Cons |
|--------|------|------|
| Physical Gold | Tangible | Storage risk, GST, making charges |
| Gold ETF | Exchange-traded, no storage | Demat account needed |
| Sovereign Gold Bond (SGB) | 2.5% interest + price gain, tax-free on maturity | 8-yr lock-in (5-yr early exit) |
| Gold Mutual Fund | No demat needed, SIP possible | Slightly higher cost |

**Best option: SGB (Sovereign Gold Bond)**
- Issued by RBI
- 2.5% annual interest (paid semi-annually)
- Capital gains tax-free on maturity (8 years)
- No GST, no storage, no purity risk`
  + listAssetsByCategory(a => a.type === "Commodity ETF" || a.type === "Commodity Bond", "All Available Gold Options"),

  info_fd: () => `**What is a Fixed Deposit (FD)?**

An FD is a savings instrument offered by **banks and NBFCs** where you deposit a fixed amount for a fixed tenure at a guaranteed interest rate.

**Current FD rates (2025-26):**
| Bank | 1-yr FD | 3-yr FD |
|------|---------|---------|
| SBI | ~6.8% | ~6.75% |
| HDFC Bank | ~7.0% | ~7.0% |
| ICICI Bank | ~7.0% | ~7.0% |
| Small Finance Banks | ~8-9% | ~8-9% |

**FD vs Liquid MF:**
- FD: Guaranteed returns, taxed at slab rate
- Liquid MF: Slightly higher post-tax returns, instant redemption

**Tax-saving FD:** 5-year FD qualifies for Rs 1.5L deduction under Section 80C (but interest is taxable).`,

  info_sgb: () => `**Sovereign Gold Bond (SGB) - Best Gold Investment**

Issued by **RBI** on behalf of the Government of India.

**Features:**
| Feature | Detail |
|---------|--------|
| Interest | 2.5% p.a. (paid semi-annually) |
| Tenure | 8 years (exit allowed after 5 years) |
| Tax | Capital gains tax-FREE on maturity |
| Denomination | 1 gram of gold = 1 unit |
| Max purchase | 4 kg/individual per FY |
| Backing | Government of India |

**Why SGB is best for gold:**
- No GST (unlike physical gold)
- No storage or purity risk
- 2.5% interest on top of gold price appreciation
- Tax-free maturity gain

**Historical return:** Gold 10-yr CAGR ~11-12% + 2.5% interest = ~13-14% effective return.`,

  info_etf: () => `**What is an ETF (Exchange Traded Fund)?**

An ETF is a fund that **tracks an index** (like NIFTY 50) and is bought/sold on the stock exchange like a regular stock.

**Popular ETFs in India:**
| ETF | Tracks | Approx Expense |
|-----|--------|----------------|
| Nippon India NIFTY 50 ETF | NIFTY 50 | ~0.05% |
| SBI NIFTY ETF | NIFTY 50 | ~0.07% |
| Gold ETF (Nippon/SBI) | MCX Gold | ~0.3-0.5% |
| NIFTY Bank ETF | Bank NIFTY | ~0.15% |

**ETF vs Index Fund:**
- ETF: Traded on exchange (need demat), real-time pricing
- Index Fund: Bought via AMC/platform, end-of-day NAV, no demat needed

Both are excellent low-cost passive investing options.`
  + listAssetsByCategory(a => a.type === "Commodity ETF", "Available ETF Options"),

  info_cagr: () => `**What is CAGR (Compound Annual Growth Rate)?**

CAGR is the rate at which an investment grows **year-over-year** over a period, accounting for compounding.

**Formula:**
\`CAGR = (End Value / Start Value)^(1/Years) - 1\`

**Example:**
- Invested Rs 1 lakh in 2019
- Value in 2024: Rs 2.5 lakh
- CAGR = (2.5/1)^(1/5) - 1 = **20.1% p.a.**

**Reference CAGRs:**
| Asset | 10-yr CAGR |
|-------|-----------|
| NIFTY 50 | ~13-14% |
| NIFTY Midcap 150 | ~17-18% |
| Gold (MCX) | ~11-12% |
| G-Sec | ~7% |
| FD | ~6.5-7.5% |`,

  info_nav: () => `**What is NAV (Net Asset Value)?**

NAV is the **price per unit** of a mutual fund, calculated at the end of each trading day.

**Formula:**
\`NAV = (Total Assets - Liabilities) / Number of Units\`

**Key points:**
- A higher NAV does not mean expensive - unlike stocks, NAV alone does not indicate valuation
- A fund with NAV Rs 10 and one with NAV Rs 100 can have the same future returns
- What matters is the fund's **CAGR and portfolio quality**, not its NAV

**Example:**
- You invest Rs 10,000 in a fund with NAV = Rs 50
- You get 200 units
- If NAV becomes Rs 60, your investment = 200 x Rs 60 = **Rs 12,000** (20% gain)`,
};

// ─── Main Entry Point ─────────────────────────────────────────────────────────
export function processMessage(message, history = [], marketContext = "") {
  // 1. Curated investment assets (most specific — full portfolio detail)
  const specificAsset = detectSpecificAsset(message);
  if (specificAsset) return buildAssetDetailResponse(specificAsset);

  // 2. Specific stock lookup (e.g. "Tell me about ICICI Bank", "Maruti")
  //    Must come before sector so "ICICI Bank" -> stock card, not Banking sector list
  const specificStock = detectSpecificStock(message);
  if (specificStock) return buildStockDetailResponse(specificStock);

  // 3. Specific index lookup (e.g. "Tell me about NIFTY Bank", "NIFTY IT")
  //    Must come before classifyIntent so "NIFTY Bank" -> index card, not generic NIFTY info
  const specificIndex = detectSpecificIndex(message);
  if (specificIndex) return buildIndexDetailResponse(specificIndex);

  // 4. Classify intent
  const intent = classifyIntent(message);

  // 5. Explicit intents (greetings, help, info topics, list menus)
  if (intent !== "unclear" && intent !== "investment_query" && INFO[intent]) {
    return INFO[intent]();
  }

  // 6. Sector keyword (e.g. "Banking stocks", "IT sector", "pharma")
  //    After specific lookups so "ICICI Bank" doesn't fall through here
  const sector = detectSector(message);
  if (sector) return buildSectorStocksResponse(sector);

  // 7. Investment query — merge entities from conversation history
  if (intent === "investment_query") {
    const currentEntities = extractEntities(message);
    const historyEntities = history
      .filter(m => m.role === "user")
      .map(m => extractEntities(m.content));
    const entities = mergeEntities(currentEntities, ...historyEntities);
    return buildInvestmentResponse(entities, marketContext);
  }

  // 8. Fallback
  return INFO.unclear();
}
