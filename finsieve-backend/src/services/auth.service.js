import bcrypt from "bcryptjs";
import crypto from "crypto";
import { query } from "../config/database.js";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.util.js";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
} from "../utils/email.util.js";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * Register new user
 */
export const register = async ({
  email,
  password,
  firstName,
  lastName,
  phone,
}) => {
  try {
    // Check if email already exists
    const existingEmail = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existingEmail.rows.length > 0) {
      throw new Error("Email already registered");
    }

    // Check if phone already exists
    if (phone) {
      const existingPhone = await query(
        "SELECT id FROM users WHERE phone = $1",
        [phone],
      );

      if (existingPhone.rows.length > 0) {
        throw new Error("Mobile number already registered");
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, user_tier)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, phone, user_tier, is_email_verified, created_at`,
      [email, passwordHash, firstName, lastName, phone || null, "free"],
    );

    const user = result.rows[0];

    // Create default preferences
    await query(
      `INSERT INTO user_preferences (user_id, default_currency, theme)
       VALUES ($1, $2, $3)`,
      [user.id, "INR", "light"],
    );

    // Create default watchlist
    await query(
      `INSERT INTO watchlists (user_id, name, description, is_default)
       VALUES ($1, $2, $3, $4)`,
      [user.id, "My Watchlist", "Default watchlist", true],
    );

    // Generate tokens
    const tokens = generateTokens(user.id, user.email);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokens.refreshToken, expiresAt],
    );

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, verificationToken, verificationExpiresAt],
    );

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.first_name).catch((err) =>
      console.error("Failed to send welcome email:", err),
    );

    // Send verification email (non-blocking)
    sendEmailVerificationEmail(
      user.email,
      user.first_name,
      verificationToken,
    ).catch((err) => console.error("Failed to send verification email:", err));

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        userTier: user.user_tier,
        isEmailVerified: user.is_email_verified,
        createdAt: user.created_at,
      },
      tokens,
    };
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

/**
 * Login user
 */
export const login = async ({ emailOrPhone, password }) => {
  try {
    // Determine if input is email or phone
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone);

    // Get user by email or phone
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, phone, user_tier, 
              is_email_verified, is_active
       FROM users 
       WHERE ${isEmail ? "email" : "phone"} = $1`,
      [emailOrPhone],
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid credentials");
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      throw new Error("Account has been deactivated");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id],
    );

    // Generate tokens
    const tokens = generateTokens(user.id, user.email);

    // Store refresh token (clean up old tokens for this user first)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [user.id]);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokens.refreshToken, expiresAt],
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        userTier: user.user_tier,
        isEmailVerified: user.is_email_verified,
      },
      tokens,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if token exists and is not revoked
    const result = await query(
      `SELECT user_id, expires_at, revoked_at
       FROM refresh_tokens
       WHERE token = $1`,
      [refreshToken],
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid refresh token");
    }

    const tokenRecord = result.rows[0];

    if (tokenRecord.revoked_at) {
      throw new Error("Refresh token has been revoked");
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      throw new Error("Refresh token has expired");
    }

    // Generate new tokens
    const tokens = generateTokens(tokenRecord.user_id, decoded.email);

    // Store new refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [tokenRecord.user_id, tokens.refreshToken, expiresAt],
    );

    // Revoke old refresh token
    await query(
      `UPDATE refresh_tokens 
       SET revoked_at = CURRENT_TIMESTAMP,
           replaced_by = (SELECT id FROM refresh_tokens WHERE token = $1)
       WHERE token = $2`,
      [tokens.refreshToken, refreshToken],
    );

    return tokens;
  } catch (error) {
    console.error("Token refresh error:", error);
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = async (refreshToken) => {
  try {
    // Revoke refresh token
    await query(
      "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token = $1",
      [refreshToken],
    );

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (email) => {
  try {
    // Check if user exists
    const result = await query(
      "SELECT id, first_name, email FROM users WHERE email = $1",
      [email],
    );

    // Don't reveal if user exists or not (security)
    if (result.rows.length === 0) {
      return { success: true };
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt],
    );

    // Send password reset email (non-blocking)
    sendPasswordResetEmail(user.email, user.first_name, resetToken).catch(
      (err) => console.error("Failed to send password reset email:", err),
    );

    return { success: true };
  } catch (error) {
    console.error("Forgot password error:", error);
    throw error;
  }
};

/**
 * Reset password
 */
export const resetPassword = async (token, newPassword) => {
  try {
    // Find valid reset token
    const result = await query(
      `SELECT user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = $1`,
      [token],
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid reset token");
    }

    const resetToken = result.rows[0];

    if (resetToken.used_at) {
      throw new Error("Reset token has already been used");
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      throw new Error("Reset token has expired");
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      resetToken.user_id,
    ]);

    // Mark token as used
    await query(
      "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = $1",
      [token],
    );

    // Revoke all refresh tokens for security
    await query(
      "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL",
      [resetToken.user_id],
    );

    return { success: true };
  } catch (error) {
    console.error("Reset password error:", error);
    throw error;
  }
};

/**
 * Verify email
 */
export const verifyEmail = async (token) => {
  try {
    // Find valid verification token
    const result = await query(
      `SELECT user_id, expires_at, verified_at
       FROM email_verification_tokens
       WHERE token = $1`,
      [token],
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid verification token");
    }

    const verificationToken = result.rows[0];

    if (verificationToken.verified_at) {
      throw new Error("Email has already been verified");
    }

    if (new Date(verificationToken.expires_at) < new Date()) {
      throw new Error("Verification token has expired");
    }

    // Mark email as verified
    await query("UPDATE users SET is_email_verified = true WHERE id = $1", [
      verificationToken.user_id,
    ]);

    // Mark token as used
    await query(
      "UPDATE email_verification_tokens SET verified_at = CURRENT_TIMESTAMP WHERE token = $1",
      [token],
    );

    return { success: true };
  } catch (error) {
    console.error("Email verification error:", error);
    throw error;
  }
};

/**
 * Resend email verification
 */
export const resendEmailVerification = async (email) => {
  try {
    // Get user
    const userResult = await query(
      "SELECT id, first_name, email, is_email_verified FROM users WHERE email = $1",
      [email],
    );

    if (userResult.rows.length === 0) {
      throw new Error("User not found");
    }

    const user = userResult.rows[0];

    if (user.is_email_verified) {
      throw new Error("Email is already verified");
    }

    // Invalidate old tokens
    await query(
      "UPDATE email_verification_tokens SET verified_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND verified_at IS NULL",
      [user.id],
    );

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, verificationToken, verificationExpiresAt],
    );

    // Send verification email
    await sendEmailVerificationEmail(
      user.email,
      user.first_name,
      verificationToken,
    );

    return { success: true, message: "Verification email sent" };
  } catch (error) {
    console.error("Resend verification error:", error);
    throw error;
  }
};

export default {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendEmailVerification,
};
