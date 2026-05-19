import Link from "next/link";
import { RecordShieldStatusPanel } from "@/app/components/RecordShieldStatusPanel";
import { requireUser, type AppUser } from "@/lib/auth";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import {
  deriveRecordShieldStatus,
  type ProviderStatus,
  type ReviewStatus
} from "@/lib/recordshield/status-orchestration";

export default async function DashboardPage() {
  const user = await requireUser();
  const dashboardState = await getDashboardState(user);
  const derivedStatus = deriveRecordShieldStatus({
    paymentStatus: "payment_succeeded",
    accountStatus: "dashboard_access_granted",
    providerStatus: dashboardState.providerStatus,
    reviewStatus: dashboardState.reviewStatus,
    qaStatus: dashboardState.qaStatus,
    refundStatus: "refund_none",
    deletionStatus: "deletion_none",
    lastUpdatedAt: dashboardState.lastUpdatedAt
  });

  return (
    <div className="panel">
      <h1>Private Record Review dashboard</h1>
      <p className="muted">Welcome back, {user.email}.</p>
      <p className="muted">
        LegalEase RecordShield is for personal self-review only. It is not for employment, tenant, credit,
        insurance, or eligibility decisions, and it is not a final legal determination.
      </p>
      <RecordShieldStatusPanel status={derivedStatus} />
      {dashboardState.invitationUrl ? (
        <section>
          <h2>Secure check</h2>
          <p className="muted">
            You requested a personal record check on yourself. The provider may collect sensitive information through
            its hosted flow; LegalEase avoids storing SSNs, full dates of birth, driver license numbers, and unnecessary
            provider data.
          </p>
          <p>
            <a className="button" href={dashboardState.invitationUrl}>
              Complete secure check
            </a>
          </p>
        </section>
      ) : null}
      {dashboardState.reviewStatus === "review_ready" ? (
        <section>
          <h2>Your summary</h2>
          <p className="muted">Your private summary is ready. Review it carefully and contact support with access questions.</p>
          <form action={trackCleanupCtaClick}>
            <button className="button" type="submit">
              Explore cleanup review
            </button>
          </form>
        </section>
      ) : (
        <section>
          <h2>Your summary</h2>
          <p className="muted">Your summary will appear here after your report is received and reviewed.</p>
        </section>
      )}
      <section>
        <h2>Documents, notes, Wilma, and support</h2>
        <p className="muted">Use these tools when they are relevant to your current review status.</p>
      </section>
      <p>
        <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> ·{" "}
        <Link href="/support">Support</Link> · <Link href="/data-deletion">Data deletion</Link>
      </p>
    </div>
  );
}

async function trackCleanupCtaClick() {
  "use server";
  const user = await requireUser();
  await trackAnalyticsEvent(prisma, {
    event: "cleanup_cta_click",
    actorUserId: user.id,
    actorEmail: user.email,
    targetType: "Dashboard",
    metadata: {
      source: "dashboard_summary"
    }
  });
}

type DashboardState = {
  invitationUrl: string | null;
  providerStatus: ProviderStatus;
  reviewStatus: ReviewStatus;
  qaStatus: "qa_not_required" | "qa_required" | "qa_in_progress" | "qa_overdue" | "qa_approved";
  lastUpdatedAt: Date;
};

async function getDashboardState(user: AppUser): Promise<DashboardState> {
  try {
    const [shieldCase, invitation, report] = await Promise.all([
      prisma.shieldCase.findFirst({
        where: {
          productKey: "record_check",
          OR: [{ ownerId: user.id }, { owner: { email: user.email } }]
        },
        orderBy: { updatedAt: "desc" },
        select: { id: true, updatedAt: true, createdAt: true }
      }),
      prisma.providerInvitation.findFirst({
        where: { OR: [{ case: { ownerId: user.id } }, { candidate: { email: user.email } }] },
        orderBy: { createdAt: "desc" },
        select: { invitationUrl: true, status: true, createdAt: true, updatedAt: true, expiresAt: true }
      }),
      prisma.providerReport.findFirst({
        where: { OR: [{ case: { ownerId: user.id } }, { candidate: { email: user.email } }] },
        orderBy: { updatedAt: "desc" },
        select: {
          status: true,
          completedAt: true,
          updatedAt: true,
          reportSummary: { select: { id: true } }
        }
      })
    ]);

    const providerStatus = deriveProviderStatus(invitation, report);
    return {
      invitationUrl: invitation?.invitationUrl || null,
      providerStatus,
      reviewStatus: report?.reportSummary ? "review_ready" : providerStatus === "report_received" ? "review_in_progress" : "review_not_started",
      qaStatus: "qa_not_required",
      lastUpdatedAt: report?.updatedAt ?? invitation?.updatedAt ?? invitation?.createdAt ?? shieldCase?.updatedAt ?? shieldCase?.createdAt ?? new Date()
    };
  } catch {
    return {
      invitationUrl: null,
      providerStatus: "provider_invite_pending",
      reviewStatus: "review_not_started",
      qaStatus: "qa_not_required",
      lastUpdatedAt: new Date()
    };
  }
}

function deriveProviderStatus(
  invitation:
    | { invitationUrl: string; status: string; expiresAt: Date | null }
    | null,
  report:
    | { status: string; completedAt: Date | null }
    | null
): ProviderStatus {
  if (report?.completedAt || report?.status === "complete" || report?.status === "completed") return "report_received";
  if (report?.status === "suspended") return "provider_needs_action";
  if (report?.status === "canceled") return "provider_check_failed";
  if (report?.status) return "provider_check_in_progress";
  if ((invitation?.expiresAt && invitation.expiresAt.getTime() < Date.now()) || invitation?.status === "expired") return "provider_link_expired";
  if (invitation?.status === "completed") return "provider_check_in_progress";
  if (invitation?.invitationUrl) return "provider_check_not_started";
  return "provider_invite_pending";
}
