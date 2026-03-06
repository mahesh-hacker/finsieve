import * as authService from "../services/auth.service.js";
import { sendAccountDeletionEmail } from "../utils/email.util.js";

/**
 * Register new user
 * POST /api/v1/auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      phone,
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      },
    });
  } catch (error) {
    // Unwrap AggregateError (e.g. from bcrypt or multiple failures) to get the real cause
    const err = error?.errors?.[0] || error;
    const msg = err?.message || error?.message || String(error);
    const code = err?.code ?? error?.code;
    console.error("Register controller error:", msg, code ? `[${code}]` : "", error?.errors?.length ? `(AggregateError, ${error.errors.length} errors)` : "");

    if (msg === "Email already registered") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    if (msg === "Mobile number already registered") {
      return res.status(409).json({
        success: false,
        message: "An account with this mobile number already exists",
      });
    }

    // PostgreSQL: unique violation (email or phone)
    if (code === "23505") {
      const constraint = err?.constraint ?? error?.constraint ?? "";
      if (constraint.includes("email")) {
        return res.status(409).json({ success: false, message: "An account with this email already exists" });
      }
      if (constraint.includes("phone")) {
        return res.status(409).json({ success: false, message: "An account with this mobile number already exists" });
      }
    }

    // PostgreSQL: not null violation
    if (code === "23502") {
      return res.status(400).json({
        success: false,
        message: "Missing required field. Please check your registration data.",
      });
    }

    // PostgreSQL: check constraint (e.g. user_tier)
    if (code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid data. Please check your registration data.",
      });
    }

    // Missing table / relation does not exist
    if (code === "42P01" || (msg && msg.includes("does not exist"))) {
      return res.status(503).json({
        success: false,
        message: "Service temporarily unavailable. Run migration_500_fix.sql on your database.",
        detail: process.env.NODE_ENV !== "production" ? msg : undefined,
      });
    }

    // In development expose details; in production never leak internals
    const detail = process.env.NODE_ENV !== "production"
      ? (error?.errors?.length ? error.errors.map((e) => e?.message || String(e)).join("; ") : msg)
      : undefined;
    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      ...(detail && { detail }),
    });
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    const result = await authService.login({ emailOrPhone, password });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      },
    });
  } catch (error) {
    console.error("Login controller error:", error?.message ?? error);

    if (error?.message === "Invalid credentials") {
      return res.status(401).json({
        success: false,
        message: "Invalid email/mobile number or password",
      });
    }

    if (error?.message === "Account has been deactivated") {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    });
  } catch (error) {
    console.error("Refresh controller error:", error);

    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken);

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout controller error:", error);

    res.status(500).json({
      success: false,
      message: "Logout failed. Please try again.",
    });
  }
};

/**
 * Request password reset
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    await authService.forgotPassword(email);

    res.json({
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link shortly.",
    });
  } catch (error) {
    console.error("Forgot password controller error:", error);

    // Always return success for security (don't reveal if email exists)
    res.json({
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link shortly.",
    });
  }
};

/**
 * Reset password
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    await authService.resetPassword(token, password);

    res.json({
      success: true,
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password controller error:", error);

    if (error.message === "Invalid reset token") {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    if (error.message === "Reset token has already been used") {
      return res.status(400).json({
        success: false,
        message: "This reset link has already been used",
      });
    }

    if (error.message === "Reset token has expired") {
      return res.status(400).json({
        success: false,
        message: "This reset link has expired. Please request a new one.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Password reset failed. Please try again.",
    });
  }
};

/**
 * Verify email
 * POST /api/v1/auth/verify-email
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    await authService.verifyEmail(token);

    res.json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("Verify email controller error:", error);

    if (error.message === "Invalid verification token") {
      return res.status(400).json({
        success: false,
        message: "Invalid verification link",
      });
    }

    if (error.message === "Email has already been verified") {
      return res.status(400).json({
        success: false,
        message: "Email has already been verified",
      });
    }

    if (error.message === "Verification token has expired") {
      return res.status(400).json({
        success: false,
        message: "Verification link has expired. Please request a new one.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Email verification failed. Please try again.",
    });
  }
};

/**
 * Get current user
 * GET /api/v1/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get user information",
    });
  }
};

/**
 * Resend email verification
 * POST /api/v1/auth/resend-verification
 */
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    await authService.resendEmailVerification(email);

    res.json({
      success: true,
      message: "Verification email sent! Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification controller error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    if (error.message === "Email is already verified") {
      return res.status(400).json({
        success: false,
        message: "This email is already verified",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to send verification email. Please try again.",
    });
  }
};

// ── Simple in-memory rate limiter for password-sensitive endpoints ──────────
// Max 5 attempts per user per 10-minute window
const _verifyAttempts = new Map(); // userId → { count, resetAt }
const VERIFY_MAX = 5;
const VERIFY_WINDOW_MS = 10 * 60 * 1000;

function checkVerifyRateLimit(userId) {
  const now = Date.now();
  const entry = _verifyAttempts.get(String(userId));
  if (entry && now < entry.resetAt) {
    if (entry.count >= VERIFY_MAX) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      throw Object.assign(new Error("Too many attempts"), { retryAfter: retryAfterSec });
    }
    entry.count++;
  } else {
    _verifyAttempts.set(String(userId), { count: 1, resetAt: now + VERIFY_WINDOW_MS });
  }
}

/**
 * Verify password (pre-flight check before destructive operations)
 * POST /api/v1/auth/verify-password
 */
export const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    checkVerifyRateLimit(req.user.id);
    await authService.verifyPassword(req.user.id, password);

    // Clear rate-limit counter on success
    _verifyAttempts.delete(String(req.user.id));

    res.json({ success: true, message: "Password verified" });
  } catch (error) {
    if (error.retryAfter) {
      return res.status(429).json({
        success: false,
        message: `Too many attempts. Try again in ${error.retryAfter} seconds.`,
        retryAfter: error.retryAfter,
      });
    }
    if (error.message === "Invalid password") {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }
    console.error("Verify password controller error:", error);
    res.status(500).json({ success: false, message: "Verification failed. Please try again." });
  }
};

/**
 * Permanently delete authenticated user's account
 * DELETE /api/v1/auth/account
 */
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required to delete your account" });
    }

    // Re-verify password as final safeguard
    await authService.verifyPassword(req.user.id, password);

    // Delete account — returns user info for the farewell email
    const { email, firstName, lastName } = await authService.deleteAccount(req.user.id);

    // Send farewell email (non-blocking)
    sendAccountDeletionEmail(email, firstName).catch((err) =>
      console.error("Failed to send account deletion email:", err),
    );

    res.json({
      success: true,
      message: "Account permanently deleted",
      data: { email, firstName, lastName },
    });
  } catch (error) {
    if (error.message === "Invalid password") {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }
    console.error("Delete account controller error:", error);
    res.status(500).json({ success: false, message: "Failed to delete account. Please try again." });
  }
};

export default {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getCurrentUser,
  resendVerification,
  verifyPassword,
  deleteAccount,
};
