import { describe, expect, it, vi } from "vitest";
import { consumeDashboardMagicLink, createDashboardMagicLink } from "@/lib/auth-magic-link";

describe("dashboard magic link auth", () => {
  it("creates a user, stores a one-time token hash, and sends a dashboard link", async () => {
    const db = {
      user: {
        upsert: vi.fn(async () => ({ id: "user_123", email: "customer@example.com", role: "CUSTOMER" as const }))
      },
      authMagicLink: {
        create: vi.fn(async () => ({ id: "link_123" }))
      },
      auditEvent: {
        create: vi.fn(async () => ({}))
      }
    };
    const sendEmail = vi.fn(async () => ({ delivered: true }));

    const result = await createDashboardMagicLink(
      db,
      {
        email: " Customer@Example.com ",
        baseUrl: "https://recordshield.vercel.app",
        reason: "payment_received"
      },
      {
        now: new Date("2026-05-19T12:00:00.000Z"),
        sendEmail
      }
    );

    expect(result.email).toBe("customer@example.com");
    expect(result.url).toContain("https://recordshield.vercel.app/api/auth/callback?token=");
    expect(db.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "customer@example.com" },
        create: expect.objectContaining({ email: "customer@example.com", role: "CUSTOMER" })
      })
    );
    expect(db.authMagicLink.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user_123",
          email: "customer@example.com",
          tokenHash: expect.not.stringContaining("customer@example.com"),
          reason: "payment_received",
          expiresAt: new Date("2026-05-19T12:30:00.000Z")
        })
      })
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "customer@example.com",
        subject: "Access your RecordShield dashboard",
        body: expect.stringContaining("Your secure check link is being prepared")
      })
    );
    expect(sendEmail.mock.calls[0]?.[0].body).toContain(result.url);
    expect(sendEmail.mock.calls[0]?.[0].body).not.toContain("tokenHash");
  });
});

describe("dashboard magic link callback", () => {
  it("marks a valid one-time token as used and returns the dashboard user", async () => {
    const db = {
      authMagicLink: {
        findUnique: vi.fn(async () => ({
          id: "link_123",
          tokenHash: "hash_123",
          redirectTo: "/dashboard",
          expiresAt: new Date("2026-05-19T12:30:00.000Z"),
          usedAt: null,
          user: { id: "user_123", email: "customer@example.com", role: "CUSTOMER" as const }
        })),
        update: vi.fn(async () => ({}))
      },
      auditEvent: {
        create: vi.fn(async () => ({}))
      }
    };

    const result = await consumeDashboardMagicLink(db, {
      token: "raw_token",
      now: new Date("2026-05-19T12:05:00.000Z")
    });

    expect(result).toEqual({
      ok: true,
      redirectTo: "/dashboard",
      user: { id: "user_123", email: "customer@example.com", role: "CUSTOMER" }
    });
    expect(db.authMagicLink.update).toHaveBeenCalledWith({
      where: { id: "link_123" },
      data: { usedAt: new Date("2026-05-19T12:05:00.000Z") }
    });
  });

  it("rejects expired or already-used tokens", async () => {
    const db = {
      authMagicLink: {
        findUnique: vi.fn(async () => ({
          id: "link_123",
          tokenHash: "hash_123",
          redirectTo: "/dashboard",
          expiresAt: new Date("2026-05-19T12:00:00.000Z"),
          usedAt: null,
          user: { id: "user_123", email: "customer@example.com", role: "CUSTOMER" as const }
        })),
        update: vi.fn(async () => ({}))
      }
    };

    await expect(
      consumeDashboardMagicLink(db, {
        token: "raw_token",
        now: new Date("2026-05-19T12:05:00.000Z")
      })
    ).resolves.toEqual({ ok: false, reason: "expired_or_used" });
    expect(db.authMagicLink.update).not.toHaveBeenCalled();
  });
});
