import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

// Fail fast at module load — missing secrets mean no auth works at all
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  const hint = process.env.RAILWAY_ENVIRONMENT
    ? "In Railway: open your service → Variables → add JWT_SECRET (at least 32 characters). Generate one: openssl rand -hex 32"
    : "Set JWT_SECRET in .env (or env) with at least 32 characters. Example: openssl rand -hex 32";
  throw new Error(`FATAL: JWT_SECRET must be set and at least 32 characters long. ${hint}`);
}
if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
  const hint = process.env.RAILWAY_ENVIRONMENT
    ? "In Railway: open your service → Variables → add JWT_REFRESH_SECRET (at least 32 characters). Use a different value than JWT_SECRET."
    : "Set JWT_REFRESH_SECRET in .env with at least 32 characters (different from JWT_SECRET).";
  throw new Error(`FATAL: JWT_REFRESH_SECRET must be set and at least 32 characters long. ${hint}`);
}

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (userId, email) => {
  return jwt.sign(
    {
      userId,
      email,
      type: "access",
    },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRY },
  );
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (userId, email) => {
  return jwt.sign(
    {
      userId,
      email,
      type: "refresh",
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY },
  );
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokens = (userId, email) => {
  const accessToken = generateAccessToken(userId, email);
  const refreshToken = generateRefreshToken(userId, email);

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_ACCESS_EXPIRY,
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== "access") {
      throw new Error("Invalid token type");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Get token expiry time in milliseconds
 */
export const getTokenExpiry = (expiryString) => {
  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const match = expiryString.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // Default 15 minutes

  const [, value, unit] = match;
  return parseInt(value) * units[unit];
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiry,
};
