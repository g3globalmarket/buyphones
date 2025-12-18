import axios from "axios";
import {
  getAdminAccessToken,
  clearAdminAccessToken,
} from "../auth/adminAuthStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include JWT authentication header
adminApiClient.interceptors.request.use(
  (config) => {
    // Ensure headers object exists
    if (!config.headers) {
      config.headers = {} as any;
    }

    // Get JWT token
    const jwt = getAdminAccessToken();

    // Log for debugging
    const currentUrl = `${config.method?.toUpperCase()} ${config.url}`;
    const hasJWT = !!jwt && jwt.trim().length > 0;

    console.log("[AdminApiClient] Request:", {
      url: currentUrl,
      tokenKey: "pb_admin_access_token (JWT)",
      authHeader: hasJWT ? "SET" : "NONE",
      hasJWT,
    });

    // Set JWT Authorization header
    if (hasJWT) {
      config.headers["Authorization"] = `Bearer ${jwt.trim()}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 (unauthorized)
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("[AdminApiClient] 401 Unauthorized - clearing JWT token");
      // Clear JWT token and admin user data
      clearAdminAccessToken();
      try {
        localStorage.removeItem("pb_admin_user");
      } catch (e) {
        // Ignore storage errors
      }
      // Redirect to admin login
      window.location.href = "/admin";
    }
    return Promise.reject(error);
  }
);
