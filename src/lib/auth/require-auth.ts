import { NextRequest, NextResponse } from "next/server";
import { validateSession, AuthUser } from "@/lib/services/auth";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

/**
 * Require authentication for API routes.
 * This validates the JWT from httpOnly cookie and checks session in DB.
 *
 * Usage in API route:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth(request);
 *   if (authResult.error) return authResult.error;
 *   const user = authResult.user;
 *   // ... handle authenticated request
 * }
 * ```
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: NextResponse }> {
  // Get JWT token from httpOnly cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  // Validate JWT and check session in DB
  const user = await validateSession(token);

  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Session expired or invalid" },
        { status: 401 }
      ),
    };
  }

  return { user };
}
