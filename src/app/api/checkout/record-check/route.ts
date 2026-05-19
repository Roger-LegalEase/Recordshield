import { NextResponse } from "next/server";
import { authSessionCookieOptions, createAuthSessionCookie, currentUser, type AppUser } from "@/lib/auth";
import { sessionCookieName } from "@/lib/auth-tokens";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { betaAccessMessage, canStartRecordCheckCheckout, inviteCodeFromRequest } from "@/lib/beta";
import { createRecordCheckCheckoutSession } from "@/lib/billing/checkout";
import { prisma } from "@/lib/prisma";
import { rateLimitedResponse, safeErrorResponse } from "@/lib/security/api-errors";
import { checkCompositeRateLimit, rateLimitIdentity } from "@/lib/security/rate-limit";

type RecordCheckCheckoutBody = {
  email?: string;
  inviteCode?: string;
  source?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RecordCheckCheckoutBody;
    const authenticatedUser = await currentUser();
    const email = normalizeEmail(body.email);
    if (!authenticatedUser && !email) {
      return NextResponse.json({ error: "Email is required to start checkout." }, { status: 400 });
    }

    const accessUser = authenticatedUser ?? {
      id: "pending-checkout-user",
      email: email as string,
      role: "CUSTOMER" as const
    };
    const access = canStartRecordCheckCheckout(accessUser, { inviteCode: inviteCodeFromRequest(request, body) });
    if (!access.allowed) {
      return NextResponse.json({ error: betaAccessMessage(access.reason) }, { status: 403 });
    }

    const rateLimit = await checkCompositeRateLimit({
      scope: "checkout:record-check",
      identity: rateLimitIdentity(request, { email: accessUser.email }),
      limit: 20,
      windowMs: 60_000
    });

    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.resetAt);
    }

    const user = authenticatedUser ?? (await upsertCheckoutUser(email as string));
    const session = await createRecordCheckCheckoutSession(user);
    await trackAnalyticsEvent(prisma, {
      event: "checkout_started",
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "ProductOrder",
      metadata: {
        productKey: "record_check",
        checkoutUrlCreated: Boolean(session.url),
        source: body.source ?? "recordshield"
      }
    });

    const response = NextResponse.json({ url: session.url }, { status: 201 });
    response.cookies.set(sessionCookieName, createAuthSessionCookie(user), authSessionCookieOptions());
    return response;
  } catch (error) {
    return safeErrorResponse(error, "Checkout is unavailable.");
  }
}

async function upsertCheckoutUser(email: string): Promise<AppUser> {
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      role: "CUSTOMER",
      leadConsent: true,
      leadConsentAt: new Date(),
      leadSource: "recordshield_checkout"
    },
    update: {
      leadConsent: true,
      leadConsentAt: new Date(),
      leadSource: "recordshield_checkout"
    },
    select: {
      id: true,
      email: true,
      role: true
    }
  });

  return user;
}

function normalizeEmail(email: string | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}
