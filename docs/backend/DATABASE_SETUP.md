# 🗄️ Finsieve Database Setup Guide

## Prerequisites

- PostgreSQL 14+ installed
- DBeaver (or any PostgreSQL client)
- Admin access to create databases and users

---

## 📋 Step-by-Step Setup for DBeaver

### Step 1: Install PostgreSQL

If you haven't installed PostgreSQL yet:

**macOS:**

```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**

- Download from: https://www.postgresql.org/download/windows/
- Run installer and follow the wizard

---

### Step 2: Connect to PostgreSQL with DBeaver

1. **Open DBeaver**
2. Click **Database** → **New Database Connection**
3. Select **PostgreSQL**
4. Enter connection details:
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Database:** `postgres` (default database)
   - **Username:** `postgres` (default admin)
   - **Password:** (your PostgreSQL password set during installation)
5. Click **Test Connection**
6. Click **Finish**

---

### Step 3: Create Database and User

In DBeaver, open **SQL Editor** (Ctrl+Enter or Cmd+Enter) and run:

```sql
-- Create database user
CREATE USER finsieve_user WITH PASSWORD 'your_secure_password_here';

-- Create database
CREATE DATABASE finsieve_db
  WITH OWNER = finsieve_user
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE finsieve_db TO finsieve_user;

-- Connect to the new database
\c finsieve_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO finsieve_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO finsieve_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO finsieve_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO finsieve_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO finsieve_user;
```

**Important:** Replace `your_secure_password_here` with a strong password!

---

### Step 4: Create New Connection to Finsieve Database

1. In DBeaver, create a **new connection** to PostgreSQL
2. Enter connection details:
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Database:** `finsieve_db`
   - **Username:** `finsieve_user`
   - **Password:** (the password you set above)
3. Click **Test Connection**
4. Click **Finish**

---

### Step 5: Execute Database Schema

1. In DBeaver, connect to `finsieve_db` database
2. Open the file: `src/database/schema.sql`
3. Select all content (Ctrl+A or Cmd+A)
4. Execute (Ctrl+Enter or Cmd+Enter)
5. Wait for completion (should create ~20 tables)

You should see output like:

```
✓ CREATE EXTENSION
✓ CREATE TYPE
✓ CREATE TABLE users
✓ CREATE TABLE refresh_tokens
...
✓ CREATE INDEX
✓ CREATE TRIGGER
✓ CREATE VIEW
```

---

### Step 6: Verify Schema

Run this query to verify all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected tables (15):**

- `users`
- `refresh_tokens`
- `user_preferences`
- `password_reset_tokens`
- `email_verification_tokens`
- `watchlists`
- `watchlist_items`
- `indian_equities`
- `us_equities`
- `mutual_funds`
- `cryptocurrencies`
- `global_indices`
- `search_history`
- `activity_log`

---

### Step 7: Configure Backend Environment

1. Navigate to backend folder:

   ```bash
   cd /Volumes/D_Drive/finsieve/finsieve-backend
   ```

2. Copy environment template:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` file with your database credentials:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=finsieve_db
   DB_USER=finsieve_user
   DB_PASSWORD=your_secure_password_here
   ```

4. Generate JWT secrets:

   ```bash
   # Generate random secrets (run in terminal)
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   Copy the output and paste into `.env`:

   ```env
   JWT_SECRET=<paste-generated-secret-here>
   JWT_REFRESH_SECRET=<paste-another-generated-secret-here>
   ```

---

### Step 8: Install Dependencies and Test Connection

```bash
# Install dependencies
npm install

# Test database connection
node -e "import('./src/config/database.js').then(db => db.testConnection())"
```

**Expected output:**

```
✅ Connected to PostgreSQL database
✅ Database connection successful!
📅 Current database time: 2026-02-08 10:30:45.123+00
```

---

## 🔍 DBeaver Tips & Tricks

### Viewing Entity Relationship Diagram (ERD)

1. Right-click on `finsieve_db` database
2. Select **View Diagram**
3. DBeaver will auto-generate visual ERD showing all relationships

### Viewing Table Data

1. Navigate to **Tables** in Database Navigator
2. Right-click any table → **View Data**
3. Use **SQL Editor** for custom queries

### Exporting Schema

```sql
-- Export schema to file
pg_dump -h localhost -U finsieve_user -d finsieve_db --schema-only > schema_backup.sql

-- Export data to file
pg_dump -h localhost -U finsieve_user -d finsieve_db --data-only > data_backup.sql
```

---

## 📊 Database Statistics

After setup, you can view database stats:

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('finsieve_db')) as database_size;

-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active connections
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE datname = 'finsieve_db';
```

---

## 🛠️ Troubleshooting

### Issue: "role 'finsieve_user' does not exist"

```sql
-- Create user again
CREATE USER finsieve_user WITH PASSWORD 'your_password';
```

### Issue: "database 'finsieve_db' does not exist"

```sql
-- Create database again
CREATE DATABASE finsieve_db WITH OWNER = finsieve_user;
```

### Issue: "permission denied for schema public"

```sql
-- Grant permissions
\c finsieve_db
GRANT ALL ON SCHEMA public TO finsieve_user;
```

### Issue: Connection timeout in DBeaver

- Check if PostgreSQL is running:

  ```bash
  # macOS
  brew services list

  # Linux
  sudo systemctl status postgresql
  ```

- Verify `pg_hba.conf` allows local connections
- Check firewall settings

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - it's in `.gitignore`
2. **Use strong passwords** - minimum 16 characters
3. **Rotate JWT secrets** - change them regularly in production
4. **Enable SSL** - for production database connections
5. **Backup regularly** - use `pg_dump` for backups
6. **Monitor connections** - limit max connections in pool
7. **Use prepared statements** - we use parameterized queries (already implemented)

---

## 📚 Next Steps

After database setup:

1. ✅ Database configured
2. 📝 Create API endpoints (next step)
3. 🔐 Implement authentication
4. 📊 Add market data endpoints
5. 🧪 Write tests
6. 🚀 Deploy to production

---

## 📞 Need Help?

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- DBeaver Documentation: https://dbeaver.com/docs/
- Node.js pg library: https://node-postgres.com/

---

**Database Ready! 🎉**
