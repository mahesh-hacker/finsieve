# 🔧 DBeaver Configuration Guide for Finsieve

## Complete Step-by-Step Tutorial with Screenshots Instructions

---

## 📥 Part 1: Download & Install DBeaver

### Option 1: Download from Website

1. Visit: https://dbeaver.io/download/
2. Choose your OS (macOS, Windows, Linux)
3. Download **DBeaver Community Edition** (Free)
4. Install following the wizard

### Option 2: Package Manager (macOS)

```bash
brew install --cask dbeaver-community
```

### Option 3: Package Manager (Ubuntu/Debian)

```bash
sudo snap install dbeaver-ce
```

---

## 🗄️ Part 2: PostgreSQL Setup

### Install PostgreSQL

**macOS:**

```bash
# Install PostgreSQL 14
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Verify installation
psql --version
```

**Ubuntu/Debian:**

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
psql --version
```

**Windows:**

1. Download: https://www.postgresql.org/download/windows/
2. Run the installer (recommend default port 5432)
3. Remember the password you set for 'postgres' user
4. Complete installation

---

## 🔌 Part 3: Connect DBeaver to PostgreSQL

### Step 1: Launch DBeaver

Open DBeaver application

### Step 2: Create New Connection

1. Click **Database** menu → **New Database Connection**
   - OR click the plug icon (🔌) in toolbar
   - OR press `Ctrl+Shift+N` (Windows/Linux) or `Cmd+Shift+N` (macOS)

2. **Select Database Type:**
   - In the dialog, select **PostgreSQL**
   - Click **Next**

### Step 3: Configure Connection Settings

Fill in the connection details:

```
Main Tab:
├── Host: localhost
├── Port: 5432
├── Database: postgres
├── Username: postgres
└── Password: [your postgres password]

Driver Properties Tab:
└── Leave defaults
```

**Important Notes:**

- **Host:** `localhost` (or `127.0.0.1`)
- **Database:** `postgres` (default system database)
- **Username:** `postgres` (default superuser)
- **Password:** Password you set during PostgreSQL installation

### Step 4: Test Connection

1. Click **Test Connection** button
2. **First Time?** DBeaver may ask to download PostgreSQL driver:
   - Click **Download** to get the driver files
   - Wait for download to complete
3. You should see: **"Connected"** message ✅
4. If successful, click **Finish**

### Step 5: Verify Connection

In DBeaver's **Database Navigator** (left panel):

- You should see: `postgres - localhost`
- Expand it to see: Databases, Schemas, Tables

---

## 🏗️ Part 4: Create Finsieve Database

### Step 1: Open SQL Editor

1. In Database Navigator, right-click on `postgres - localhost`
2. Select **SQL Editor** → **New SQL Script**
   - OR press `Ctrl+]` (Windows/Linux) or `Cmd+]` (macOS)

### Step 2: Create Database User

Copy and paste this SQL:

```sql
-- ============================================
-- Create Finsieve Database User
-- ============================================

CREATE USER finsieve_user WITH
  LOGIN
  PASSWORD 'Finsieve@2026!' -- Change this password!
  CREATEDB
  NOSUPERUSER
  NOCREATEROLE;

-- Verify user created
SELECT usename, usesuper, usecreatedb
FROM pg_user
WHERE usename = 'finsieve_user';
```

**Execute:**

- Select all text (Ctrl+A / Cmd+A)
- Click **Execute SQL Statement** button (▶️)
- OR press `Ctrl+Enter` / `Cmd+Enter`

**Expected Output:**

```
Query returned successfully: 1 rows affected
```

### Step 3: Create Database

```sql
-- ============================================
-- Create Finsieve Database
-- ============================================

CREATE DATABASE finsieve_db
  WITH
  OWNER = finsieve_user
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TABLESPACE = pg_default
  CONNECTION LIMIT = -1
  TEMPLATE = template0;

COMMENT ON DATABASE finsieve_db IS
  'Finsieve 360° Investment Intelligence Platform Database';

