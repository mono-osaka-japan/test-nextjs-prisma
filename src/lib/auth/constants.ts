// Auth constants - shared between Edge Runtime (middleware) and Node.js runtime
// These are pure values with no side effects, safe for both environments

export const AUTH_COOKIE_NAME = "auth-token";
export const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Get JWT secret.
 * IMPORTANT: JWT_SECRET must be set at build time for edge middleware.
 * In production, fails if JWT_SECRET is not set.
 * In development, uses a default with warning.
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      // In production, JWT_SECRET is required - no placeholders allowed
      // This ensures build fails if not set, preventing insecure deployments
      throw new Error(
        "JWT_SECRET environment variable is required. " +
        "Set it in your deployment environment or .env.production file."
      );
    }
    // Development fallback - warn but allow
    if (typeof console !== "undefined") {
      console.warn(
        "WARNING: JWT_SECRET not set. Using development default. " +
        "Set JWT_SECRET in production."
      );
    }
    return new TextEncoder().encode("dev-only-secret-do-not-use-in-production");
  }
  return new TextEncoder().encode(secret);
}
