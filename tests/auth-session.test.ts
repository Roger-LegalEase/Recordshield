import { describe, expect, it } from "vitest";
import {
  createSessionCookieValue,
  createMagicLinkToken,
  hashMagicLinkToken,
  verifySessionCookieValue
} from "@/lib/auth-tokens";

describe("RecordShield auth tokens", () => {
  it("signs and verifies a dashboard session without exposing secrets", () => {
    const cookie = createSessionCookieValue(
      {
        userId: "user_123",
        email: "customer@example.com",
        role: "CUSTOMER"
      },
      {
        secret: "test_secret_value",
        now: new Date("2026-05-19T12:00:00.000Z"),
        maxAgeSeconds: 60
      }
    );

    expect(cookie).not.toContain("test_secret_value");
    expect(verifySessionCookieValue(cookie, "test_secret_value", new Date("2026-05-19T12:00:30.000Z"))).toEqual({
      userId: "user_123",
      email: "customer@example.com",
      role: "CUSTOMER"
    });
  });

  it("rejects tampered or expired dashboard sessions", () => {
    const cookie = createSessionCookieValue(
      {
        userId: "user_123",
        email: "customer@example.com",
        role: "CUSTOMER"
      },
      {
        secret: "test_secret_value",
        now: new Date("2026-05-19T12:00:00.000Z"),
        maxAgeSeconds: 60
      }
    );

    expect(verifySessionCookieValue(`${cookie}x`, "test_secret_value", new Date("2026-05-19T12:00:30.000Z"))).toBeNull();
    expect(verifySessionCookieValue(cookie, "test_secret_value", new Date("2026-05-19T12:02:00.000Z"))).toBeNull();
  });

  it("creates hashable one-time magic link tokens", () => {
    const token = createMagicLinkToken();

    expect(token).toHaveLength(43);
    expect(hashMagicLinkToken(token)).toHaveLength(64);
    expect(hashMagicLinkToken(token)).toBe(hashMagicLinkToken(token));
    expect(hashMagicLinkToken(token)).not.toBe(token);
  });
});
