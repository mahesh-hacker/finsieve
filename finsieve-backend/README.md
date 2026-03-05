# Finsieve Backend API

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-lightgrey.svg)](https://expressjs.com/)

## 🏗️ Architecture

```
finsieve-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # PostgreSQL connection
│   │   └── jwt.js        # JWT configuration
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── validators/       # Input validation
│   ├── database/         # Database files
│   │   ├── schema.sql    # Database schema
│   │   ├── migrations/   # Schema migrations
│   │   └── seeds/        # Seed data
│   └── server.js         # Server entry point
├── .env.example          # Environment template
├── .gitignore
├── package.json
├── DATABASE_SETUP.md     # Database setup guide
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

Follow the detailed guide in [DATABASE_SETUP.md](./DATABASE_SETUP.md)

**Quick summary:**

```bash
# Create PostgreSQL database and user
# Execute schema.sql in DBeaver
# Copy .env file
cp .env.example .env
# Edit .env with your credentials
```

### 3. Configure Environment

Edit `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finsieve_db
DB_USER=finsieve_user
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### 4. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start at: **http://localhost:3000**

## 📡 API Endpoints

### Health Check

```bash
GET /health
```

### Authentication (Coming Soon)

```bash
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
```

### Users (Coming Soon)

```bash
GET    /api/v1/users/me
PUT    /api/v1/users/me
DELETE /api/v1/users/me
GET    /api/v1/users/preferences
PUT    /api/v1/users/preferences
```

### Watchlists (Coming Soon)

```bash
GET    /api/v1/watchlists
POST   /api/v1/watchlists
GET    /api/v1/watchlists/:id
PUT    /api/v1/watchlists/:id
DELETE /api/v1/watchlists/:id
POST   /api/v1/watchlists/:id/items
DELETE /api/v1/watchlists/:id/items/:itemId
```

### Market Data (Coming Soon)

```bash
GET    /api/v1/market-data/equities
GET    /api/v1/market-data/mutual-funds
GET    /api/v1/market-data/crypto
GET    /api/v1/market-data/indices
GET    /api/v1/market-data/search
```

## 🗄️ Database Schema

### Core Tables

- **users** - User accounts and authentication
- **refresh_tokens** - JWT refresh token storage
- **user_preferences** - User settings and preferences
- **watchlists** - User watchlists
- **watchlist_items** - Watchlist entries

### Market Data Tables

- **indian_equities** - NSE/BSE stocks
- **us_equities** - NYSE/NASDAQ stocks
- **mutual_funds** - Indian mutual funds
- **cryptocurrencies** - Crypto assets
- **global_indices** - Market indices

## 🔒 Security Features

- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Rate limiting (coming soon)
- ✅ JWT authentication (coming soon)
- ✅ Password hashing with bcrypt
- ✅ Input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection

## 🧪 Testing

```bash
# Run tests (coming soon)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Development Commands

```bash
# Start development server
npm run dev

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Reset database (caution!)
npm run db:reset
```

## 🌐 Environment Variables

| Variable           | Description                          | Default               |
| ------------------ | ------------------------------------ | --------------------- |
| NODE_ENV           | Environment (development/production) | development           |
| PORT               | Server port                          | 3000                  |
| DB_HOST            | PostgreSQL host                      | localhost             |
| DB_PORT            | PostgreSQL port                      | 5432                  |
| DB_NAME            | Database name                        | finsieve_db           |
| DB_USER            | Database user                        | finsieve_user         |
| DB_PASSWORD        | Database password                    | -                     |
| JWT_SECRET         | JWT signing secret                   | -                     |
| JWT_REFRESH_SECRET | JWT refresh secret                   | -                     |
| ALLOWED_ORIGINS    | CORS allowed origins                 | http://localhost:5173 |

## 📊 Performance Optimization

- Connection pooling (max 20 connections)
- Database indexing on frequently queried columns
- Compression middleware
- Response caching (coming soon)
- Query optimization with EXPLAIN ANALYZE

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (64+ characters)
- [ ] Enable SSL for database connections
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure logging service
- [ ] Set up monitoring (e.g., PM2, New Relic)

### Docker Support (Coming Soon)

```bash
docker-compose up -d
```

## 🤝 Contributing

1. Follow existing code structure
2. Use ESLint for code formatting
3. Write tests for new features
4. Update documentation

## 📄 License

MIT License - Finsieve Team

---

**Backend API Ready! 🎉**

Next Steps:

1. ✅ Database configured
2. 📝 Create authentication endpoints
3. 🔐 Implement JWT middleware
4. 📊 Add market data endpoints
