import { NextResponse } from "next/server";
import { consumeDashboardMagicLink } from "@/lib/auth-magic-link";
import { createAuthSessionCookie, authSessionCookieOptions } from "@/lib/auth";
import { sessionCookieName } from "@/lib/auth-tokens";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? undefined;
  const result = await consumeDashboardMagicLink(prisma, { token });

  if (!result.ok) {
    return NextResponse.redirect(new URL("/sign-in?error=invalid-link", env.APP_BASE_URL));
  }

  const response = NextResponse.redirect(new URL(result.redirectTo, env.APP_BASE_URL));
  response.cookies.set(sessionCookieName, createAuthSessionCookie(result.user), authSessionCookieOptions());
  return response;
}
