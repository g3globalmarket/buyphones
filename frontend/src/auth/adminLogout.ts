import { clearAdminAccessToken } from "./adminAuthStorage";

/**
 * Admin logout function
 * Clears JWT token and admin user data, then redirects to login page
 */
export function logoutAdmin(): void {
  try {
    // Clear JWT-based admin token
    clearAdminAccessToken();
    // Clear admin user data
    localStorage.removeItem("pb_admin_user");
  } catch {
    // Ignore errors, logout should be best-effort
  }
}
