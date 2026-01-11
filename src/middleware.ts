import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

const AUTH_COOKIE_NAME = "auth-token";

// Routes that require authentication
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      // Token is invalid or expired
      isAuthenticated = false;
    }
  }

  // Check protected API routes
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedApiRoute && !isAuthenticated) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Check protected pages
  const isProtectedPage = PROTECTED_PAGES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check auth pages (redirect to dashboard if already authenticated)
  const isAuthPage = AUTH_PAGES.some((route) => pathname.startsWith(route));

  if (isAuthPage && isAuthenticated) {
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
