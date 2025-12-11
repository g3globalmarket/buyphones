import axios, { AxiosError } from "axios";
import { getUserToken } from "../auth/authStore";
import { logout } from "../utils/logout";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getUserToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If FormData is being sent, let axios set Content-Type automatically with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401 (unauthorized) globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      // Don't logout on login endpoints
      if (
        !url.includes("/auth/request-code") &&
        !url.includes("/auth/verify-code")
      ) {
        // Use central logout function
        logout("token-expired");
      }
    }
    return Promise.reject(error);
  }
);
