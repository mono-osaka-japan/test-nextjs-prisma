// Auth configuration - centralized settings for Node.js runtime
// Re-exports constants and adds Node.js specific config

import {
  AUTH_COOKIE_NAME,
  SESSION_DURATION,
  getJwtSecret,
} from "./constants";

export { AUTH_COOKIE_NAME, SESSION_DURATION, getJwtSecret };

export const AUTH_CONFIG = {
  get JWT_SECRET() {
    return getJwtSecret();
  },
  COOKIE_NAME: AUTH_COOKIE_NAME,
  SESSION_DURATION,
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
} as const;
