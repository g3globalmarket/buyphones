/**
 * Admin JWT token storage utility
 *
 * Stores admin JWT access token in localStorage under "pb_admin_access_token".
 * This token is used by adminApiClient as: Authorization: Bearer <token>
 */

const ADMIN_ACCESS_TOKEN_KEY = "pb_admin_access_token";

/** Save admin JWT access token */
export function setAdminAccessToken(token: string): void {
  try {
    const normalized = (token ?? "").trim();
    if (!normalized) return;
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, normalized);
  } catch {
    // ignore storage errors
  }
}

/** Read admin JWT access token */
export function getAdminAccessToken(): string | null {
  try {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    const normalized = (token ?? "").trim();
    return normalized.length ? normalized : null;
  } catch {
    return null;
  }
}

/** Remove admin JWT access token */
export function clearAdminAccessToken(): void {
  try {
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

/** True if token exists */
export function hasAdminAccessToken(): boolean {
  return !!getAdminAccessToken();
}