-- Verify database created
SELECT datname, encoding, datcollate
FROM pg_database
WHERE datname = 'finsieve_db';
```

Execute this query. You should see:

```
✓ CREATE DATABASE
✓ COMMENT
✓ SELECT 1
```

### Step 4: Grant Permissions

```sql
-- ============================================
-- Grant All Permissions to Finsieve User
-- ============================================

-- Grant database privileges
GRANT ALL PRIVILEGES ON DATABASE finsieve_db TO finsieve_user;

-- Connect to finsieve_db to grant schema privileges
-- (You'll create a new connection next, so this prepares it)
\c finsieve_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO finsieve_user;

-- Grant default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO finsieve_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO finsieve_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO finsieve_user;
```

Execute this. Expected output:

```
✓ GRANT
✓ You are now connected to database "finsieve_db"
✓ GRANT
✓ ALTER DEFAULT PRIVILEGES (3x)
```

---

## 🔗 Part 5: Create Finsieve Database Connection

### Step 1: Create New Connection

1. Click **Database** → **New Database Connection**
2. Select **PostgreSQL**
3. Click **Next**

### Step 2: Enter Finsieve Connection Details

```
Main Tab:
├── Host: localhost
├── Port: 5432
├── Database: finsieve_db          ← Changed!
├── Username: finsieve_user        ← Changed!
└── Password: Finsieve@2026!      ← Your password

PostgreSQL Tab:
└── Show all databases: ☑️ (checked)
```

### Step 3: Test & Finish

1. Click **Test Connection**
2. Should show: **"Connected"** ✅
3. Click **Finish**

### Step 4: Verify New Connection

In Database Navigator, you should now see:

```
📁 postgres - localhost (postgres)
📁 finsieve_db - localhost (finsieve_user)  ← New!
```

---

## 📊 Part 6: Execute Database Schema

### Step 1: Open Schema File

1. Navigate to your backend folder:

   ```
   /Volumes/D_Drive/finsieve/finsieve-backend/src/database/schema.sql
   ```

2. **Open in DBeaver:**
   - Drag & drop `schema.sql` into DBeaver
   - OR File → Open → Browse to `schema.sql`

### Step 2: Set Active Connection

1. Ensure **finsieve_db** connection is active
2. In SQL Editor toolbar, select connection: `finsieve_db - localhost`

### Step 3: Execute Schema

1. Select all content (Ctrl+A / Cmd+A)
2. Execute (Ctrl+Enter / Cmd+Enter)
3. Watch the execution log

**Expected Output (15+ operations):**

```
✓ CREATE EXTENSION "uuid-ossp"
✓ CREATE TYPE user_tier
✓ CREATE TABLE users
✓ CREATE TABLE refresh_tokens
✓ CREATE TABLE user_preferences
✓ CREATE TABLE password_reset_tokens
✓ CREATE TABLE email_verification_tokens
✓ CREATE TABLE watchlists
✓ CREATE TABLE watchlist_items
✓ CREATE TABLE indian_equities
✓ CREATE TABLE us_equities
✓ CREATE TABLE mutual_funds
✓ CREATE TABLE cryptocurrencies
✓ CREATE TABLE global_indices
✓ CREATE TABLE search_history
✓ CREATE TABLE activity_log
✓ CREATE INDEX (multiple)
✓ CREATE TRIGGER (multiple)
✓ CREATE VIEW (2)
```

### Step 4: Refresh & Verify Tables

1. In Database Navigator, right-click `finsieve_db`
2. Click **Refresh**
3. Expand: `finsieve_db` → `Schemas` → `public` → `Tables`

**You should see 15 tables:**

- activity_log
- cryptocurrencies
- email_verification_tokens
- global_indices
- indian_equities
- mutual_funds
- password_reset_tokens
- refresh_tokens
- search_history
- us_equities
- user_preferences
- users
- watchlist_items
- watchlists

---

## 🎨 Part 7: Visualize Database (ERD)

### Create Entity Relationship Diagram

1. Right-click on `finsieve_db` database
2. Select **View Diagram**
3. DBeaver will auto-generate visual ERD

**What you'll see:**

- All tables with columns
- Primary keys (🔑 icon)
- Foreign keys (arrows/lines)
- Relationships between tables

**Customize Diagram:**

- Drag tables to rearrange
- Right-click → **Diagram Settings** → Adjust layout
- Export: Right-click → **Export Diagram** → PNG/PDF

---

## 🔍 Part 8: Explore Database Features

### 8.1 View Table Structure

1. Navigate to `Tables` → `users`
2. **Tabs available:**
   - **Columns**: See all columns with data types
   - **Constraints**: Primary keys, foreign keys, unique constraints
   - **Indexes**: Performance indexes
   - **Triggers**: Automated triggers (e.g., updated_at)
   - **Permissions**: User access rights

### 8.2 Browse Table Data

1. Right-click `users` table
2. Select **View Data**
3. Empty now (no data yet)
4. **Features:**
   - Add rows manually
   - Filter data
   - Sort columns
   - Export to CSV/JSON

### 8.3 Run Custom Queries

**Example Query 1: Check Extensions**

```sql
SELECT * FROM pg_extension;
```

**Example Query 2: List All Tables**

```sql
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Example Query 3: Check Triggers**

```sql
SELECT
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

---

## 🛠️ Part 9: DBeaver Tips & Tricks

### Keyboard Shortcuts

| Action         | Windows/Linux | macOS       |
| -------------- | ------------- | ----------- |
| New SQL Editor | Ctrl+]        | Cmd+]       |
| Execute Query  | Ctrl+Enter    | Cmd+Enter   |
| Execute Script | Ctrl+Alt+E    | Cmd+Opt+E   |
| Format SQL     | Ctrl+Shift+F  | Cmd+Shift+F |
| Auto-complete  | Ctrl+Space    | Cmd+Space   |
| Comment Line   | Ctrl+/        | Cmd+/       |

### Useful Features

**1. SQL Formatter**

- Select messy SQL code
- Press Ctrl+Shift+F (Cmd+Shift+F)
- DBeaver beautifies it!

**2. Auto-complete**

- Start typing table/column name
- Press Ctrl+Space
- Select from suggestions

**3. Export Data**

- Right-click table → **Export Data**
- Choose format: CSV, JSON, SQL, XML, Excel
- Configure options → Proceed

**4. Import Data**

- Right-click table → **Import Data**
- Select file (CSV, JSON, etc.)
- Map columns → Start import

**5. SQL Templates**

- SQL Editor → Templates button
- Pre-built queries (SELECT, INSERT, UPDATE, etc.)

---

## 📊 Part 10: Verify Setup

### Run Verification Queries

```sql
-- ============================================
-- Database Verification Queries
-- ============================================

-- 1. Check all tables exist
SELECT count(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
-- Expected: 15

-- 2. Check all indexes
SELECT count(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public';
-- Expected: 20+

-- 3. Check all triggers
SELECT count(*) as total_triggers
FROM information_schema.triggers
WHERE trigger_schema = 'public';
-- Expected: 3

-- 4. Check views
SELECT count(*) as total_views
FROM information_schema.views
WHERE table_schema = 'public';
-- Expected: 2

-- 5. Database size
SELECT pg_size_pretty(pg_database_size('finsieve_db')) as database_size;
-- Expected: ~8-10 MB (empty tables with schema)

-- 6. List all tables with row counts
SELECT
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY tablename;
-- Expected: All tables with 0 rows (empty)
```

**Expected Results:**

- ✅ 15 tables
- ✅ 20+ indexes
- ✅ 3 triggers
- ✅ 2 views
- ✅ All row counts = 0 (empty)

---

## 🔐 Part 11: Security Configuration

### Best Practices Implemented

1. **Dedicated User**: `finsieve_user` (not superuser)
2. **Limited Privileges**: Only access to `finsieve_db`
3. **Strong Password**: Use 16+ characters
4. **Connection Limit**: Prevents resource exhaustion

### Recommended: Change Default Passwords

```sql
-- Change finsieve_user password
ALTER USER finsieve_user WITH PASSWORD 'NewStrongPassword123!@#';

-- Verify
SELECT usename, valuntil
FROM pg_user
WHERE usename = 'finsieve_user';
```

### Enable SSL (Production)

```sql
-- Check SSL status
SHOW ssl;

-- Enable SSL in postgresql.conf
-- ssl = on
-- ssl_cert_file = 'server.crt'
-- ssl_key_file = 'server.key'
```

---

## 🚨 Part 12: Troubleshooting

### Issue 1: "Connection Refused"

**Symptoms:** Can't connect to PostgreSQL

**Solutions:**

```bash
# Check if PostgreSQL is running
# macOS:
brew services list | grep postgresql

# Linux:
sudo systemctl status postgresql

# Start service if stopped
brew services start postgresql@14  # macOS
sudo systemctl start postgresql     # Linux
```

### Issue 2: "Password Authentication Failed"

**Symptoms:** Wrong credentials

**Solutions:**

```bash
# Reset postgres password (macOS)
psql postgres -c "ALTER USER postgres PASSWORD 'newpassword';"

# Linux - switch to postgres user first
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'newpassword';"
```

### Issue 3: "Database Does Not Exist"

**Symptoms:** `finsieve_db` not found

**Solution:**

- Re-run CREATE DATABASE query in Part 4, Step 3
- Verify with: `SELECT datname FROM pg_database;`

### Issue 4: "Permission Denied"

**Symptoms:** Can't create tables

**Solution:**

```sql
-- Re-grant permissions
GRANT ALL PRIVILEGES ON DATABASE finsieve_db TO finsieve_user;
GRANT ALL ON SCHEMA public TO finsieve_user;
```

### Issue 5: DBeaver Won't Download Driver

**Solution:**

1. Manual download: https://jdbc.postgresql.org/download/
2. Download `postgresql-42.6.0.jar`
3. In DBeaver: Database → Driver Manager → PostgreSQL
4. Add JAR manually

---

## 📚 Part 13: Backup & Restore

### Create Backup

**Using DBeaver:**

1. Right-click `finsieve_db`
2. **Tools** → **Dump Database**
3. Choose location and format
4. Click **Start**

**Using Command Line:**

```bash
# Full backup (schema + data)
pg_dump -U finsieve_user -d finsieve_db > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump -U finsieve_user -d finsieve_db --schema-only > schema_backup.sql

# Data only
pg_dump -U finsieve_user -d finsieve_db --data-only > data_backup.sql
```

### Restore Backup

```bash
# Restore full backup
psql -U finsieve_user -d finsieve_db < backup_20260208.sql

# Restore to new database
createdb -U finsieve_user finsieve_db_restore
psql -U finsieve_user -d finsieve_db_restore < backup_20260208.sql
```

---

## ✅ Setup Complete Checklist

- [ ] PostgreSQL installed and running
- [ ] DBeaver installed and launched
- [ ] Connected to postgres database
- [ ] Created `finsieve_user` user
- [ ] Created `finsieve_db` database
- [ ] Granted all permissions
- [ ] Created new connection to finsieve_db
- [ ] Executed schema.sql successfully
- [ ] Verified 15 tables exist
- [ ] Viewed ERD diagram
- [ ] Ran verification queries
- [ ] Bookmarked this guide

---

## 🎯 Next Steps

Your database is ready! Now proceed to:

1. **Configure Backend Environment**

   ```bash
   cd /Volumes/D_Drive/finsieve/finsieve-backend
   cp .env.example .env
   # Edit .env with your DB credentials
   ```

2. **Install Backend Dependencies**

   ```bash
   npm install
   ```

3. **Test Connection**

   ```bash
   node -e "import('./src/config/database.js').then(db => db.testConnection())"
   ```

4. **Start Backend Server**
   ```bash
   npm run dev
   ```

---

## 📞 Resources

- **DBeaver Docs**: https://dbeaver.com/docs/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **SQL Tutorial**: https://www.postgresql.org/docs/current/tutorial.html
- **Finsieve Backend README**: `/finsieve-backend/README.md`
- **Database Schema**: `/finsieve-backend/src/database/schema.sql`

---

**DBeaver Setup Complete! 🎉**

Happy Querying! 🚀
