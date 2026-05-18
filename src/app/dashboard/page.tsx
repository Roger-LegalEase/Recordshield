import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();
  const invitationUrl = await getLatestInvitationUrl(user.email);

  return (
    <div className="panel">
      <h1>Personal self-check dashboard</h1>
      <p className="muted">Welcome back, {user.email}.</p>
      <p className="muted">
        LegalEase RecordShield is for personal self-review only. It is not for employment, tenant, credit,
        insurance, or eligibility decisions, and it is not a final legal determination.
      </p>
      {invitationUrl ? (
        <section>
          <h2>Provider invitation</h2>
          <p className="muted">
            You requested a personal background check on yourself. Checkr may collect sensitive information through
            its hosted flow; LegalEase avoids storing SSNs, full dates of birth, driver license numbers, and unnecessary
            sensitive provider data.
          </p>
          <p>
            <a className="button" href={invitationUrl}>
              Complete your secure Checkr invitation
            </a>
          </p>
        </section>
      ) : null}
      <h2>Private Record Review</h2>
      <p className="muted">
        Your dashboard will organize your review status, findings, documents, notes, and clear next-step guidance as
        they become available.
      </p>
      <p>
        <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> ·{" "}
        <Link href="/support">Support</Link> · <Link href="/data-deletion">Data deletion</Link>
      </p>
    </div>
  );
}

async function getLatestInvitationUrl(email: string): Promise<string | null> {
  try {
    const invitation = await prisma.providerInvitation.findFirst({
      where: { candidate: { email }, invitationUrl: { not: "" } },
      orderBy: { createdAt: "desc" },
      select: { invitationUrl: true }
    });
    return invitation?.invitationUrl ?? null;
  } catch {
    return null;
  }
}
