export type PaymentStatus = "payment_pending" | "payment_succeeded" | "payment_failed";
export type AccountStatus = "account_missing" | "account_created" | "dashboard_access_granted";
export type ProviderStatus =
  | "provider_invite_pending"
  | "provider_invite_sent"
  | "provider_invite_failed"
  | "provider_check_not_started"
  | "provider_check_in_progress"
  | "provider_needs_action"
  | "provider_delayed"
  | "provider_link_expired"
  | "provider_check_failed"
  | "provider_check_completed"
  | "report_received";
export type ReviewStatus =
  | "review_not_started"
  | "review_in_progress"
  | "review_more_info_needed"
  | "review_ready"
  | "review_ready_email_pending";
export type QaStatus = "qa_not_required" | "qa_required" | "qa_in_progress" | "qa_overdue" | "qa_approved";
export type RefundStatus =
  | "refund_none"
  | "refund_requested"
  | "refund_under_review"
  | "refund_approved"
  | "refund_denied"
  | "refund_processed"
  | "chargeback_opened"
  | "chargeback_resolved";
export type DeletionStatus =
  | "deletion_none"
  | "deletion_requested"
  | "identity_verification_needed"
  | "deletion_under_review"
  | "deletion_completed"
  | "deletion_partially_completed"
  | "deletion_denied_retention_required";
export type SupportSeverity = "none" | "low" | "medium" | "high";

export type RecordShieldOperationalSnapshot = {
  paymentStatus: PaymentStatus;
  accountStatus: AccountStatus;
  providerStatus: ProviderStatus;
  reviewStatus: ReviewStatus;
  qaStatus: QaStatus;
  refundStatus: RefundStatus;
  deletionStatus: DeletionStatus;
  lastUpdatedAt: Date;
};

export type StatusCta = {
  label: string;
  href: string;
};

export type UserFacingStatus = {
  title: string;
  body: string;
  primaryCta?: StatusCta;
  secondaryCta?: StatusCta;
  currentStep: string;
  nextStep: string;
  userAction: string;
  supportNote: string;
};

export type ProviderExceptionWorkflow = UserFacingStatus & {
  providerStatus: ProviderStatus;
  emailTrigger?: string;
  adminAction: string;
  sla: string;
  supportSeverity: SupportSeverity;
};

export type RecordShieldDerivedStatus = {
  userFacing: UserFacingStatus;
  nextUserAction: string;
  nextAdminAction: string;
  supportSeverity: SupportSeverity;
  adminBucket: AdminQueueBucket;
  lastUpdatedAt: Date;
};

export type AdminQueueBucket =
  | "none"
  | "paid_no_review_created"
  | "review_active_no_provider_invite"
  | "provider_invite_failed"
  | "provider_not_started_24h"
  | "provider_needs_action"
  | "provider_delayed_over_72h"
  | "provider_failed"
  | "report_received_no_review_draft"
  | "qa_required"
  | "qa_overdue"
  | "review_ready_email_not_sent"
  | "refund_requested"
  | "deletion_requested"
  | "duplicate_payment_flagged"
  | "expungement_handoff_pending_consent";

