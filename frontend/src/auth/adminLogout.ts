import { adminAuth } from "../utils/adminAuth";
import { clearAdminAccessToken } from "./adminAuthStorage";

/**
 * Unified admin logout function
 * Clears both legacy admin token and JWT token, then redirects to login page
 */
export function logoutAdmin(): void {
  try {
    // Clear legacy admin token
    adminAuth.removeToken();
  } catch {
    // Ignore errors, logout should be best-effort
  }

  try {
    // Clear JWT-based admin token
    clearAdminAccessToken();
  } catch {
    // Ignore errors, logout should be best-effort
  }
}
