import { NextResponse } from "next/server";
import { createDashboardMagicLink } from "@/lib/auth-magic-link";
import { env } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { prisma } from "@/lib/prisma";
import { safeErrorResponse } from "@/lib/security/api-errors";

type MagicLinkRequestBody = {
  email?: string;
  redirectTo?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as MagicLinkRequestBody;
    const result = await createDashboardMagicLink(
      prisma,
      {
        email: body.email ?? "",
        baseUrl: env.APP_BASE_URL,
        reason: "sign_in",
        redirectTo: body.redirectTo
      },
      {
        sendEmail: sendTransactionalEmail
      }
    );

    return NextResponse.json(
      {
        ok: true,
        email: result.email,
        emailDeliveryConfigured: Boolean(env.NOTIFICATIONS_WEBHOOK_URL)
      },
      { status: 201 }
    );
  } catch (error) {
    return safeErrorResponse(error, "Could not send dashboard access link.");
  }
}
