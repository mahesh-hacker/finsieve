// Authentication Types

export interface LoginCredentials {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    userTier: string;
    emailVerified: boolean;
    createdAt: string;
  };
}

export interface OAuthProvider {
  provider: "google" | "apple";
  token: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface VerificationData {
  token: string;
}
