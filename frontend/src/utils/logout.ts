import { clearUserToken } from "../auth/authStore";

/**
 * Central logout function
 * Clears auth token and redirects to login page
 * @param reason Optional reason for logout (for future toast notifications)
 */
export function logout(reason?: string): void {
  // Clear token from storage
  clearUserToken();

  // TODO: Use reason for future toast notifications
  if (reason) {
    // Future: show toast notification with reason
  }

  // Redirect to login page
  // Use window.location to ensure full page reload and clear any state
  window.location.href = "/login";
}
