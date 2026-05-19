import { createMagicLinkToken, hashMagicLinkToken } from "@/lib/auth-tokens";
import type { Role } from "@/lib/rbac";

const defaultMagicLinkMinutes = 30;

type MagicLinkUser = {
  id: string;
  email: string;
  role: Role;
};

export type MagicLinkDatabase = {
  user: {
    upsert(args: {
      where: { email: string };
      create: { id?: string; email: string; role: "CUSTOMER"; leadSource?: string };
      update: { leadSource?: string };
      select: { id: true; email: true; role: true };
    }): Promise<MagicLinkUser>;
  };
  authMagicLink: {
    create(args: {
      data: {
        userId: string;
        email: string;
        tokenHash: string;
        reason: string;
        redirectTo: string;
        expiresAt: Date;
      };
    }): Promise<unknown>;
  };
  auditEvent?: {
    create(args: unknown): Promise<unknown>;
  };
};

export type ConsumeMagicLinkDatabase = {
  authMagicLink: {
    findUnique(args: {
      where: { tokenHash: string };
      include: { user: { select: { id: true; email: true; role: true } } };
    }): Promise<{
      id: string;
      redirectTo: string;
      expiresAt: Date;
      usedAt: Date | null;
      user: MagicLinkUser;
    } | null>;
    update(args: { where: { id: string }; data: { usedAt: Date } }): Promise<unknown>;
  };
  auditEvent?: MagicLinkDatabase["auditEvent"];
};

export type DashboardMagicLinkInput = {
  email: string;
  baseUrl: string;
  reason: "sign_in" | "payment_received";
  redirectTo?: string;
};

export type DashboardMagicLinkDependencies = {
  now?: Date;
  expiresInMinutes?: number;
  sendEmail?: (message: { to: string; subject: string; body: string }) => Promise<{ delivered: boolean; skipped?: boolean }>;
};

export async function createDashboardMagicLink(
  db: MagicLinkDatabase,
  input: DashboardMagicLinkInput,
  dependencies: DashboardMagicLinkDependencies = {}
): Promise<{ email: string; url: string; expiresAt: Date }> {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new Error("A valid email is required.");
  }

  const now = dependencies.now ?? new Date();
  const expiresAt = new Date(now.getTime() + (dependencies.expiresInMinutes ?? defaultMagicLinkMinutes) * 60_000);
  const redirectTo = normalizeRedirect(input.redirectTo);
  const user = await db.user.upsert({
    where: { email },
    create: { email, role: "CUSTOMER", leadSource: "recordshield_magic_link" },
    update: { leadSource: "recordshield_magic_link" },
    select: { id: true, email: true, role: true }
  });
  const token = createMagicLinkToken();
  const url = buildMagicLinkUrl(input.baseUrl, token);

  await db.authMagicLink.create({
    data: {
      userId: user.id,
      email,
      tokenHash: hashMagicLinkToken(token),
      reason: input.reason,
      redirectTo,
      expiresAt
    }
  });

  const emailResult = await dependencies.sendEmail?.({
    to: email,
    subject: "Access your RecordShield dashboard",
    body: renderDashboardAccessEmail(url)
  });

  await db.auditEvent?.create({
    data: {
      actorUserId: user.id,
      actorEmail: email,
      action: "auth.magic_link.created",
      targetType: "User",
      targetId: user.id,
      metadata: {
        reason: input.reason,
        redirectTo,
        expiresAt: expiresAt.toISOString(),
        emailDelivered: emailResult?.delivered ?? false,
        emailSkipped: emailResult?.skipped ?? false
      }
    }
  });

  return { email, url, expiresAt };
}

export async function consumeDashboardMagicLink(
  db: ConsumeMagicLinkDatabase,
  input: { token: string | undefined; now?: Date }
): Promise<
  | { ok: true; user: MagicLinkUser; redirectTo: string }
  | { ok: false; reason: "missing" | "expired_or_used" }
> {
  if (!input.token) {
    return { ok: false, reason: "missing" };
  }

  const now = input.now ?? new Date();
  const record = await db.authMagicLink.findUnique({
    where: { tokenHash: hashMagicLinkToken(input.token) },
    include: { user: { select: { id: true, email: true, role: true } } }
  });

  if (!record || record.usedAt || record.expiresAt <= now) {
    return { ok: false, reason: "expired_or_used" };
  }

  await db.authMagicLink.update({
    where: { id: record.id },
    data: { usedAt: now }
  });

  await db.auditEvent?.create({
    data: {
      actorUserId: record.user.id,
      actorEmail: record.user.email,
      action: "auth.magic_link.used",
      targetType: "User",
      targetId: record.user.id,
      metadata: {
        redirectTo: record.redirectTo
      }
    }
  });

  return {
    ok: true,
    user: record.user,
    redirectTo: record.redirectTo
  };
}

export function buildMagicLinkUrl(baseUrl: string, token: string): string {
  const url = new URL("/api/auth/callback", baseUrl);
  url.searchParams.set("token", token);
  return url.href;
}

export function normalizeEmail(email: string | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }
  return normalized;
}

function normalizeRedirect(redirectTo: string | undefined): string {
  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return "/dashboard";
  }
  return redirectTo;
}

function renderDashboardAccessEmail(url: string): string {
  return [
    "Your RecordShield Private Review dashboard is ready.",
    "",
    "Open your secure dashboard:",
    url,
    "",
    "Your secure check link is being prepared. We’ll email you when it’s ready.",
    "",
    "RecordShield is for your own personal review and planning only. LegalEase does not provide legal advice or guarantee outcomes."
  ].join("\n");
}
