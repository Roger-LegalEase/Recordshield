import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import {
  createSessionCookieValue,
  defaultSessionMaxAgeSeconds,
  sessionCookieName,
  verifySessionCookieValue
} from "@/lib/auth-tokens";
import { prisma } from "@/lib/prisma";
import { assertRole, type Role } from "@/lib/rbac";

export type AppUser = {
  id: string;
  email: string;
  role: Role;
};

export async function currentUser(): Promise<AppUser | null> {
  if (!env.DEV_AUTH_EMAIL) {
    return currentSessionUser();
  }
  return {
    id: "dev-user",
    email: env.DEV_AUTH_EMAIL,
    role: env.DEV_AUTH_ROLE
  };
}

export async function requireUser(): Promise<AppUser> {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in?redirectTo=/dashboard");
  }
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  assertRole(user.role, "ADMIN");
  return user;
}

export function createAuthSessionCookie(user: AppUser): string {
  if (!env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is required for production auth sessions.");
  }
  return createSessionCookieValue(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    {
      secret: env.NEXTAUTH_SECRET,
      maxAgeSeconds: defaultSessionMaxAgeSeconds
    }
  );
}

export function authSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: defaultSessionMaxAgeSeconds
  };
}

async function currentSessionUser(): Promise<AppUser | null> {
  if (!env.NEXTAUTH_SECRET) {
    return null;
  }

  const cookieStore = await cookies();
  const session = verifySessionCookieValue(cookieStore.get(sessionCookieName)?.value, env.NEXTAUTH_SECRET);
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true }
  });

  if (!user || user.email !== session.email) {
    return null;
  }

  return user;
}
