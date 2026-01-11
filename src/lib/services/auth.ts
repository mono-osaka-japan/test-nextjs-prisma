import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface JWTAuthPayload extends JWTPayload {
  userId: string;
  sessionId: string;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function createSession(userId: string): Promise<string> {
  const expires = new Date(Date.now() + SESSION_DURATION * 1000);

  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken: crypto.randomUUID(),
      expires,
    },
  });

  const token = await new SignJWT({
    userId,
    sessionId: session.id,
  } as JWTAuthPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<JWTAuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTAuthPayload;
  } catch {
    return null;
  }
}

export async function validateSession(
  token: string
): Promise<AuthUser | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string } | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  const token = await createSession(user.id);

  await prisma.auditLog.create({
    data: {
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      userId: user.id,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
  };
}

export async function logout(token: string): Promise<boolean> {
  const payload = await verifyToken(token);
  if (!payload) return false;

  try {
    const session = await prisma.session.delete({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    await prisma.auditLog.create({
      data: {
        action: "LOGOUT",
        entity: "User",
        entityId: session.userId,
        userId: session.userId,
      },
    });

    return true;
  } catch {
    return false;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) return null;

  return validateSession(token);
}

export function setAuthCookie(token: string): void {
  // This function returns cookie options for the response
  // Cookie setting is done in the API route
}

export const AUTH_COOKIE_OPTIONS = {
  name: "auth-token",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION,
};
