/**
 * Static Indian stocks and sectors data (mirrors backend marketData.js).
 * Used by the Indian Equities page for sector-based navigation.
 */

export const SECTORS = [
  "Banking & BFSI",
  "IT & Technology",
  "Oil Gas & Energy",
  "FMCG & Consumer Goods",
  "Pharma & Healthcare",
  "Automobile & Auto Ancillaries",
  "Infrastructure & Real Estate",
  "Metals & Mining",
  "Telecom & Media",
  "Chemicals & Specialty",
  "Capital Goods & Defence",
  "Retail & Consumer Durables",
];

export const SECTOR_ICONS: Record<string, string> = {
  "Banking & BFSI": "🏦",
  "IT & Technology": "💻",
  "Oil Gas & Energy": "⚡",
  "FMCG & Consumer Goods": "🛒",
  "Pharma & Healthcare": "💊",
  "Automobile & Auto Ancillaries": "🚗",
  "Infrastructure & Real Estate": "🏗️",
  "Metals & Mining": "⛏️",
  "Telecom & Media": "📡",
  "Chemicals & Specialty": "🧪",
  "Capital Goods & Defence": "🛡️",
  "Retail & Consumer Durables": "🛍️",
};

export interface IndianStock {
  name: string;
  symbol: string;
  bse: string;
  sector: string;
  cap: string;
  desc: string;
}

