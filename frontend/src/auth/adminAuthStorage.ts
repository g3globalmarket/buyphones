/**
 * Admin JWT token storage utility
 *
 * This module handles storage of admin JWT tokens (from /admin/auth/login).
 * It is separate from the legacy ADMIN_TOKEN storage in utils/adminAuth.ts.
 *
 * TODO: In a future task, we can wire this into admin API clients to use JWT
 * instead of X-Admin-Token header.
 */

const ADMIN_JWT_STORAGE_KEY = "pb_admin_access_token";

export function saveAdminAccessToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_JWT_STORAGE_KEY, token);
  } catch {
    // Ignore storage errors (e.g., quota exceeded, private browsing)
  }
}

export function getAdminAccessToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_JWT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearAdminAccessToken(): void {
  try {
    localStorage.removeItem(ADMIN_JWT_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if admin JWT token exists
 */
export function hasAdminAccessToken(): boolean {
  return !!getAdminAccessToken();
}