export const providerExceptionWorkflows: Record<ProviderStatus, ProviderExceptionWorkflow> = {
  provider_invite_pending: {
    providerStatus: "provider_invite_pending",
    title: "We are preparing your secure check link.",
    body: "Your secure check link is being prepared. We’ll email you when it’s ready.",
    primaryCta: { label: "View status", href: "/dashboard" },
    currentStep: "Preparing secure check",
    nextStep: "Complete the secure provider check",
    userAction: "No action is needed yet.",
    supportNote: "Contact support if this status does not change within 30 minutes.",
    adminAction: "Retry provider invite generation if unresolved after 15 minutes.",
    sla: "10-15 minutes after payment",
    supportSeverity: "medium"
  },
  provider_invite_sent: {
    providerStatus: "provider_invite_sent",
    title: "Your secure check link is ready.",
    body: "Use the secure provider flow to request your personal report so RecordShield can prepare your review.",
    primaryCta: { label: "Complete secure check", href: "/dashboard" },
    currentStep: "Secure check link ready",
    nextStep: "Provider processes your report",
    userAction: "Complete the secure provider check.",
    supportNote: "Contact support if you cannot access the provider link.",
    emailTrigger: "checkr_invitation_created",
    adminAction: "Monitor for not-started reminders at 24 hours and 72 hours.",
    sla: "Reminder at 24h and 72h if not started",
    supportSeverity: "low"
  },
  provider_invite_failed: {
    providerStatus: "provider_invite_failed",
    title: "We could not create your secure check link yet.",
    body: "Your review is paid, but the secure provider link could not be created automatically. Support can help restart the flow.",
    primaryCta: { label: "Contact support", href: "/support" },
    currentStep: "Secure check link failed",
    nextStep: "Support retries or creates a secure link",
    userAction: "Contact support if you do not hear from us shortly.",
    supportNote: "Contact support now so the provider link can be restored.",
    emailTrigger: "provider_invite_failed",
    adminAction: "Retry invite generation or manually create provider invite.",
    sla: "Immediate admin alert",
    supportSeverity: "high"
  },
  provider_check_not_started: {
    providerStatus: "provider_check_not_started",
    title: "Complete your secure check to continue your review.",
    body: "Your private review can continue after you complete the secure provider flow.",
    primaryCta: { label: "Complete secure check", href: "/dashboard" },
    currentStep: "Waiting for secure check",
    nextStep: "Provider processes your report",
    userAction: "Complete the secure provider check.",
    supportNote: "Contact support if the provider link is missing or does not open.",
    emailTrigger: "complete_secure_check",
    adminAction: "Send 24h and 72h reminders. Keep dashboard CTA active.",
    sla: "24h and 72h reminders",
    supportSeverity: "medium"
  },
  provider_check_in_progress: {
    providerStatus: "provider_check_in_progress",
    title: "Your report is processing.",
    body: "The provider is processing your personal report. Timing can vary by provider processing, court data, and jurisdiction.",
    primaryCta: { label: "View status", href: "/dashboard" },
    currentStep: "Provider processing",
    nextStep: "RecordShield prepares your private summary",
    userAction: "No action is needed right now.",
    supportNote: "Contact support if this status does not change within 3 business days.",
    emailTrigger: "report_pending",
    adminAction: "Escalate if delayed more than 72 hours.",
    sla: "Escalate after 72 hours",
    supportSeverity: "low"
  },
  provider_needs_action: {
    providerStatus: "provider_needs_action",
    title: "The provider needs more information.",
    body: "Your secure check is paused because the provider needs more information from you. Please return to the secure provider flow to continue.",
    primaryCta: { label: "Continue secure check", href: "/dashboard" },
    currentStep: "Provider needs information",
    nextStep: "Provider continues processing your report",
    userAction: "Return to the secure provider flow.",
    supportNote: "Contact support if you cannot access the provider link.",
    emailTrigger: "provider_needs_more_information",
    adminAction: "Monitor if unresolved after 24 hours.",
    sla: "Monitor after 24 hours",
    supportSeverity: "medium"
  },
  provider_delayed: {
    providerStatus: "provider_delayed",
    title: "Your report is still processing.",
    body: "This can vary depending on provider processing, court data, and jurisdiction. We will update this page and email you when your review is ready.",
    primaryCta: { label: "View status", href: "/dashboard" },
    currentStep: "Provider processing",
    nextStep: "RecordShield prepares your private summary",
    userAction: "No action is needed right now.",
    supportNote: "Contact support if this status does not change within 3 business days.",
    emailTrigger: "provider_delayed",
    adminAction: "Escalate if delayed more than 72 hours.",
    sla: "Escalate after 72 hours",
    supportSeverity: "medium"
  },
  provider_link_expired: {
    providerStatus: "provider_link_expired",
    title: "Your secure check link expired.",
    body: "The provider link is no longer active. Request a new secure link so your private review can continue.",
    primaryCta: { label: "Request a new secure link", href: "/support" },
    secondaryCta: { label: "Contact support", href: "/support" },
    currentStep: "Secure check link expired",
    nextStep: "Support sends a new secure link",
    userAction: "Request a new secure provider link.",
    supportNote: "Contact support if you already requested a new link and have not received it.",
    emailTrigger: "provider_link_expired",
    adminAction: "Regenerate provider invite.",
    sla: "Same business day",
    supportSeverity: "high"
  },
  provider_check_failed: {
    providerStatus: "provider_check_failed",
    title: "We could not complete your secure check.",
    body: "The provider could not complete the secure check. Support will review whether a retry, an alternate path, or a refund review is appropriate.",
    primaryCta: { label: "Contact support", href: "/support" },
    currentStep: "Secure check did not complete",
    nextStep: "Support reviews the issue",
    userAction: "Contact support so we can help resolve the issue.",
    supportNote: "Contact support now so the provider issue can be reviewed.",
    emailTrigger: "provider_check_failed",
    adminAction: "Review failure reason. Decide retry, alternative provider path, or refund review.",
    sla: "Immediate admin alert",
    supportSeverity: "high"
  },
  provider_check_completed: {
    providerStatus: "provider_check_completed",
    title: "Your secure check is complete.",
    body: "The provider check is complete and RecordShield is waiting for report details so your private summary can be prepared.",
    primaryCta: { label: "View review status", href: "/dashboard" },
    currentStep: "Secure check complete",
    nextStep: "Report received",
    userAction: "No action is needed right now.",
    supportNote: "Contact support if this status does not change within 1 business day.",
    adminAction: "Ensure report received webhook or polling job completes.",
    sla: "Escalate after 1 business day",
    supportSeverity: "low"
  },
  report_received: {
    providerStatus: "report_received",
    title: "Your report was received.",
    body: "RecordShield received your report and is preparing your private summary.",
    primaryCta: { label: "View review status", href: "/dashboard" },
    currentStep: "Report received",
    nextStep: "RecordShield prepares your private summary",
    userAction: "No action is needed right now.",
    supportNote: "Contact support if your review is not updated within 1 business day.",
    emailTrigger: "report_received",
    adminAction: "Ensure review engine starts within 30-60 minutes.",
    sla: "Review engine starts within 30-60 minutes",
    supportSeverity: "medium"
  }
};