export const INDIAN_STOCKS: IndianStock[] = [
  // Banking & BFSI
  { name: "HDFC Bank", symbol: "HDFCBANK", bse: "500180", sector: "Banking & BFSI", cap: "Large Cap", desc: "India's largest private sector bank by assets" },
  { name: "ICICI Bank", symbol: "ICICIBANK", bse: "532174", sector: "Banking & BFSI", cap: "Large Cap", desc: "Second largest private bank, strong retail & digital" },
  { name: "State Bank of India", symbol: "SBIN", bse: "500112", sector: "Banking & BFSI", cap: "Large Cap", desc: "India's largest public sector bank" },
  { name: "Kotak Mahindra Bank", symbol: "KOTAKBANK", bse: "500247", sector: "Banking & BFSI", cap: "Large Cap", desc: "Premium private bank with strong wealth management" },
  { name: "Axis Bank", symbol: "AXISBANK", bse: "532215", sector: "Banking & BFSI", cap: "Large Cap", desc: "Third largest private bank, pan-India presence" },
  { name: "Bajaj Finance", symbol: "BAJFINANCE", bse: "500034", sector: "Banking & BFSI", cap: "Large Cap", desc: "India's leading NBFC, diversified lending" },
  { name: "HDFC Life Insurance", symbol: "HDFCLIFE", bse: "540777", sector: "Banking & BFSI", cap: "Large Cap", desc: "Leading private life insurer" },
  { name: "SBI Life Insurance", symbol: "SBILIFE", bse: "540719", sector: "Banking & BFSI", cap: "Large Cap", desc: "Largest private life insurer by premium" },
  { name: "IndusInd Bank", symbol: "INDUSINDBK", bse: "532187", sector: "Banking & BFSI", cap: "Large Cap", desc: "Mid-sized private bank with strong vehicle finance" },
  { name: "Bank of Baroda", symbol: "BANKBARODA", bse: "532134", sector: "Banking & BFSI", cap: "Large Cap", desc: "Second largest public sector bank" },
  { name: "Punjab National Bank", symbol: "PNB", bse: "532461", sector: "Banking & BFSI", cap: "Large Cap", desc: "One of the largest PSU banks in India" },
  { name: "Muthoot Finance", symbol: "MUTHOOTFIN", bse: "533398", sector: "Banking & BFSI", cap: "Mid Cap", desc: "India's largest gold loan NBFC" },

  // IT & Technology
  { name: "Tata Consultancy Services", symbol: "TCS", bse: "532540", sector: "IT & Technology", cap: "Large Cap", desc: "India's largest IT services company" },
  { name: "Infosys", symbol: "INFY", bse: "500209", sector: "IT & Technology", cap: "Large Cap", desc: "Global IT consulting, ~300k+ employees" },
  { name: "HCL Technologies", symbol: "HCLTECH", bse: "532281", sector: "IT & Technology", cap: "Large Cap", desc: "Products & services, strong IMS segment" },
  { name: "Wipro", symbol: "WIPRO", bse: "507685", sector: "IT & Technology", cap: "Large Cap", desc: "IT services and products globally" },
  { name: "Tech Mahindra", symbol: "TECHM", bse: "532755", sector: "IT & Technology", cap: "Large Cap", desc: "Telecom-focused IT, strong in 5G" },
  { name: "LTIMindtree", symbol: "LTIM", bse: "540005", sector: "IT & Technology", cap: "Large Cap", desc: "Merged entity of L&T Infotech & Mindtree" },
  { name: "Mphasis", symbol: "MPHASIS", bse: "526299", sector: "IT & Technology", cap: "Mid Cap", desc: "HP subsidiary, BFS-focused IT" },
  { name: "Persistent Systems", symbol: "PERSISTENT", bse: "533179", sector: "IT & Technology", cap: "Mid Cap", desc: "Fast-growing IT with strong IP services" },
  { name: "Coforge", symbol: "COFORGE", bse: "532541", sector: "IT & Technology", cap: "Mid Cap", desc: "Travel and BFS focused IT services" },
  { name: "Oracle Financial Services", symbol: "OFSS", bse: "532466", sector: "IT & Technology", cap: "Large Cap", desc: "Banking software, subsidiary of Oracle Corp" },

  // Oil Gas & Energy
  { name: "Reliance Industries", symbol: "RELIANCE", bse: "500325", sector: "Oil Gas & Energy", cap: "Large Cap", desc: "Diversified conglomerate: oil, retail, telecom" },
  { name: "ONGC", symbol: "ONGC", bse: "500312", sector: "Oil Gas & Energy", cap: "Large Cap", desc: "India's largest oil & gas explorer" },
  { name: "BPCL", symbol: "BPCL", bse: "500547", sector: "Oil Gas & Energy", cap: "Large Cap", desc: "Bharat Petroleum, downstream oil marketing" },
  { name: "Indian Oil Corporation", symbol: "IOC", bse: "530965", sector: "Oil Gas & Energy", cap: "Large Cap", desc: "Largest downstream oil company in India" },
  { name: "Coal India", symbol: "COALINDIA", bse: "533278", sector: "Oil Gas & Energy", cap: "Large Cap", desc: "World's largest coal producer" },
  { name: "NTPC", symbol: "NTPC", bse: "532555", sector: "Oil Gas & Energy", cap: "Large Cap", desc: "India's largest power generation company" },
  { name: "Power Grid Corporation", symbol: "POWERGRID", bse: "532898", sector: "Oil Gas & Energy", cap: "Large Cap", desc: "Central power transmission utility" },
  { name: "Adani Green Energy", symbol: "ADANIGREEN", bse: "541450", sector: "Oil Gas & Energy", cap: "Large Cap", desc: "India's largest renewable energy company" },
  { name: "Tata Power", symbol: "TATAPOWER", bse: "500400", sector: "Oil Gas & Energy", cap: "Large Cap", desc: "Diversified power - generation, transmission, solar" },
  { name: "Adani Ports", symbol: "ADANIPORTS", bse: "532921", sector: "Oil Gas & Energy", cap: "Large Cap", desc: "India's largest private port developer" },

  // FMCG & Consumer Goods
  { name: "Hindustan Unilever", symbol: "HINDUNILVR", bse: "500696", sector: "FMCG & Consumer Goods", cap: "Large Cap", desc: "India's largest FMCG company" },
  { name: "ITC Limited", symbol: "ITC", bse: "500875", sector: "FMCG & Consumer Goods", cap: "Large Cap", desc: "Cigarettes, hotels, FMCG, paperboards" },
  { name: "Nestle India", symbol: "NESTLEIND", bse: "500790", sector: "FMCG & Consumer Goods", cap: "Large Cap", desc: "Food & beverages: Maggi, KitKat, Munch" },
  { name: "Britannia Industries", symbol: "BRITANNIA", bse: "500825", sector: "FMCG & Consumer Goods", cap: "Large Cap", desc: "India's largest biscuit maker" },
  { name: "Dabur India", symbol: "DABUR", bse: "500096", sector: "FMCG & Consumer Goods", cap: "Large Cap", desc: "Ayurvedic FMCG, healthcare & home care" },
  { name: "Marico", symbol: "MARICO", bse: "531642", sector: "FMCG & Consumer Goods", cap: "Large Cap", desc: "Parachute, Saffola - hair & health oils" },
  { name: "Godrej Consumer Products", symbol: "GODREJCP", bse: "532424", sector: "FMCG & Consumer Goods", cap: "Large Cap", desc: "HI, hair colours, soaps globally" },
  { name: "Emami", symbol: "EMAMILTD", bse: "531162", sector: "FMCG & Consumer Goods", cap: "Mid Cap", desc: "Fair & Handsome, Boroplus, Navratna" },
  { name: "Colgate-Palmolive India", symbol: "COLPAL", bse: "500830", sector: "FMCG & Consumer Goods", cap: "Large Cap", desc: "Oral care market leader in India" },
  { name: "Varun Beverages", symbol: "VBL", bse: "540180", sector: "FMCG & Consumer Goods", cap: "Large Cap", desc: "India's largest PepsiCo franchisee" },

  // Pharma & Healthcare
  { name: "Sun Pharmaceutical", symbol: "SUNPHARMA", bse: "524715", sector: "Pharma & Healthcare", cap: "Large Cap", desc: "India's largest pharma, specialty drugs" },
  { name: "Dr. Reddy's Laboratories", symbol: "DRREDDY", bse: "500124", sector: "Pharma & Healthcare", cap: "Large Cap", desc: "Generic drugs, APIs, biosimilars" },
  { name: "Cipla", symbol: "CIPLA", bse: "500087", sector: "Pharma & Healthcare", cap: "Large Cap", desc: "Respiratory, anti-infectives, generic drugs" },
  { name: "Divi's Laboratories", symbol: "DIVISLAB", bse: "532488", sector: "Pharma & Healthcare", cap: "Large Cap", desc: "API manufacturer, strong export focus" },
  { name: "Apollo Hospitals", symbol: "APOLLOHOSP", bse: "508869", sector: "Pharma & Healthcare", cap: "Large Cap", desc: "India's largest hospital chain" },
  { name: "Lupin", symbol: "LUPIN", bse: "500257", sector: "Pharma & Healthcare", cap: "Large Cap", desc: "Respiratory & cardiovascular generics globally" },
  { name: "Aurobindo Pharma", symbol: "AUROPHARMA", bse: "524804", sector: "Pharma & Healthcare", cap: "Large Cap", desc: "Bulk drugs & formulations exporter" },
  { name: "Torrent Pharmaceuticals", symbol: "TORNTPHARM", bse: "500420", sector: "Pharma & Healthcare", cap: "Large Cap", desc: "Cardiovascular, CNS generics India & global" },
  { name: "Max Healthcare", symbol: "MAXHEALTH", bse: "543220", sector: "Pharma & Healthcare", cap: "Large Cap", desc: "Second largest hospital chain in India" },
  { name: "Mankind Pharma", symbol: "MANKIND", bse: "543904", sector: "Pharma & Healthcare", cap: "Large Cap", desc: "Consumer healthcare & prescription drugs" },

  // Automobile & Auto Ancillaries
  { name: "Maruti Suzuki", symbol: "MARUTI", bse: "532500", sector: "Automobile & Auto Ancillaries", cap: "Large Cap", desc: "India's largest passenger car maker (~40% market share)" },
  { name: "Tata Motors", symbol: "TATAMOTORS", bse: "500570", sector: "Automobile & Auto Ancillaries", cap: "Large Cap", desc: "Commercial vehicles, Jaguar Land Rover" },
  { name: "Mahindra & Mahindra", symbol: "M&M", bse: "500520", sector: "Automobile & Auto Ancillaries", cap: "Large Cap", desc: "SUVs, tractors, EVs - diversified auto" },
  { name: "Bajaj Auto", symbol: "BAJAJ-AUTO", bse: "532977", sector: "Automobile & Auto Ancillaries", cap: "Large Cap", desc: "2-wheelers & 3-wheelers, strong exports" },
  { name: "Hero MotoCorp", symbol: "HEROMOTOCO", bse: "500182", sector: "Automobile & Auto Ancillaries", cap: "Large Cap", desc: "World's largest 2-wheeler maker by volume" },
  { name: "Eicher Motors", symbol: "EICHERMOT", bse: "505200", sector: "Automobile & Auto Ancillaries", cap: "Large Cap", desc: "Royal Enfield + commercial vehicles (VECV)" },
  { name: "TVS Motor Company", symbol: "TVSMOTOR", bse: "532343", sector: "Automobile & Auto Ancillaries", cap: "Large Cap", desc: "2-wheelers, strong premium segment growth" },
  { name: "Bosch India", symbol: "BOSCHLTD", bse: "500530", sector: "Automobile & Auto Ancillaries", cap: "Large Cap", desc: "Auto components, EV & industrial tech" },
  { name: "Motherson Sumi Wiring", symbol: "MSUMI", bse: "543498", sector: "Automobile & Auto Ancillaries", cap: "Large Cap", desc: "Wiring harness for cars globally" },
  { name: "MRF", symbol: "MRF", bse: "500290", sector: "Automobile & Auto Ancillaries", cap: "Large Cap", desc: "India's largest tyre manufacturer" },

  // Infrastructure & Real Estate
  { name: "Larsen & Toubro", symbol: "LT", bse: "500510", sector: "Infrastructure & Real Estate", cap: "Large Cap", desc: "India's largest engineering & construction conglomerate" },
  { name: "DLF Limited", symbol: "DLF", bse: "532868", sector: "Infrastructure & Real Estate", cap: "Large Cap", desc: "India's largest real estate developer" },
  { name: "Godrej Properties", symbol: "GODREJPROP", bse: "533150", sector: "Infrastructure & Real Estate", cap: "Large Cap", desc: "Premium residential developer across cities" },
  { name: "Macrotech Developers (Lodha)", symbol: "LODHA", bse: "543321", sector: "Infrastructure & Real Estate", cap: "Large Cap", desc: "India's largest residential developer by revenue" },
  { name: "Oberoi Realty", symbol: "OBEROIRLTY", bse: "533273", sector: "Infrastructure & Real Estate", cap: "Large Cap", desc: "Premium Mumbai real estate developer" },
  { name: "IRB Infrastructure", symbol: "IRB", bse: "532947", sector: "Infrastructure & Real Estate", cap: "Mid Cap", desc: "India's largest road BOT/TOT developer" },
  { name: "KNR Constructions", symbol: "KNRCON", bse: "532942", sector: "Infrastructure & Real Estate", cap: "Mid Cap", desc: "Roads, bridges, irrigation EPC" },
  { name: "Prestige Estates", symbol: "PRESTIGE", bse: "535034", sector: "Infrastructure & Real Estate", cap: "Large Cap", desc: "South India's largest diversified developer" },
  { name: "Brigade Enterprises", symbol: "BRIGADE", bse: "532929", sector: "Infrastructure & Real Estate", cap: "Mid Cap", desc: "Residential & commercial developer, South India" },
  { name: "Indiabulls Real Estate", symbol: "IBREALEST", bse: "532832", sector: "Infrastructure & Real Estate", cap: "Mid Cap", desc: "Residential projects in metros" },

  // Metals & Mining
  { name: "Tata Steel", symbol: "TATASTEEL", bse: "500470", sector: "Metals & Mining", cap: "Large Cap", desc: "Integrated steel producer, India & Europe" },
  { name: "JSW Steel", symbol: "JSWSTEEL", bse: "500228", sector: "Metals & Mining", cap: "Large Cap", desc: "India's largest steel producer by capacity" },
  { name: "Hindalco Industries", symbol: "HINDALCO", bse: "500440", sector: "Metals & Mining", cap: "Large Cap", desc: "Aluminium & copper, owns Novelis globally" },
  { name: "Vedanta", symbol: "VEDL", bse: "500295", sector: "Metals & Mining", cap: "Large Cap", desc: "Zinc, oil, aluminium, iron ore mining" },
  { name: "SAIL", symbol: "SAIL", bse: "500113", sector: "Metals & Mining", cap: "Large Cap", desc: "India's largest state-owned steel company" },
  { name: "NMDC", symbol: "NMDC", bse: "526371", sector: "Metals & Mining", cap: "Large Cap", desc: "India's largest iron ore producer" },
  { name: "Jindal Steel & Power", symbol: "JINDALSTEL", bse: "532286", sector: "Metals & Mining", cap: "Large Cap", desc: "Integrated steel & power, Odisha plant" },
  { name: "APL Apollo Tubes", symbol: "APLAPOLLO", bse: "533758", sector: "Metals & Mining", cap: "Mid Cap", desc: "India's largest structural steel tubes maker" },
  { name: "National Aluminium Company", symbol: "NATIONALUM", bse: "532234", sector: "Metals & Mining", cap: "Large Cap", desc: "State-owned aluminium producer" },
  { name: "Hindustan Zinc", symbol: "HINDZINC", bse: "500188", sector: "Metals & Mining", cap: "Large Cap", desc: "World's largest integrated zinc-lead-silver producer" },

  // Telecom & Media
  { name: "Bharti Airtel", symbol: "BHARTIARTL", bse: "532454", sector: "Telecom & Media", cap: "Large Cap", desc: "India's leading telecom & Africa presence" },
  { name: "Reliance Jio (via Reliance)", symbol: "RELIANCE", bse: "500325", sector: "Telecom & Media", cap: "Large Cap", desc: "Jio: world's largest mobile data network" },
  { name: "Vodafone Idea", symbol: "IDEA", bse: "532822", sector: "Telecom & Media", cap: "Mid Cap", desc: "3rd largest telco, under financial stress" },
  { name: "Indus Towers", symbol: "INDUSTOWER", bse: "534816", sector: "Telecom & Media", cap: "Large Cap", desc: "India's largest telecom tower company" },
  { name: "Tata Communications", symbol: "TATACOMM", bse: "500483", sector: "Telecom & Media", cap: "Large Cap", desc: "Global network, cloud & IoT services" },
  { name: "Zee Entertainment", symbol: "ZEEL", bse: "505537", sector: "Telecom & Media", cap: "Mid Cap", desc: "Leading media & entertainment company" },
  { name: "Sun TV Network", symbol: "SUNTV", bse: "532733", sector: "Telecom & Media", cap: "Large Cap", desc: "South India's largest TV network" },
  { name: "PVR INOX", symbol: "PVRINOX", bse: "532689", sector: "Telecom & Media", cap: "Mid Cap", desc: "India's largest multiplex chain" },

  // Chemicals & Specialty
  { name: "Asian Paints", symbol: "ASIANPAINT", bse: "500820", sector: "Chemicals & Specialty", cap: "Large Cap", desc: "India's largest paint company" },
  { name: "Pidilite Industries", symbol: "PIDILITIND", bse: "500331", sector: "Chemicals & Specialty", cap: "Large Cap", desc: "Fevicol, Dr. Fixit - adhesives & construction chemicals" },
  { name: "SRF Limited", symbol: "SRF", bse: "503806", sector: "Chemicals & Specialty", cap: "Large Cap", desc: "Specialty chemicals, fluorochemicals, packaging" },
  { name: "Navin Fluorine", symbol: "NAVINFLUOR", bse: "500..", sector: "Chemicals & Specialty", cap: "Mid Cap", desc: "Specialty fluorochemicals for pharma & agro" },
  { name: "PI Industries", symbol: "PIIND", bse: "523642", sector: "Chemicals & Specialty", cap: "Large Cap", desc: "Agrochemicals & custom synthesis for global pharma" },
  { name: "Deepak Nitrite", symbol: "DEEPAKNTR", bse: "506401", sector: "Chemicals & Specialty", cap: "Mid Cap", desc: "Basic & fine chemicals, phenol plant" },
  { name: "Berger Paints", symbol: "BERGEPAINT", bse: "509480", sector: "Chemicals & Specialty", cap: "Large Cap", desc: "Second largest paint company in India" },
  { name: "UPL Limited", symbol: "UPL", bse: "512070", sector: "Chemicals & Specialty", cap: "Large Cap", desc: "Global agrochemicals company" },
  { name: "Aarti Industries", symbol: "AARTIIND", bse: "524208", sector: "Chemicals & Specialty", cap: "Mid Cap", desc: "Benzene-based specialty chemicals" },
  { name: "Tata Chemicals", symbol: "TATACHEM", bse: "500770", sector: "Chemicals & Specialty", cap: "Large Cap", desc: "Soda ash, agri inputs, specialty products" },

  // Capital Goods & Defence
  { name: "Siemens India", symbol: "SIEMENS", bse: "500550", sector: "Capital Goods & Defence", cap: "Large Cap", desc: "Industrial automation, smart infrastructure" },
  { name: "ABB India", symbol: "ABB", bse: "500002", sector: "Capital Goods & Defence", cap: "Large Cap", desc: "Electrification, robotics, motion products" },
  { name: "Bharat Electronics", symbol: "BEL", bse: "500049", sector: "Capital Goods & Defence", cap: "Large Cap", desc: "Defence electronics, radars, communication systems" },
  { name: "HAL (Hindustan Aeronautics)", symbol: "HAL", bse: "541154", sector: "Capital Goods & Defence", cap: "Large Cap", desc: "Fighter jets, helicopters - India's defence giant" },
  { name: "Bharat Forge", symbol: "BHARATFORG", bse: "500493", sector: "Capital Goods & Defence", cap: "Large Cap", desc: "Forgings for auto, aerospace & defence" },
  { name: "Thermax", symbol: "THERMAX", bse: "500411", sector: "Capital Goods & Defence", cap: "Large Cap", desc: "Energy & environment solutions" },
  { name: "Cummins India", symbol: "CUMMINSIND", bse: "500480", sector: "Capital Goods & Defence", cap: "Large Cap", desc: "Diesel & alternative fuel engines" },
  { name: "Garden Reach Shipbuilders", symbol: "GRSE", bse: "542726", sector: "Capital Goods & Defence", cap: "Mid Cap", desc: "Naval warships & commercial vessels" },
  { name: "Mazagon Dock", symbol: "MAZDOCK", bse: "543237", sector: "Capital Goods & Defence", cap: "Large Cap", desc: "Submarines & warships for Indian Navy" },
  { name: "Cochin Shipyard", symbol: "COCHINSHIP", bse: "540678", sector: "Capital Goods & Defence", cap: "Mid Cap", desc: "Ship building & repair, Kerala" },

  // Retail & Consumer Durables
  { name: "Avenue Supermarts (DMart)", symbol: "DMART", bse: "540376", sector: "Retail & Consumer Durables", cap: "Large Cap", desc: "India's most profitable grocery retailer" },
  { name: "Titan Company", symbol: "TITAN", bse: "500114", sector: "Retail & Consumer Durables", cap: "Large Cap", desc: "Watches, jewellery (Tanishq), eyewear" },
  { name: "Trent Limited", symbol: "TRENT", bse: "500251", sector: "Retail & Consumer Durables", cap: "Large Cap", desc: "Westside, Zudio - Tata's retail arm" },
  { name: "Voltas", symbol: "VOLTAS", bse: "500575", sector: "Retail & Consumer Durables", cap: "Large Cap", desc: "Air conditioners & commercial refrigeration" },
  { name: "Havells India", symbol: "HAVELLS", bse: "517354", sector: "Retail & Consumer Durables", cap: "Large Cap", desc: "Electricals, fans, cables, appliances" },
  { name: "Crompton Greaves Consumer", symbol: "CROMPTON", bse: "539876", sector: "Retail & Consumer Durables", cap: "Mid Cap", desc: "Fans, pumps, lighting - consumer electricals" },
  { name: "Dixon Technologies", symbol: "DIXON", bse: "540699", sector: "Retail & Consumer Durables", cap: "Mid Cap", desc: "EMS: TVs, mobiles, home appliances OEM" },
  { name: "Info Edge (Naukri)", symbol: "NAUKRI", bse: "532777", sector: "Retail & Consumer Durables", cap: "Large Cap", desc: "Naukri, 99acres, Jeevansathi, Shiksha" },
  { name: "Zomato", symbol: "ZOMATO", bse: "543320", sector: "Retail & Consumer Durables", cap: "Large Cap", desc: "Food delivery & quick commerce (Blinkit)" },
  { name: "FSN E-Commerce (Nykaa)", symbol: "NYKAA", bse: "543260", sector: "Retail & Consumer Durables", cap: "Large Cap", desc: "Online beauty & fashion retail platform" },
];

export function getStocksBySector(sector: string): IndianStock[] {
  return INDIAN_STOCKS.filter((s) => s.sector === sector);
}
