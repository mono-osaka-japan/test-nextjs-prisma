import { NextRequest, NextResponse } from "next/server";
import { validateSession, AUTH_COOKIE_OPTIONS } from "@/lib/services/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_OPTIONS.name)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await validateSession(token);

    if (!user) {
      const response = NextResponse.json(
        { error: "Session expired or invalid" },
        { status: 401 }
      );
      response.cookies.delete(AUTH_COOKIE_OPTIONS.name);
      return response;
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
