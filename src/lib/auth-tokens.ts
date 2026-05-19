import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Role } from "@/lib/rbac";

export const sessionCookieName = "recordshield_session";
const sessionVersion = 1;

export type SessionUser = {
  userId: string;
  email: string;
  role: Role;
};

type SessionPayload = SessionUser & {
  version: number;
  expiresAt: number;
};

type CreateSessionOptions = {
  secret: string;
  now?: Date;
  maxAgeSeconds?: number;
};

export const defaultSessionMaxAgeSeconds = 60 * 60 * 24 * 30;

export function createMagicLinkToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashMagicLinkToken(token: string): string {
  return createHmac("sha256", "recordshield_magic_link").update(token).digest("hex");
}

export function createSessionCookieValue(user: SessionUser, options: CreateSessionOptions): string {
  const now = options.now ?? new Date();
  const maxAgeSeconds = options.maxAgeSeconds ?? defaultSessionMaxAgeSeconds;
  const payload: SessionPayload = {
    ...user,
    version: sessionVersion,
    expiresAt: now.getTime() + maxAgeSeconds * 1000
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload, options.secret);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionCookieValue(value: string | undefined, secret: string, now = new Date()): SessionUser | null {
  if (!value || !secret) {
    return null;
  }

  const [encodedPayload, signature, extra] = value.split(".");
  if (!encodedPayload || !signature || extra) {
    return null;
  }

  const expected = sign(encodedPayload, secret);
  if (!safeEqual(signature, expected)) {
    return null;
  }

  const payload = parsePayload(encodedPayload);
  if (!payload || payload.version !== sessionVersion || payload.expiresAt <= now.getTime()) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role
  };
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function parsePayload(encodedPayload: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (
      parsed.version !== sessionVersion ||
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string" ||
      (parsed.role !== "CUSTOMER" && parsed.role !== "ADMIN") ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
