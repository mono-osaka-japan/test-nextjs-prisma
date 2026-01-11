import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME, getJwtSecret } from "@/lib/auth/constants";

// Routes that require authentication (API routes need session validation in handlers)
const PROTECTED_API_ROUTES = [
  "/api/posts",
  "/api/comments",
  "/api/users",
  "/api/profile",
];

// Routes that should redirect to login if not authenticated
const PROTECTED_PAGES = [
  "/dashboard",
  "/profile",
  "/settings",
];

// Routes that should redirect to dashboard if already authenticated
const AUTH_PAGES = [
  "/login",
  "/register",
];

interface JWTPayloadWithSession {
  userId: string;
  sessionId: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  let isJwtValid = false;
  let payload: JWTPayloadWithSession | null = null;

  if (token) {
    try {
      const result = await jwtVerify(token, getJwtSecret());
      payload = result.payload as unknown as JWTPayloadWithSession;
      isJwtValid = true;
    } catch {
      // Token is invalid or expired
      isJwtValid = false;
    }
  }

  // Check protected API routes
  // Note: Middleware only validates JWT. Each API handler MUST call validateSession()
  // to verify the session exists in DB (handles logout/forced invalidation)
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedApiRoute) {
    if (!isJwtValid || !payload) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    // Pass session info to API handlers for DB validation
    // Must modify request headers (not response) to pass to downstream handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-auth-user-id", payload.userId);
    requestHeaders.set("x-auth-session-id", payload.sessionId);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Check protected pages
  const isProtectedPage = PROTECTED_PAGES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedPage && !isJwtValid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check auth pages (redirect to dashboard if already authenticated)
  const isAuthPage = AUTH_PAGES.some((route) => pathname.startsWith(route));

  if (isAuthPage && isJwtValid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
