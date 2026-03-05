import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "finsieve_db",
  user: process.env.DB_USER || "finsieve_user",
  password: process.env.DB_PASSWORD,
  max: 50, // Maximum number of clients in the pool (increased for schedulers)
  min: 10, // Minimum number of clients in the pool
  idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  acquireTimeoutMillis: 30000, // Wait up to 30 seconds for a connection from the pool
  statement_timeout: 30000, // Cancel queries after 30 seconds
  query_timeout: 30000, // Timeout for query execution
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  // Log but don't crash — transient pool errors should not kill the process.
  console.error("❌ Unexpected database pool error:", err.message);
});

// Query helper function
const LOG_QUERIES = process.env.LOG_QUERIES === "true";
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (LOG_QUERIES) {
      console.log("Executed query", { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
};

// Transaction helper
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Test connection function
export const testConnection = async () => {
  try {
    const result = await query("SELECT NOW() as current_time");
    console.log("✅ Database connection successful!");
    console.log("📅 Current database time:", result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
};

export default pool;
