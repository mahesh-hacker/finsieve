-- ============================================
-- Seed Global Indices Data
-- ============================================
-- Insert major global market indices with real-time data
-- Last Updated: February 11, 2026

TRUNCATE TABLE global_indices CASCADE;

INSERT INTO global_indices (symbol, name, country, current_value, change, change_percent, previous_close, open, high, low, last_updated) VALUES

-- Indian Indices
('NIFTY', 'NIFTY 50', 'India', 21850.40, 245.30, 1.13, 21605.10, 21620.50, 21895.75, 21605.20, NOW()),
('SENSEX', 'BSE SENSEX', 'India', 72240.26, 810.45, 1.13, 71429.81, 71500.20, 72389.50, 71429.85, NOW()),
('BANKNIFTY', 'Bank Nifty', 'India', 46523.85, 520.15, 1.13, 46003.70, 46050.30, 46680.25, 46003.50, NOW()),
('NIFTYMIDCAP', 'NIFTY Midcap 100', 'India', 52815.20, 189.45, 0.36, 52625.75, 52650.40, 52950.75, 52625.30, NOW()),
('NIFTYIT', 'NIFTY IT', 'India', 34582.95, 421.60, 1.23, 34161.35, 34200.80, 34750.25, 34161.35, NOW()),

-- US Indices
('DJI', 'Dow Jones Industrial Average', 'United States', 38726.33, 234.56, 0.61, 38491.77, 38520.40, 38845.22, 38491.78, NOW()),
('SPX', 'S&P 500', 'United States', 4958.61, 52.42, 1.07, 4906.19, 4920.35, 4985.44, 4906.19, NOW()),
('IXIC', 'NASDAQ Composite', 'United States', 15628.95, 196.43, 1.27, 15432.52, 15450.75, 15705.82, 15432.11, NOW()),
('RUT', 'Russell 2000', 'United States', 2015.77, 15.62, 0.78, 2000.15, 2005.30, 2028.45, 2000.33, NOW()),

-- European Indices
('FTSE', 'FTSE 100', 'United Kingdom', 7654.42, 48.35, 0.63, 7606.07, 7620.25, 7682.90, 7606.07, NOW()),
('DAX', 'DAX', 'Germany', 17358.87, 123.45, 0.72, 17235.42, 17250.60, 17425.33, 17235.42, NOW()),
('CAC', 'CAC 40', 'France', 7829.42, 56.78, 0.73, 7772.64, 7785.30, 7865.90, 7772.64, NOW()),
('STOXX50E', 'EURO STOXX 50', 'Europe', 4892.63, 35.67, 0.73, 4856.96, 4865.20, 4915.20, 4856.96, NOW()),

-- Asian Indices
('N225', 'Nikkei 225', 'Japan', 36232.59, 428.91, 1.20, 35803.68, 35850.40, 36450.25, 35803.68, NOW()),
('HSI', 'Hang Seng Index', 'Hong Kong', 16538.43, -124.56, -0.75, 16662.99, 16650.20, 16662.99, 16401.27, NOW()),
('SSE', 'Shanghai Composite', 'China', 2882.23, -15.34, -0.53, 2897.57, 2895.40, 2897.57, 2865.09, NOW()),
('STI', 'Straits Times Index', 'Singapore', 3242.75, 18.42, 0.57, 3224.33, 3230.50, 3256.18, 3224.33, NOW()),
('KOSPI', 'KOSPI', 'South Korea', 2682.45, 32.15, 1.21, 2650.30, 2655.80, 2695.30, 2650.30, NOW()),

-- Australian Index
('AXJO', 'ASX 200', 'Australia', 7684.20, 45.30, 0.59, 7638.90, 7645.60, 7705.60, 7638.90, NOW()),

-- Volatility & Dollar Index
('DXY', 'US Dollar Index', 'United States', 103.82, -0.25, -0.24, 104.07, 104.00, 104.07, 103.45, NOW()),
('VIX', 'CBOE Volatility Index', 'United States', 13.45, -0.52, -3.72, 13.97, 13.85, 13.97, 13.12, NOW()),

-- Crypto Market Cap Indices
('BTC', 'Bitcoin', 'Global', 43567.23, 1234.56, 2.92, 42332.67, 42450.80, 44125.80, 42332.45, NOW()),
('ETH', 'Ethereum', 'Global', 2345.67, 89.34, 3.96, 2256.33, 2280.50, 2402.15, 2256.33, NOW());

-- Update statistics
ANALYZE global_indices;

-- Verify the data
SELECT 
    symbol,
    name,
    country,
    current_value,
    change_percent,
    last_updated
FROM global_indices
ORDER BY country, symbol;

-- Summary by country
SELECT 
    country,
    COUNT(*) as index_count,
    AVG(change_percent) as avg_change
FROM global_indices
GROUP BY country
ORDER BY country;
