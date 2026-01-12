import { NextRequest, NextResponse } from "next/server";
import { validateSessionById, AuthUser } from "@/lib/services/auth";

/**
 * Require authentication for API routes.
 * This validates the session exists in DB (handles logout/forced invalidation).
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
  // Session ID is passed from middleware after JWT validation
  const sessionId = request.headers.get("x-auth-session-id");

  if (!sessionId) {
    return {
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  // Validate session exists in DB (catches logout/force invalidation)
  const user = await validateSessionById(sessionId);

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
