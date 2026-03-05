import { body, validationResult } from "express-validator";

/**
 * Validation middleware wrapper
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    console.log("🔍 Validator - Request Body:", req.body);

    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      console.log("✅ Validation passed");
      return next();
    }

    // Format errors
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    console.error("❌ Validation errors:", formattedErrors);

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
  };
};

/**
 * Registration validation
 */
export const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#\-+.,:;(){}[\]|~^<>=])[A-Za-z\d@$!%*?&_#\-+.,:;(){}[\]|~^<>=]+$/,
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),

  body("firstName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("First name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "First name can only contain letters, spaces, hyphens, and apostrophes",
    ),

  body("lastName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Last name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Last name can only contain letters, spaces, hyphens, and apostrophes",
    ),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage(
      "Please provide a valid mobile number (7-15 digits, optional + prefix)",
    ),
];

/**
 * Login validation — accepts email or phone number
 */
export const loginValidation = [
  body("emailOrPhone")
    .trim()
    .notEmpty()
    .withMessage("Email or mobile number is required")
    .custom((value) => {
      // Check if it looks like an email
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      // Check if it looks like a phone number (digits, optional + prefix)
      const isPhone = /^\+?[1-9]\d{6,14}$/.test(value);
      if (!isEmail && !isPhone) {
        throw new Error(
          "Please provide a valid email address or mobile number",
        );
      }
      return true;
    }),

  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Forgot password validation
 */
export const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

/**
 * Reset password validation
 */
export const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
];

/**
 * Refresh token validation
 */
export const refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

/**
 * Email verification validation
 */
export const verifyEmailValidation = [
  body("token").notEmpty().withMessage("Verification token is required"),
];

/**
 * Resend verification email validation
 */
export const resendVerificationValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

export default {
  validate,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  refreshTokenValidation,
  verifyEmailValidation,
  resendVerificationValidation,
};
