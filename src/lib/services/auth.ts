import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { AUTH_CONFIG } from "@/lib/auth/config";

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
  const expires = new Date(Date.now() + AUTH_CONFIG.SESSION_DURATION * 1000);

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
    .sign(AUTH_CONFIG.JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<JWTAuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_CONFIG.JWT_SECRET);
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

export const AUTH_COOKIE_OPTIONS = {
  name: AUTH_CONFIG.COOKIE_NAME,
  httpOnly: AUTH_CONFIG.COOKIE_OPTIONS.httpOnly,
  secure: AUTH_CONFIG.COOKIE_OPTIONS.secure,
  sameSite: AUTH_CONFIG.COOKIE_OPTIONS.sameSite,
  path: AUTH_CONFIG.COOKIE_OPTIONS.path,
  maxAge: AUTH_CONFIG.SESSION_DURATION,
};

/**
 * Validate session by sessionId (for use with middleware-passed session info)
 * This ensures session exists in DB even if JWT is valid (handles logout/force invalidation)
 */
export async function validateSessionById(
  sessionId: string
): Promise<AuthUser | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
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