export const qaChecklist = [
  "No legal advice language",
  "No eligibility promise",
  "No 'you qualify' language",
  "No claim that records will be cleared, removed, sealed, or expunged",
  "User-facing terms are understandable",
  "Outcome A-E is correct",
  "Expungement.ai CTA appears only when appropriate",
  "More-info-needed state is used when data is insufficient",
  "Sensitive data is minimized",
  "Summary matches provider/report data",
  "User-uploaded documents are considered only within allowed scope"
] as const;

export const qaSla = {
  clearNoItemReview: "Same business day after report received",
  itemSurfaced: "1 business day after report received",
  moreInfoNeeded: "1-2 business days",
  qaOverdueThreshold: "1 business day for surfaced-item cases"
} as const;

export const refundWorkflow: Record<RefundStatus, { label: string; adminAction: string }> = {
  refund_none: { label: "No refund activity", adminAction: "No action needed." },
  refund_requested: { label: "Refund requested", adminAction: "Review payment, provider progress, and policy window." },
  refund_under_review: { label: "Refund under review", adminAction: "Decide refund, retry, or alternate provider path." },
  refund_approved: { label: "Refund approved", adminAction: "Process refund through Stripe and log event." },
  refund_denied: { label: "Refund denied", adminAction: "Send clear support response and preserve audit trail." },
  refund_processed: { label: "Refund processed", adminAction: "Send confirmation and keep payment/review records." },
  chargeback_opened: { label: "Chargeback opened", adminAction: "Lock new actions and preserve audit trail." },
  chargeback_resolved: { label: "Chargeback resolved", adminAction: "Update refund status and close admin item." }
};

