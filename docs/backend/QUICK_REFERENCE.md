# 🚀 Finsieve Database - Quick Reference Card

## 📋 Connection Details

```
PostgreSQL Server:
├── Host: localhost
├── Port: 5432
└── Default Database: postgres

Finsieve Database:
├── Database: finsieve_db
├── Username: finsieve_user
├── Password: [Set during setup]
└── Owner: finsieve_user
```

## 🗂️ Database Schema Overview

### 👤 Authentication & Users (5 tables)

| Table                       | Purpose             |
| --------------------------- | ------------------- |
| `users`                     | User accounts       |
| `refresh_tokens`            | JWT refresh tokens  |
| `user_preferences`          | User settings       |
| `password_reset_tokens`     | Password reset flow |
| `email_verification_tokens` | Email verification  |

### 📊 Watchlists (2 tables)

| Table             | Purpose           |
| ----------------- | ----------------- |
| `watchlists`      | User watchlists   |
| `watchlist_items` | Watchlist entries |

### 💹 Market Data (5 tables)

| Table              | Purpose             |
| ------------------ | ------------------- |
| `indian_equities`  | NSE/BSE stocks      |
| `us_equities`      | NYSE/NASDAQ stocks  |
| `mutual_funds`     | Indian mutual funds |
| `cryptocurrencies` | Crypto assets       |
| `global_indices`   | Market indices      |

### 📈 Activity (2 tables)

| Table            | Purpose       |
| ---------------- | ------------- |
| `search_history` | User searches |
| `activity_log`   | User actions  |

---

## ⚡ Quick SQL Commands

### 🔍 Inspect Database

```sql
-- List all tables
\dt

-- Describe table structure
\d users

-- List all databases
\l

-- List all users
\du

-- Current database
SELECT current_database();

-- Database size
SELECT pg_size_pretty(pg_database_size('finsieve_db'));

-- Table sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 👥 User Management

```sql
-- Create user
CREATE USER new_user WITH PASSWORD 'password123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE finsieve_db TO new_user;

-- Change password
ALTER USER finsieve_user WITH PASSWORD 'newpassword';

-- List users
SELECT usename, usesuper, usecreatedb FROM pg_user;

-- Drop user
DROP USER IF EXISTS old_user;
```

### 🗄️ Database Operations

```sql
-- Create database
CREATE DATABASE new_db WITH OWNER = finsieve_user;

-- Drop database (CAUTION!)
DROP DATABASE IF EXISTS old_db;

-- Rename database
ALTER DATABASE old_name RENAME TO new_name;

-- Grant access
GRANT CONNECT ON DATABASE finsieve_db TO public;
```

### 📊 Table Queries

```sql
-- Count rows in all tables
SELECT
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Find table by name
SELECT tablename
FROM pg_tables
WHERE tablename LIKE '%user%'
  AND schemaname = 'public';

-- List columns of a table
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users';
```

### 🔗 Relationships

```sql
-- List all foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### 📈 Performance

```sql
-- List indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- Table statistics
SELECT * FROM pg_stat_user_tables WHERE schemaname = 'public';
```

### 🛠️ Maintenance

```sql
-- Vacuum analyze (optimize)
VACUUM ANALYZE;

-- Reindex table
REINDEX TABLE users;

-- Check for bloat
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🔧 DBeaver Shortcuts

### General

| Action            | Windows/Linux | macOS       |
| ----------------- | ------------- | ----------- |
| New Connection    | Ctrl+Shift+N  | Cmd+Shift+N |
| SQL Editor        | Ctrl+]        | Cmd+]       |
| Execute Query     | Ctrl+Enter    | Cmd+Enter   |
| Execute Script    | Ctrl+Alt+E    | Cmd+Opt+E   |
| Auto-complete     | Ctrl+Space    | Cmd+Space   |
| Format SQL        | Ctrl+Shift+F  | Cmd+Shift+F |
| Comment/Uncomment | Ctrl+/        | Cmd+/       |
| Find/Replace      | Ctrl+F        | Cmd+F       |

### Navigation

| Action     | Windows/Linux | macOS     |
| ---------- | ------------- | --------- |
| Refresh    | F5            | F5        |
| Rename     | F2            | F2        |
| Delete     | Delete        | Delete    |
| Properties | Alt+Enter     | Opt+Enter |

---

## 📊 Sample Queries

### Create Test User

```sql
INSERT INTO users (email, password_hash, first_name, last_name, user_tier)
VALUES (
    'test@finsieve.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW.4r9f3UDuW', -- 'password123'
    'Test',
    'User',
    'premium'
) RETURNING *;
```

### Create Watchlist

```sql
INSERT INTO watchlists (user_id, name, description, is_default)
VALUES (
    (SELECT id FROM users WHERE email = 'test@finsieve.com'),
    'My First Watchlist',
    'Top tech stocks',
    true
) RETURNING *;
```

### Add Market Data

```sql
INSERT INTO indian_equities
(symbol, company_name, exchange, sector, market_cap, current_price)
VALUES
('RELIANCE', 'Reliance Industries Limited', 'NSE', 'Energy', 1800000000000, 2450.50),
('TCS', 'Tata Consultancy Services', 'NSE', 'IT', 1300000000000, 3580.75),
('INFY', 'Infosys Limited', 'NSE', 'IT', 650000000000, 1560.25)
RETURNING *;
```

### Search Stocks

```sql
SELECT
    symbol,
    company_name,
    sector,
    current_price,
    price_change_percent,
    market_cap
FROM indian_equities
WHERE sector = 'IT'
ORDER BY market_cap DESC
LIMIT 10;
```

---

## 🚨 Common Issues & Fixes

### Issue: "Connection refused"

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql
# Restart if needed
brew services restart postgresql@14
```

### Issue: "Password authentication failed"

```sql
-- Reset password
ALTER USER finsieve_user WITH PASSWORD 'newpassword';
```

### Issue: "Permission denied"

```sql
-- Grant permissions
GRANT ALL ON SCHEMA public TO finsieve_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO finsieve_user;
```

### Issue: "Database does not exist"

```sql
-- Create database
CREATE DATABASE finsieve_db WITH OWNER = finsieve_user;
```

---

## 📁 File Locations

```
Backend Files:
├── /Volumes/D_Drive/finsieve/finsieve-backend/
│   ├── src/database/schema.sql        # Main schema
│   ├── src/config/database.js         # Connection config
│   ├── .env                           # Environment vars
│   ├── DATABASE_SETUP.md              # Setup guide
│   ├── DBEAVER_GUIDE.md              # DBeaver tutorial
│   └── README.md                      # API docs
```

---

## 🔐 Security Checklist

- [ ] Use strong passwords (16+ chars)
- [ ] Never commit `.env` file
- [ ] Use SSL for production
- [ ] Regular backups
- [ ] Limit user permissions
- [ ] Monitor connections
- [ ] Rotate passwords quarterly
- [ ] Enable query logging

---

## 📞 Quick Links

- **PostgreSQL Docs**: https://postgresql.org/docs/
- **DBeaver Manual**: https://dbeaver.com/docs/
- **SQL Tutorial**: https://postgresqltutorial.com/
- **Node.js pg**: https://node-postgres.com/

---

## 🎯 Next Actions

```bash
# 1. Navigate to backend
cd /Volumes/D_Drive/finsieve/finsieve-backend

# 2. Install dependencies
npm install

# 3. Copy environment
cp .env.example .env

# 4. Edit .env with your credentials
nano .env

# 5. Test connection
node -e "import('./src/config/database.js').then(db => db.testConnection())"

# 6. Start server
npm run dev
```

---

**Keep this card handy! 📌**
