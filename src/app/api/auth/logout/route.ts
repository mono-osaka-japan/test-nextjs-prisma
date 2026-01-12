import { NextRequest, NextResponse } from "next/server";
import { logout, AUTH_COOKIE_OPTIONS } from "@/lib/services/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_OPTIONS.name)?.value;

    if (token) {
      await logout(token);
    }

    const response = NextResponse.json({
      message: "Logout successful",
    });

    response.cookies.delete(AUTH_COOKIE_OPTIONS.name);

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
