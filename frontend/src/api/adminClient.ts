import axios from "axios";
import { adminAuth } from "../utils/adminAuth";
import {
  getAdminAccessToken,
  clearAdminAccessToken,
} from "../auth/adminAuthStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Builds admin authentication headers prioritizing JWT over legacy token
 * - JWT token: Authorization Bearer header (primary method)
 * - Legacy token: X-Admin-Token header (fallback only if JWT is missing)
 */
function buildAdminAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  // Prioritize JWT token (new method)
  const jwt = getAdminAccessToken();
  if (jwt && jwt.trim().length > 0) {
    headers["Authorization"] = `Bearer ${jwt.trim()}`;
    return headers; // JWT found, skip legacy token
  }

  // Fallback to legacy admin token only if JWT is not available
  const legacyToken = adminAuth.getToken();
  if (legacyToken) {
    const trimmedToken = String(legacyToken).trim();
    if (trimmedToken.length > 0) {
      headers["x-admin-token"] = trimmedToken;
    }
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

    // Build auth headers (JWT prioritized, legacy as fallback)
    const authHeaders = buildAdminAuthHeaders();

    // Log for debugging
    const currentUrl = `${config.method?.toUpperCase()} ${config.url}`;
    const tokenKey = getAdminAccessToken()
      ? "pb_admin_access_token (JWT)"
      : "admin_token (legacy)";
    const authHeader =
      authHeaders["Authorization"] || authHeaders["x-admin-token"]
        ? "SET"
        : "NONE";

    console.log("[AdminApiClient] Request:", {
      url: currentUrl,
      tokenKey,
      authHeader,
      hasJWT: !!getAdminAccessToken(),
      hasLegacy: !!adminAuth.getToken(),
    });

    // Set JWT Authorization header if available (prioritized)
    if (authHeaders["Authorization"]) {
      config.headers["Authorization"] = authHeaders["Authorization"];
    }

    // Set legacy admin token header only if JWT is not present
    if (authHeaders["x-admin-token"]) {
      config.headers["x-admin-token"] = authHeaders["x-admin-token"];
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
      console.warn("[AdminApiClient] 401 Unauthorized - clearing tokens");
      // Clear both JWT and legacy tokens on 401
      clearAdminAccessToken();
      adminAuth.removeToken();
      // Redirect to admin login
      window.location.href = "/admin";
    }
    return Promise.reject(error);
  }
);
