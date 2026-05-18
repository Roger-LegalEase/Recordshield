import { describe, expect, it } from "vitest";
import {
  canTransferToExpungementAi,
  deriveRecordShieldStatus,
  providerExceptionWorkflows,
  qaChecklist,
  type RecordShieldOperationalSnapshot
} from "@/lib/recordshield/status-orchestration";

const baseSnapshot: RecordShieldOperationalSnapshot = {
  paymentStatus: "payment_succeeded",
  accountStatus: "dashboard_access_granted",
  providerStatus: "provider_invite_sent",
  reviewStatus: "review_not_started",
  qaStatus: "qa_not_required",
  refundStatus: "refund_none",
  deletionStatus: "deletion_none",
  lastUpdatedAt: new Date("2026-05-18T12:00:00Z")
};

describe("RecordShield status orchestration", () => {
  it("maps provider_needs_action to calm user copy and admin ownership", () => {
    const derived = deriveRecordShieldStatus({ ...baseSnapshot, providerStatus: "provider_needs_action" });

    expect(derived.userFacing.title).toBe("The provider needs more information.");
    expect(derived.userFacing.primaryCta?.label).toBe("Continue secure check");
    expect(derived.adminBucket).toBe("provider_needs_action");
    expect(derived.nextAdminAction).toMatch(/Monitor unresolved/);
    expect(derived.supportSeverity).toBe("medium");
  });

  it("maps provider_link_expired to recovery copy", () => {
    const derived = deriveRecordShieldStatus({ ...baseSnapshot, providerStatus: "provider_link_expired" });

    expect(derived.userFacing.title).toBe("Your secure check link expired.");
    expect(derived.userFacing.primaryCta?.label).toBe("Request a new secure link");
    expect(derived.adminBucket).toBe("none");
    expect(providerExceptionWorkflows.provider_link_expired.adminAction).toBe("Regenerate provider invite.");
  });

  it("maps provider_check_failed as high severity", () => {
    const derived = deriveRecordShieldStatus({ ...baseSnapshot, providerStatus: "provider_check_failed" });

    expect(derived.userFacing.title).toBe("We could not complete your secure check.");
    expect(derived.adminBucket).toBe("provider_failed");
    expect(derived.supportSeverity).toBe("high");
  });

  it("maps report_received and review_in_progress to a waiting room status", () => {
    const derived = deriveRecordShieldStatus({
      ...baseSnapshot,
      providerStatus: "report_received",
      reviewStatus: "review_in_progress"
    });

    expect(derived.userFacing.title).toBe("Your private summary is being prepared.");
    expect(derived.userFacing.currentStep).toBe("Preparing summary");
    expect(derived.userFacing.supportNote).toMatch(/1 business day/);
  });

  it("maps QA required and ready states without legal promises", () => {
    const qaRequired = deriveRecordShieldStatus({ ...baseSnapshot, providerStatus: "report_received", qaStatus: "qa_required" });
    const ready = deriveRecordShieldStatus({ ...baseSnapshot, providerStatus: "report_received", reviewStatus: "review_ready" });

    expect(qaRequired.userFacing.title).toBe("Your private summary is being reviewed.");
    expect(ready.userFacing.title).toBe("Your review is ready.");
    expect(qaChecklist).toContain("No eligibility promise");
  });

  it("routes refund and deletion requests to admin-owned workflows", () => {
    const refund = deriveRecordShieldStatus({ ...baseSnapshot, refundStatus: "refund_requested" });
    const deletion = deriveRecordShieldStatus({ ...baseSnapshot, deletionStatus: "deletion_requested" });

    expect(refund.adminBucket).toBe("refund_requested");
    expect(refund.userFacing.title).toBe("Refund requested");
    expect(deletion.adminBucket).toBe("deletion_requested");
    expect(deletion.userFacing.title).toBe("Deletion requested");
  });

  it("requires explicit consent before an Expungement.ai Outcome C handoff", () => {
    expect(canTransferToExpungementAi({ outcome: "C", consentChecked: false, selectedData: ["Email"] })).toBe(false);
    expect(canTransferToExpungementAi({ outcome: "A", consentChecked: true, selectedData: ["Email"] })).toBe(false);
    expect(canTransferToExpungementAi({ outcome: "C", consentChecked: true, selectedData: ["Email"] })).toBe(true);
  });
});
