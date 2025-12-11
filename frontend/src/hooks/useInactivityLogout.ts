import { useEffect, useRef } from "react";
import { isLoggedIn } from "../auth/authStore";
import { logout } from "../utils/logout";
import {
  INACTIVITY_TIMEOUT_MS,
  INACTIVITY_WARNING_THRESHOLD_MS,
} from "../config/auth";

const INACTIVITY_WARNING_ID = "inactivity-warning-notification";

/**
 * Shows an inactivity warning to the user
 * Uses a simple non-blocking approach
 */
function showInactivityWarning() {
  // Remove any existing notification first
  const existing = document.getElementById(INACTIVITY_WARNING_ID);
  if (existing) {
    existing.remove();
  }

  // Create a simple notification element
  const notification = document.createElement("div");
  notification.id = INACTIVITY_WARNING_ID;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #fef3c7;
    border: 2px solid #facc15;
    border-radius: 8px;
    padding: 1rem 1.25rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    max-width: 320px;
    font-size: 0.9rem;
    color: #92400e;
    font-weight: 500;
  `;
  notification.textContent =
    "비활성 상태로 인해 곧 로그아웃됩니다. 마우스를 움직이거나 키를 누르면 로그인 상태가 유지됩니다.";

  document.body.appendChild(notification);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = "0";
      notification.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, 10000);
}

/**
 * Custom hook to handle inactivity-based auto logout
 * Tracks user activity and logs out after a period of inactivity
 */
export function useInactivityLogout() {
  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasShownWarningRef = useRef<boolean>(false);

  useEffect(() => {
    // Only track inactivity if user is logged in
    if (!isLoggedIn()) {
      return;
    }

    // Update last activity timestamp on user interaction
    const updateActivity = () => {
      // Only update activity if user is still logged in
      if (!isLoggedIn()) {
        return;
      }
      lastActivityRef.current = Date.now();
      // Reset warning flag when user becomes active again
      hasShownWarningRef.current = false;
    };

    // Events to track for user activity
    const activityEvents: (keyof WindowEventMap)[] = [
      "mousemove",
      "keydown",
      "click",
      "touchstart",
      "scroll",
    ];

    // Attach event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for inactivity periodically
    checkIntervalRef.current = setInterval(() => {
      // Guard: only run inactivity logic if user is logged in
      if (!isLoggedIn()) {
        // User logged out, stop checking
        return;
      }

      const timeSinceLastActivity = Date.now() - lastActivityRef.current;

      // Check if we should logout (full timeout reached)
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT_MS) {
        logout("inactivity");
        return;
      }

      // Check if we should show warning
      if (
        timeSinceLastActivity >= INACTIVITY_WARNING_THRESHOLD_MS &&
        !hasShownWarningRef.current
      ) {
        showInactivityWarning();
        hasShownWarningRef.current = true;
      }
    }, 60000); // Check every minute

    // Cleanup function
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []); // Run once on mount
}
