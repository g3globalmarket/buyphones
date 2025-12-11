/**
 * Authentication configuration
 */

// Inactivity timeout in milliseconds
// Default: 30 minutes
export const INACTIVITY_TIMEOUT_MS =
  (Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES) || 30) * 60 * 1000;

// Warning offset: how long before timeout to show warning
// Default: 5 minutes
const WARNING_OFFSET_MINUTES =
  Number(import.meta.env.VITE_INACTIVITY_WARNING_MINUTES) || 5;
const WARNING_OFFSET_MS = WARNING_OFFSET_MINUTES * 60 * 1000;

// Ensure warning offset is less than timeout (clamp to timeout - 1 minute minimum)
export const INACTIVITY_WARNING_OFFSET_MS = Math.min(
  WARNING_OFFSET_MS,
  Math.max(INACTIVITY_TIMEOUT_MS - 60_000, 60_000) // At least 1 minute before timeout
);

// Warning threshold: when to show the warning
export const INACTIVITY_WARNING_THRESHOLD_MS =
  INACTIVITY_TIMEOUT_MS - INACTIVITY_WARNING_OFFSET_MS;
