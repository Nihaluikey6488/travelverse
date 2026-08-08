import type { CookieOptions } from "express";
import { env } from "../../config/env";

export const AUTH_COOKIE_NAME = "travelverse_session";
export const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

export function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    maxAge: JWT_EXPIRES_IN_SECONDS * 1000,
    path: "/",
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
  };
}
