-- ============================================
-- FINSIEVE DATABASE SCHEMA
-- 360° Investment Intelligence Platform
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTH
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    user_tier VARCHAR(20) DEFAULT 'FREE' CHECK (user_tier IN ('FREE', 'PREMIUM', 'ENTERPRISE')),
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    subscription_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- GLOBAL INDICES
-- ============================================

CREATE TABLE IF NOT EXISTS global_indices (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    country VARCHAR(100),
    exchange VARCHAR(50),
    current_value DECIMAL(15, 4),
    change DECIMAL(12, 4),
    change_percent DECIMAL(8, 4),
    previous_close DECIMAL(15, 4),
    open DECIMAL(15, 4),
    high DECIMAL(15, 4),
    low DECIMAL(15, 4),
    volume BIGINT,
    currency VARCHAR(10) DEFAULT 'USD',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_global_indices_country ON global_indices(country);
CREATE INDEX idx_global_indices_symbol ON global_indices(symbol);

-- ============================================
-- WATCHLISTS
-- ============================================

CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    color VARCHAR(7) DEFAULT '#2563eb',
    icon VARCHAR(50) DEFAULT 'bookmark',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_watchlists_user ON watchlists(user_id);

CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(200),
    asset_class VARCHAR(30) NOT NULL CHECK (asset_class IN ('EQUITY', 'US_EQUITY', 'MUTUAL_FUND', 'COMMODITY', 'BOND', 'CRYPTO', 'INDEX')),
    exchange VARCHAR(50),
    notes VARCHAR(500),
    target_price DECIMAL(15, 4),
    alert_above DECIMAL(15, 4),
    alert_below DECIMAL(15, 4),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(watchlist_id, symbol, asset_class)
);

CREATE INDEX idx_watchlist_items_watchlist ON watchlist_items(watchlist_id);
CREATE INDEX idx_watchlist_items_symbol ON watchlist_items(symbol);

-- ============================================
-- USER PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(5) DEFAULT 'en',
    default_currency VARCHAR(5) DEFAULT 'INR',
    default_chart_type VARCHAR(20) DEFAULT 'line',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SCREENING PRESETS
-- ============================================

CREATE TABLE IF NOT EXISTS screening_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    asset_class VARCHAR(30) NOT NULL,
    filters JSONB NOT NULL DEFAULT '[]',
    sort_by VARCHAR(50),
    sort_order VARCHAR(4) DEFAULT 'desc',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_screening_presets_user ON screening_presets(user_id);
CREATE INDEX idx_screening_presets_asset_class ON screening_presets(asset_class);

-- ============================================
-- COMPARISON HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS comparison_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    instruments JSONB NOT NULL,
    asset_class VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comparison_history_user ON comparison_history(user_id);

-- ============================================
-- MARKET DATA CACHE
-- ============================================

CREATE TABLE IF NOT EXISTS market_data_cache (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL,
    asset_class VARCHAR(30) NOT NULL,
    data JSONB NOT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    UNIQUE(symbol, asset_class)
);

CREATE INDEX idx_market_data_cache_symbol ON market_data_cache(symbol);
CREATE INDEX idx_market_data_cache_expires ON market_data_cache(expires_at);
