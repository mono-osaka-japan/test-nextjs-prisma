import { NextRequest, NextResponse } from "next/server";
import { login, AUTH_COOKIE_OPTIONS } from "@/lib/services/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await login(email, password);

    if (!result) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      user: result.user,
      message: "Login successful",
    });

    response.cookies.set(
      AUTH_COOKIE_OPTIONS.name,
      result.token,
      AUTH_COOKIE_OPTIONS
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
