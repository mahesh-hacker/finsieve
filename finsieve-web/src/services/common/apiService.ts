import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { encryptData, decryptData } from "../../utils/encryption";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "X-Encrypted": "true",  // tell backend to encrypt all responses
      },
    });

    // ── Request interceptor ───────────────────────────────────────────────────
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) config.headers.Authorization = `Bearer ${token}`;

        // Encrypt request body with AES-256-GCM when data is present
        if (config.data) {
          const encrypted = await encryptData(config.data);
          config.data = { encrypted };
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    // ── Response interceptor ─────────────────────────────────────────────────
    this.axiosInstance.interceptors.response.use(
      async (response) => {
        if (response.data?.encrypted) {
          const decrypted = await decryptData(response.data.encrypted);
          if (decrypted) response.data = decrypted;
        }
        return response;
      },
      async (error) => {
        // Decrypt encrypted error responses
        if (error.response?.data?.encrypted) {
          const decrypted = await decryptData(error.response.data.encrypted);
          if (decrypted) error.response.data = decrypted;
        }

        const originalRequest = error.config;

        // Auto-refresh on 401 (but not on auth endpoints themselves)
        if (error.response?.status === 401 && !originalRequest._retry) {
          const isAuthEndpoint =
            originalRequest.url?.includes("/auth/login") ||
            originalRequest.url?.includes("/auth/register");

          if (isAuthEndpoint) return Promise.reject(error);

          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) throw new Error("No refresh token");

            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", newRefreshToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.axiosInstance(originalRequest);
          } catch {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data, config);
    return response.data;
  }
}

export default new ApiService();
