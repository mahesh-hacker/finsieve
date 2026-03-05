/**
 * Update user maheshmishra1691@gmail.com to Premium with lifetime validity.
 * Run from project root: node scripts/updatePremiumUser.js
 *
 * Requires: DB_* env vars (or .env) so the backend database config works.
 */

import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const EMAIL = "maheshmishra1691@gmail.com";
const LIFETIME_DATE = "9999-12-31 23:59:59+00";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || "finsieve_db",
  user: process.env.DB_USER || "finsieve_user",
  password: process.env.DB_PASSWORD,
};

async function main() {
  const client = new pg.Client(dbConfig);
  try {
    await client.connect();

    // Check if subscription_expires column exists
    const colRes = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'users' AND column_name IN ('subscription_expires', 'updated_at')`,
    );
    const hasSubscriptionExpires = colRes.rows.some((r) => r.column_name === "subscription_expires");
    const hasUpdatedAt = colRes.rows.some((r) => r.column_name === "updated_at");

    const setClauses = ["user_tier = 'premium'"];
    const returningCols = ["id", "email", "user_tier"];
    if (hasSubscriptionExpires) {
      setClauses.push("subscription_expires = $1::timestamptz");
      returningCols.push("subscription_expires");
    }
    if (hasUpdatedAt) {
      setClauses.push("updated_at = CURRENT_TIMESTAMP");
      returningCols.push("updated_at");
    }

    const params = hasSubscriptionExpires ? [LIFETIME_DATE, EMAIL] : [EMAIL];
    const res = await client.query(
      `UPDATE users SET ${setClauses.join(", ")} WHERE email = $${params.length} RETURNING ${returningCols.join(", ")}`,
      params,
    );
    if (res.rowCount === 0) {
      console.log(`No user found with email: ${EMAIL}. Nothing updated.`);
      return;
    }
    const row = res.rows[0];
    console.log("✅ Updated successfully:");
    console.log("   Email:", row.email);
    console.log("   Tier:", row.user_tier);
    if (row.subscription_expires) console.log("   Subscription expires:", row.subscription_expires);
    if (row.updated_at) console.log("   Updated at:", row.updated_at);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
