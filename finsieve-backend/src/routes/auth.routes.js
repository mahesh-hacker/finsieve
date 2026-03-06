import express from "express";
import * as authController from "../controllers/auth.controller.js";
import * as authValidator from "../validators/auth.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  decryptRequest,
  encryptResponse,
} from "../middleware/encryption.middleware.js";

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  "/register",
  decryptRequest,
  encryptResponse,
  authValidator.validate(authValidator.registerValidation),
  authController.register,
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  "/login",
  decryptRequest,
  encryptResponse,
  authValidator.validate(authValidator.loginValidation),
  authController.login,
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  "/refresh",
  authValidator.validate(authValidator.refreshTokenValidation),
  authController.refresh,
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post("/logout", authController.logout);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  "/forgot-password",
  decryptRequest,
  encryptResponse,
  authValidator.validate(authValidator.forgotPasswordValidation),
  authController.forgotPassword,
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  "/reset-password",
  decryptRequest,
  encryptResponse,
  authValidator.validate(authValidator.resetPasswordValidation),
  authController.resetPassword,
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post(
  "/verify-email",
  decryptRequest,
  encryptResponse,
  authValidator.validate(authValidator.verifyEmailValidation),
  authController.verifyEmail,
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post(
  "/resend-verification",
  decryptRequest,
  encryptResponse,
  authValidator.validate(authValidator.resendVerificationValidation),
  authController.resendVerification,
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get("/me", authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/v1/auth/verify-password
 * @desc    Verify current user's password (pre-flight for sensitive actions)
 * @access  Private
 */
router.post("/verify-password", authenticate, authController.verifyPassword);

/**
 * @route   DELETE /api/v1/auth/account
 * @desc    Permanently delete authenticated user's account
 * @access  Private
 */
router.delete("/account", authenticate, authController.deleteAccount);

export default router;