export const deletionWorkflow: Record<DeletionStatus, { label: string; adminAction: string }> = {
  deletion_none: { label: "No deletion request", adminAction: "No action needed." },
  deletion_requested: { label: "Deletion requested", adminAction: "Verify identity and review retention requirements." },
  identity_verification_needed: { label: "Identity verification needed", adminAction: "Request identity confirmation before changing data." },
  deletion_under_review: { label: "Deletion under review", adminAction: "Identify data that can be deleted and required retained records." },
  deletion_completed: { label: "Deletion completed", adminAction: "Send completion confirmation and log all actions." },
  deletion_partially_completed: { label: "Deletion partially completed", adminAction: "Explain retained billing, fraud, audit, or compliance records." },
  deletion_denied_retention_required: { label: "Retention required", adminAction: "Explain retained records and legal/compliance basis." }
};

export const adminActionMatrix: Record<AdminQueueBucket, { label: string; nextAdminAction: string; severity: SupportSeverity }> = {
  none: { label: "No admin action", nextAdminAction: "No action needed.", severity: "none" },
  paid_no_review_created: { label: "Paid, no review created", nextAdminAction: "Create or link review record and grant dashboard access.", severity: "high" },
  review_active_no_provider_invite: { label: "Review active, no provider invite", nextAdminAction: "Retry provider invite generation.", severity: "high" },
  provider_invite_failed: { label: "Provider invite failed", nextAdminAction: "Retry invite generation or manually create provider invite.", severity: "high" },
  provider_not_started_24h: { label: "Provider not started after 24h", nextAdminAction: "Send reminder and keep secure check CTA visible.", severity: "medium" },
  provider_needs_action: { label: "Provider needs action", nextAdminAction: "Monitor unresolved state after 24 hours.", severity: "medium" },
  provider_delayed_over_72h: { label: "Provider delayed over 72h", nextAdminAction: "Escalate provider delay and update user if needed.", severity: "medium" },
  provider_failed: { label: "Provider failed", nextAdminAction: "Review failure reason and decide retry, alternative path, or refund review.", severity: "high" },
  report_received_no_review_draft: { label: "Report received, no review draft", nextAdminAction: "Start or retry review engine job.", severity: "high" },
  qa_required: { label: "QA required", nextAdminAction: "Assign reviewer and complete QA checklist.", severity: "medium" },
  qa_overdue: { label: "QA overdue", nextAdminAction: "Prioritize reviewer queue and notify support if needed.", severity: "high" },
  review_ready_email_not_sent: { label: "Review ready, email not sent", nextAdminAction: "Send or retry review-ready email.", severity: "medium" },
  refund_requested: { label: "Refund requested", nextAdminAction: "Review refund policy and provider progress.", severity: "medium" },
  deletion_requested: { label: "Deletion requested", nextAdminAction: "Start identity verification and retention review.", severity: "medium" },
  duplicate_payment_flagged: { label: "Duplicate payment flagged", nextAdminAction: "Review duplicate payment risk; do not auto-refund unless safe policy exists.", severity: "high" },
  expungement_handoff_pending_consent: { label: "Expungement handoff pending consent", nextAdminAction: "Do not transfer data until explicit user consent is captured.", severity: "medium" }
};

export const auditEventTypes = [
  "checkout_started",
  "payment_succeeded",
  "payment_failed",
  "review_created",
  "account_created",
  "dashboard_access_granted",
  "provider_invite_requested",
  "provider_invite_sent",
  "provider_invite_failed",
  "provider_check_started",
  "provider_needs_action",
  "provider_delayed",
  "provider_link_expired",
  "provider_check_failed",
  "provider_check_completed",
  "report_received",
  "review_engine_started",
  "summary_drafted",
  "qa_required",
  "qa_approved",
  "qa_rejected",
  "review_ready",
  "review_ready_email_sent",
  "outcome_assigned",
  "wilma_question_asked",
  "expungement_referral_started",
  "expungement_referral_consent_given",
  "expungement_referral_completed",
  "expungement_referral_cancelled",
  "refund_requested",
  "refund_processed",
  "deletion_requested",
  "deletion_completed",
  "admin_note_added",
  "support_ticket_created"
] as const;

