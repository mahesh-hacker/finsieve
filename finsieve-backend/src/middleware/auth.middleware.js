import { verifyAccessToken } from "../utils/jwt.util.js";
import { query } from "../config/database.js";

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const result = await query(
      `SELECT id, email, first_name, last_name, user_tier, is_email_verified, is_active, created_at
       FROM users
       WHERE id = $1`,
      [decoded.userId],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated.",
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userTier: user.user_tier,
      isEmailVerified: user.is_email_verified,
      createdAt: user.created_at,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const result = await query(
      `SELECT id, email, first_name, last_name, user_tier, is_email_verified, is_active, created_at
       FROM users
       WHERE id = $1 AND is_active = true`,
      [decoded.userId],
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userTier: user.user_tier,
        isEmailVerified: user.is_email_verified,
        createdAt: user.created_at,
      };
    }

    next();
  } catch (error) {
    // Token invalid, but that's okay for optional auth
    next();
  }
};

/**
 * Require email verification
 */
export const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email address to access this feature.",
    });
  }
  next();
};

/**
 * Check user tier
 */
export const requireTier = (minTier) => {
  const tierLevels = {
    free: 0,
    basic: 1,
    premium: 2,
    enterprise: 3,
  };

  return (req, res, next) => {
    const userTierLevel = tierLevels[req.user.userTier] || 0;
    const requiredTierLevel = tierLevels[minTier] || 0;

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({
        success: false,
        message: `This feature requires a ${minTier} subscription or higher.`,
        currentTier: req.user.userTier,
        requiredTier: minTier,
      });
    }

    next();
  };
};

export default {
  authenticate,
  optionalAuth,
  requireEmailVerification,
  requireTier,
};
