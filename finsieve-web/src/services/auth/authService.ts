import apiService from "../common/apiService";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  VerificationData,
} from "../../types/auth";
import { ApiResponse } from "../../types/common";

class AuthService {
  async register(data: RegisterData): Promise<ApiResponse<{ email: string }>> {
    return apiService.post("/auth/register", data);
  }

  async verifyEmail(
    data: VerificationData,
  ): Promise<ApiResponse<AuthResponse>> {
    return apiService.post("/auth/verify-email", data);
  }

  async login(
    credentials: LoginCredentials,
  ): Promise<ApiResponse<AuthResponse>> {
    return apiService.post("/auth/login", credentials);
  }

  async loginWithGoogle(token: string): Promise<ApiResponse<AuthResponse>> {
    return apiService.post("/auth/google", { token });
  }

  async loginWithApple(token: string): Promise<ApiResponse<AuthResponse>> {
    return apiService.post("/auth/apple", { token });
  }

  async logout(): Promise<ApiResponse<void>> {
    return apiService.post("/auth/logout");
  }

  async forgotPassword(
    email: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiService.post("/auth/forgot-password", { email });
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiService.post("/auth/reset-password", { token, newPassword });
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return apiService.post("/auth/refresh", { refreshToken });
  }

  async resendVerificationEmail(
    email: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiService.post("/auth/resend-verification", { email });
  }

  async getCurrentUser(): Promise<ApiResponse<AuthResponse["user"]>> {
    return apiService.get("/auth/me");
  }
}

export default new AuthService();
