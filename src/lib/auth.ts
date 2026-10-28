import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const AUTH_COOKIE = "jt_auth";
// In production a missing JWT_SECRET must fail closed, never fall back to a
// value that is public in this repo.
function secret(): string {
  const value = process.env.JWT_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is not set");
  return "dev-only-secret";
}

export type SessionPayload = { username: string };

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: "30d" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, secret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function setSessionCookie(token: string) {
  return {
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function clearSessionCookie() {
  return {
    name: AUTH_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
