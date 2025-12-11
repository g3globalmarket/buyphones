const TOKEN_KEY = "userAccessToken";

export function saveUserToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getUserToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearUserToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Checks if the user is currently logged in
 * @returns true if a valid auth token exists, false otherwise
 */
export function isLoggedIn(): boolean {
  try {
    const token = getUserToken();
    return Boolean(token);
  } catch {
    // Handle case where localStorage is not available (SSR, test environments)
    return false;
  }
}