export type AuditEventType = (typeof auditEventTypes)[number];

export const expungementHandoffSelectableData = [
  "Name",
  "Email",
  "State",
  "County, if available",
  "Report labels, if available",
  "Uploaded documents, if selected",
  "User notes, if selected"
] as const;

export type ExpungementHandoffConsentInput = {
  outcome: string;
  consentChecked: boolean;
  selectedData: string[];
};

export function canTransferToExpungementAi(input: ExpungementHandoffConsentInput): boolean {
  return input.outcome === "C" && input.consentChecked && input.selectedData.length > 0;
}

export function deriveRecordShieldStatus(snapshot: RecordShieldOperationalSnapshot): RecordShieldDerivedStatus {
  if (snapshot.deletionStatus !== "deletion_none") {
    return fromWorkflow(snapshot, "deletion_requested", deletionWorkflow[snapshot.deletionStatus].adminAction, "medium", {
      title: deletionWorkflow[snapshot.deletionStatus].label,
      body: "Your deletion or anonymization request is being handled according to privacy and retention requirements.",
      currentStep: deletionWorkflow[snapshot.deletionStatus].label,
      nextStep: "RecordShield reviews data that can be deleted and retained records",
      userAction: "Watch for a support update if identity verification is needed.",
      supportNote: "Contact support if you need to update the request."
    });
  }

  if (snapshot.refundStatus !== "refund_none") {
    return fromWorkflow(snapshot, "refund_requested", refundWorkflow[snapshot.refundStatus].adminAction, "medium", {
      title: refundWorkflow[snapshot.refundStatus].label,
      body: "Your refund request is being reviewed. Review and payment records are preserved for the audit trail.",
      currentStep: refundWorkflow[snapshot.refundStatus].label,
      nextStep: "Support reviews payment and provider progress",
      userAction: "No action is needed unless support asks for more information.",
      supportNote: "Contact support if the request changes."
    });
  }

  if (snapshot.paymentStatus === "payment_succeeded" && snapshot.accountStatus === "account_missing") {
    return fromWorkflow(snapshot, "paid_no_review_created", "Create or link account and grant dashboard access.", "high", {
      title: "We are connecting your dashboard access.",
      body: "Your payment was received, and RecordShield is finishing access to your private review dashboard.",
      currentStep: "Dashboard access",
      nextStep: "Secure check link",
      userAction: "No action is needed right now.",
      supportNote: "Contact support if you cannot access your dashboard shortly."
    });
  }

  const providerWorkflow = providerExceptionWorkflows[snapshot.providerStatus];
  const reviewOverride = deriveReviewOverride(snapshot);
  const userFacing = reviewOverride ?? providerWorkflow;
  const adminBucket = deriveAdminBucket(snapshot);
  const matrix = adminActionMatrix[adminBucket];

  return {
    userFacing,
    nextUserAction: userFacing.userAction,
    nextAdminAction: matrix.nextAdminAction === "No action needed." ? providerWorkflow.adminAction : matrix.nextAdminAction,
    supportSeverity: maxSeverity(providerWorkflow.supportSeverity, matrix.severity),
    adminBucket,
    lastUpdatedAt: snapshot.lastUpdatedAt
  };
}

