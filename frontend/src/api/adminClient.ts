import axios from "axios";
import { adminAuth } from "../utils/adminAuth";
import { getAdminAccessToken } from "../auth/adminAuthStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Builds admin authentication headers combining legacy token and JWT
 * - Legacy token: X-Admin-Token header (for backward compatibility)
 * - JWT token: Authorization Bearer header (new JWT-based auth)
 * Both headers are sent if available, ensuring compatibility with both auth methods
 */
function buildAdminAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  // Legacy admin token (keep this for backward compatibility)
  const legacyToken = adminAuth.getToken();
  if (legacyToken) {
    const trimmedToken = String(legacyToken).trim();
    headers["x-admin-token"] = trimmedToken;
  }

  // New JWT-based admin token
  const jwt = getAdminAccessToken();
  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`;
  }

  return headers;
}

// Add request interceptor to include admin authentication headers
adminApiClient.interceptors.request.use(
  (config) => {
    // Ensure headers object exists
    if (!config.headers) {
      config.headers = {} as any;
    }

    // Build auth headers (legacy + JWT)
    const authHeaders = buildAdminAuthHeaders();

    // Set legacy admin token header if available
    if (authHeaders["x-admin-token"]) {
      config.headers["x-admin-token"] = authHeaders["x-admin-token"];
    }

    // Set JWT Authorization header if available
    if (authHeaders["Authorization"]) {
      config.headers["Authorization"] = authHeaders["Authorization"];
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
      // Token is invalid, remove it
      adminAuth.removeToken();
      // Redirect to admin login
      window.location.href = "/admin";
    }
    return Promise.reject(error);
  }
);
