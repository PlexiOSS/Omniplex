import { ApiError } from "@/lib/api/client";

// All 5xx statuses + 408 mean something is broken on the backend
const SERVER_ERROR_STATUSES = new Set([408, 500, 502, 503, 504]);

/**
 * Returns true when the error indicates the API is unreachable or overloaded,
 * as opposed to a client mistake (4xx) or an unexpected runtime bug.
 */
export function isApiUnavailable(error: unknown): boolean {
  if (error instanceof ApiError) {
    return SERVER_ERROR_STATUSES.has(error.status);
  }
  // Network-level failure (no response at all)
  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
    return true;
  }
  return false;
}

/**
 * Narrow the error boundary `error` prop (a plain serialised Error from Next.js)
 * to decide whether to show the "service unavailable" UI.
 *
 * Because Next.js serialises server errors before passing them to client
 * error boundaries, we can only inspect `name` and `message` — not custom
 * properties like `status`.  We look for the patterns we control.
 */
export function isBoundaryApiError(error: Error): boolean {
  if (error.name === "ApiError") return true;
  // Network errors thrown by fetch in server components
  if (error.name === "TypeError" && error.message.toLowerCase().includes("fetch")) {
    return true;
  }
  return false;
}