function deriveReviewOverride(snapshot: RecordShieldOperationalSnapshot): UserFacingStatus | null {
  if (snapshot.qaStatus === "qa_overdue") {
    return {
      title: "Your review is taking longer than expected.",
      body: "Your private summary is still being prepared. A reviewer is checking the details before it is shown in your dashboard.",
      primaryCta: { label: "View status", href: "/dashboard" },
      currentStep: "Human review",
      nextStep: "Private summary ready",
      userAction: "No action is needed right now.",
      supportNote: "Contact support if you have a time-sensitive question."
    };
  }

  if (snapshot.qaStatus === "qa_required" || snapshot.qaStatus === "qa_in_progress") {
    return {
      title: "Your private summary is being reviewed.",
      body: "RecordShield is checking the summary before it appears in your dashboard.",
      primaryCta: { label: "View status", href: "/dashboard" },
      currentStep: "Quality review",
      nextStep: "Private summary ready",
      userAction: "No action is needed right now.",
      supportNote: "Contact support if this status does not change within 1 business day."
    };
  }

  if (snapshot.reviewStatus === "review_ready_email_pending") {
    return {
      title: "Your review is ready.",
      body: "Your private summary is ready in your dashboard. We are also sending your review-ready email.",
      primaryCta: { label: "View summary", href: "/dashboard" },
      currentStep: "Review ready",
      nextStep: "Review your summary and choose your next step",
      userAction: "Open your dashboard to view your private summary.",
      supportNote: "Contact support if your dashboard does not show the summary."
    };
  }

  if (snapshot.reviewStatus === "review_ready") {
    return {
      title: "Your review is ready.",
      body: "Your private summary is available in your dashboard.",
      primaryCta: { label: "View summary", href: "/dashboard" },
      currentStep: "Review ready",
      nextStep: "Save your summary, ask Wilma, or explore cleanup if appropriate",
      userAction: "Open your dashboard to view your private summary.",
      supportNote: "Contact support if anything looks incomplete."
    };
  }

  if (snapshot.providerStatus === "report_received" && snapshot.reviewStatus === "review_in_progress") {
    return {
      title: "Your private summary is being prepared.",
      body: "RecordShield received your report and is organizing it into a private summary.",
      primaryCta: { label: "View status", href: "/dashboard" },
      currentStep: "Preparing summary",
      nextStep: "Quality review if needed",
      userAction: "No action is needed right now.",
      supportNote: "Contact support if this status does not change within 1 business day."
    };
  }

  return null;
}

function deriveAdminBucket(snapshot: RecordShieldOperationalSnapshot): AdminQueueBucket {
  if (snapshot.refundStatus === "refund_requested" || snapshot.refundStatus === "refund_under_review") return "refund_requested";
  if (snapshot.deletionStatus === "deletion_requested" || snapshot.deletionStatus === "identity_verification_needed") return "deletion_requested";
  if (snapshot.paymentStatus === "payment_succeeded" && snapshot.accountStatus === "account_missing") return "paid_no_review_created";
  if (snapshot.providerStatus === "provider_invite_pending") return "review_active_no_provider_invite";
  if (snapshot.providerStatus === "provider_invite_failed") return "provider_invite_failed";
  if (snapshot.providerStatus === "provider_check_not_started") return "provider_not_started_24h";
  if (snapshot.providerStatus === "provider_needs_action") return "provider_needs_action";
  if (snapshot.providerStatus === "provider_delayed") return "provider_delayed_over_72h";
  if (snapshot.providerStatus === "provider_check_failed") return "provider_failed";
  if (snapshot.providerStatus === "report_received" && snapshot.reviewStatus === "review_not_started") return "report_received_no_review_draft";
  if (snapshot.qaStatus === "qa_overdue") return "qa_overdue";
  if (snapshot.qaStatus === "qa_required" || snapshot.qaStatus === "qa_in_progress") return "qa_required";
  if (snapshot.reviewStatus === "review_ready_email_pending") return "review_ready_email_not_sent";
  return "none";
}

function fromWorkflow(
  snapshot: RecordShieldOperationalSnapshot,
  adminBucket: AdminQueueBucket,
  nextAdminAction: string,
  supportSeverity: SupportSeverity,
  userFacing: UserFacingStatus
): RecordShieldDerivedStatus {
  return {
    userFacing,
    nextUserAction: userFacing.userAction,
    nextAdminAction,
    supportSeverity,
    adminBucket,
    lastUpdatedAt: snapshot.lastUpdatedAt
  };
}

function maxSeverity(left: SupportSeverity, right: SupportSeverity): SupportSeverity {
  const rank: Record<SupportSeverity, number> = { none: 0, low: 1, medium: 2, high: 3 };
  return rank[left] >= rank[right] ? left : right;
}
