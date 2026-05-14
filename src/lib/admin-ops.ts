import { Prisma } from "@prisma/client";
import type { AppUser } from "@/lib/auth";
import { assertAdminUser } from "@/lib/admin-case-actions";
import { anonymizeUserData, type DataDeletionDatabase } from "@/lib/data-deletion";
import { summarizeReportSafely } from "@/lib/report-summary";
import { redactForStorage } from "@/lib/security/redaction";

export const caseProgression = [
  "created",
  "invitation_sent",
  "candidate_pending",
  "report_pending",
  "report_complete"
] as const;

export const caseExceptionStates = ["canceled", "suspended", "expired", "needs_review"] as const;

export type CaseProgressState = (typeof caseProgression)[number] | (typeof caseExceptionStates)[number];
export type SummaryState = "summary_missing" | "summary_ready" | "summary_failed";
export type MonitoringState = "monitoring_none" | "monitoring_active" | "monitoring_canceled";
export type AnonymizationStatus = "none" | "requested" | "completed";

export type AdminDisplayState = {
  caseProgress: CaseProgressState;
  paymentStatus: string;
  invitationStatus: string;
  reportStatus: string;
  summaryStatus: SummaryState;
  expungementReadinessStatus: string;
  monitoringStatus: MonitoringState;
  anonymizationStatus: AnonymizationStatus;
  manualReviewNeeded: boolean;
};

export type AdminCaseRecord = {
  id: string;
  displayName: string;
  status: string;
  productKey: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    email: string;
    name?: string | null;
    stripeCustomerId?: string | null;
    productOrders?: AdminCaseRecord["productOrders"];
    entitlements?: AdminCaseRecord["entitlements"];
  } | null;
  productOrders?: Array<{
    status: string;
    productKey: string;
    stripeCustomerId?: string | null;
    stripeCheckoutSessionId?: string | null;
    stripePaymentIntentId?: string | null;
    paidAt?: Date | null;
  }>;
  entitlements?: Array<{
    status: string;
    productKey: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    cancelAtPeriodEnd?: boolean;
  }>;
  providerCandidates?: Array<{ providerCandidateId: string; customId?: string; email?: string }>;
  providerInvitations?: Array<{
    providerInvitationId: string;
    invitationUrl?: string;
    status: string;
    createdAt?: Date;
  }>;
  providerReports?: Array<{
    id: string;
    providerReportId: string;
    status: string;
    result?: string | null;
    summary?: unknown;
    metadata?: unknown;
    completedAt?: Date | null;
    canceledAt?: Date | null;
    suspendedAt?: Date | null;
    reportSummary?: {
      plainEnglishSummary: string;
      confidence: string;
      expungementReadiness: unknown;
      rawOutput: unknown;
      updatedAt?: Date;
    } | null;
  }>;
  monitoringEnrollments?: Array<{
    status: string;
    consentType: string;
    providerContinuousCheckId?: string | null;
    updatedAt?: Date;
  }>;
  operationState?: {
    manualReviewNeeded: boolean;
    anonymizationStatus: string;
    displayState?: unknown;
  } | null;
  auditEvents?: Array<{ action: string; createdAt: Date }>;
};

export type AdminCaseRow = {
  id: string;
  label: string;
  customerLabel: string;
  email: string | null;
  paymentStatus: string;
  invitationStatus: string;
  reportStatus: string;
  summaryStatus: string;
  expungementReadinessStatus: string;
  monitoringStatus: string;
  latestAuditAt: Date | null;
  displayState: AdminDisplayState;
};

export type AdminProviderEventView = {
  provider: string;
  type: string;
  providerEventId: string;
  receivedAt: Date;
  processingStatus: string;
  dedupeStatus: string;
  payloadPreview: Prisma.InputJsonValue;
};

export type AdminAuditTimelineItem = {
  timestamp: Date;
  actorType: "system" | "provider" | "user" | "admin";
  actorLabel: string;
  action: string;
  metadata: Prisma.InputJsonValue;
};

type AuditCreate = {
  actorUserId?: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata: Prisma.InputJsonValue;
};

export type AdminOpsDatabase = DataDeletionDatabase & {
  shieldCase: {
    count(args?: unknown): Promise<number>;
    findMany(args?: unknown): Promise<AdminCaseRecord[]>;
    findUnique(args: unknown): Promise<AdminCaseRecord | null>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<{ id: string }>;
  };
  productOrder: DataDeletionDatabase["productOrder"] & { count(args?: unknown): Promise<number> };
  providerInvitation: { count(args?: unknown): Promise<number> };
  providerReport: { count(args?: unknown): Promise<number> };
  reportSummary: {
    count(args?: unknown): Promise<number>;
    upsert(args: unknown): Promise<unknown>;
  };
  subscriptionEntitlement: DataDeletionDatabase["subscriptionEntitlement"] & { count(args?: unknown): Promise<number> };
  monitoringEnrollment: { count(args?: unknown): Promise<number> };
  auditEvent: DataDeletionDatabase["auditEvent"] & {
    count(args?: unknown): Promise<number>;
    findMany(args?: unknown): Promise<Array<{
      id: string;
      actorUserId?: string | null;
      actorEmail?: string | null;
      action: string;
      targetType: string;
      targetId?: string | null;
      metadata: unknown;
      createdAt: Date;
    }>>;
    create(args: { data: AuditCreate }): Promise<unknown>;
  };
  providerEvent: {
    findMany(args?: unknown): Promise<Array<{
      id: string;
      provider: string;
      providerEventId: string;
      type: string;
      payload: unknown;
      processedAt: Date;
      createdAt: Date;
    }>>;
  };
  caseOperationState: {
    count(args?: unknown): Promise<number>;
    findUnique(args: { where: { caseId: string } }): Promise<{
      manualReviewNeeded: boolean;
      anonymizationStatus: string;
      displayState: unknown;
    } | null>;
    upsert(args: {
      where: { caseId: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }): Promise<unknown>;
  };
};

const progressRank: Record<(typeof caseProgression)[number], number> = {
  created: 0,
  invitation_sent: 1,
  candidate_pending: 2,
  report_pending: 3,
  report_complete: 4
};

export function shouldApplyCaseProgressTransition(current: CaseProgressState, next: CaseProgressState): boolean {
  if (next === "needs_review") return true;
  if (current === "needs_review") return next === "report_complete";
  if (caseExceptionStates.includes(current as (typeof caseExceptionStates)[number])) return false;
  if (caseExceptionStates.includes(next as (typeof caseExceptionStates)[number])) {
    return current !== "report_complete";
  }
  return progressRank[next as keyof typeof progressRank] >= progressRank[current as keyof typeof progressRank];
}

export function deriveAdminDisplayState(record: AdminCaseRecord): AdminDisplayState {
  const latestInvitation = record.providerInvitations?.[0];
  const latestReport = record.providerReports?.[0];
  const latestSummary = latestReport?.reportSummary;
  const latestMonitoring = record.monitoringEnrollments?.[0];
  const anonymizationStatus = normalizeAnonymizationStatus(record.operationState?.anonymizationStatus);
  const manualReviewNeeded = Boolean(record.operationState?.manualReviewNeeded);
  const reportStatus = latestReport?.status ?? "none";
  const summaryStatus = latestSummary
    ? isFailureRawOutput(latestSummary.rawOutput)
      ? "summary_failed"
      : "summary_ready"
    : "summary_missing";
  const monitoringStatus =
    latestMonitoring?.status === "ACTIVE"
      ? "monitoring_active"
      : latestMonitoring
        ? "monitoring_canceled"
        : "monitoring_none";

  return {
    caseProgress: manualReviewNeeded ? "needs_review" : deriveProgress(latestInvitation?.status, reportStatus, latestReport),
    paymentStatus: latestProductOrder(record)?.status ?? "PENDING",
    invitationStatus: latestInvitation?.status ?? "none",
    reportStatus,
    summaryStatus,
    expungementReadinessStatus: readReadinessStatus(latestSummary?.expungementReadiness ?? latestReport?.summary),
    monitoringStatus,
    anonymizationStatus,
    manualReviewNeeded
  };
}

export function shapeAdminCaseRow(record: AdminCaseRecord): AdminCaseRow {
  const displayState = deriveAdminDisplayState(record);
  const anonymized = displayState.anonymizationStatus === "completed" || isAnonymizedEmail(record.owner?.email);
  return {
    id: record.id,
    label: record.displayName || record.id,
    customerLabel: anonymized ? "Anonymized customer" : record.owner?.name || record.owner?.email || record.owner?.id || "Unknown customer",
    email: anonymized ? null : record.owner?.email ?? null,
    paymentStatus: labelPayment(displayState.paymentStatus),
    invitationStatus: labelInvitation(displayState.invitationStatus),
    reportStatus: labelReport(displayState.reportStatus),
    summaryStatus: labelSummary(displayState.summaryStatus),
    expungementReadinessStatus: labelReadiness(displayState.expungementReadinessStatus),
    monitoringStatus: labelMonitoring(displayState.monitoringStatus),
    latestAuditAt: record.auditEvents?.[0]?.createdAt ?? null,
    displayState
  };
}

export async function getAdminDashboardOverview(db: AdminOpsDatabase) {
  const [
    totalCases,
    pendingInvitations,
    activeReports,
    completedSummaries,
    failedSummaries,
    activeMonitoring,
    canceledMonitoring,
    anonymizations,
    recentAuditEvents
  ] = await Promise.all([
    db.shieldCase.count(),
    db.providerInvitation.count({ where: { status: { in: ["created", "pending"] } } }),
    db.providerReport.count({ where: { status: { in: ["pending", "consider", "complete"] } } }),
    db.reportSummary.count({ where: { confidence: { in: ["low", "medium", "high"] } } }),
    db.reportSummary.count({ where: { rawOutput: { path: ["failure"], not: Prisma.JsonNull } } }),
    db.subscriptionEntitlement.count({ where: { status: "ACTIVE" } }),
    db.monitoringEnrollment.count({ where: { status: { in: ["CANCELED", "REVOKED"] } } }),
    db.caseOperationState.count({ where: { anonymizationStatus: { in: ["requested", "completed"] } } }),
    db.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 10 })
  ]);

  return {
    totalCases,
    pendingInvitations,
    activeReports,
    completedSummaries,
    failedSummaries,
    activeMonitoring,
    canceledMonitoring,
    anonymizations,
    recentAuditEvents: recentAuditEvents.map(toAuditTimelineItem)
  };
}

export function buildAdminCaseWhere(filters: Record<string, string | undefined>): Prisma.ShieldCaseWhereInput {
  const where: Prisma.ShieldCaseWhereInput = {};
  const whereWithOperationState = where as Prisma.ShieldCaseWhereInput & {
    operationState?: { manualReviewNeeded?: boolean; anonymizationStatus?: string };
  };
  if (filters.status) where.status = filters.status as Prisma.ShieldCaseWhereInput["status"];
  if (filters.email) where.owner = { email: { contains: filters.email, mode: "insensitive" } };
  if (filters.paymentStatus) where.owner = { productOrders: { some: { status: filters.paymentStatus as never } } };
  if (filters.invitationStatus) where.providerInvitations = { some: { status: filters.invitationStatus } };
  if (filters.reportStatus) where.providerReports = { some: { status: filters.reportStatus } };
  if (filters.monitoringStatus) where.monitoringEnrollments = { some: { status: filters.monitoringStatus as never } };
  if (filters.manualReviewNeeded === "true") whereWithOperationState.operationState = { manualReviewNeeded: true };
  if (filters.anonymizationStatus) whereWithOperationState.operationState = { anonymizationStatus: filters.anonymizationStatus };
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {
      gte: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
      lte: filters.createdTo ? new Date(filters.createdTo) : undefined
    };
  }
  if (filters.updatedFrom || filters.updatedTo) {
    where.updatedAt = {
      gte: filters.updatedFrom ? new Date(filters.updatedFrom) : undefined,
      lte: filters.updatedTo ? new Date(filters.updatedTo) : undefined
    };
  }
  return where;
}

export async function listAdminCaseRows(db: AdminOpsDatabase, filters: Record<string, string | undefined>) {
  const records = await db.shieldCase.findMany({
    where: buildAdminCaseWhere(filters),
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: adminCaseInclude()
  });
  return records.map(shapeAdminCaseRow);
}

export async function getAdminCaseDetail(db: AdminOpsDatabase, caseId: string) {
  const record = await db.shieldCase.findUnique({
    where: { id: caseId },
    include: adminCaseInclude()
  });
  if (!record) return null;

  const providerIds = collectProviderIds(record);
  const [auditEvents, providerEvents] = await Promise.all([
    db.auditEvent.findMany({
      where: {
        OR: [{ targetId: caseId }, { metadata: { path: ["caseId"], equals: caseId } }]
      },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    db.providerEvent.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
  ]);

  return {
    record,
    row: shapeAdminCaseRow(record),
    displayState: deriveAdminDisplayState(record),
    providerEvents: providerEvents.filter((event) => providerEventMatches(event.payload, providerIds)).map(toProviderEventView),
    auditTimeline: auditEvents.map(toAuditTimelineItem)
  };
}

export async function retryCaseSummary(input: {
  actor: AppUser;
  caseId: string;
  db: AdminOpsDatabase;
  client?: NonNullable<Parameters<typeof summarizeReportSafely>[1]>["client"];
}) {
  assertAdminUser(input.actor);
  const record = await input.db.shieldCase.findUnique({
    where: { id: input.caseId },
    include: adminCaseInclude()
  });
  const report = record?.providerReports?.[0];
  if (!record || !report) throw new Error("No provider report is available for summary retry.");

  const result = await summarizeReportSafely(
    {
      normalizedReport: asRecord(report.metadata),
      expungementReadiness: asRecord(report.summary),
      userState: "unknown",
      providerReportId: report.id
    },
    { db: input.db, client: input.client }
  );

  await createAudit(input.db, input.actor, result.ok ? "admin.case.summary_retry_succeeded" : "admin.case.summary_retry_failed", "ProviderReport", report.id, {
    caseId: input.caseId,
    ok: result.ok
  });
  return result;
}

export async function flagManualReview(input: { actor: AppUser; caseId: string; reason: string; db: AdminOpsDatabase }) {
  assertAdminUser(input.actor);
  await input.db.caseOperationState.upsert({
    where: { caseId: input.caseId },
    create: {
      caseId: input.caseId,
      manualReviewNeeded: true,
      manualReviewReason: input.reason,
      manualReviewFlaggedAt: new Date(),
      manualReviewFlaggedById: input.actor.id,
      manualReviewFlaggedByEmail: input.actor.email,
      anonymizationStatus: "none"
    },
    update: {
      manualReviewNeeded: true,
      manualReviewReason: input.reason,
      manualReviewFlaggedAt: new Date(),
      manualReviewFlaggedById: input.actor.id,
      manualReviewFlaggedByEmail: input.actor.email,
      manualReviewResolutionNote: null,
      manualReviewResolvedAt: null
    }
  });
  await createAudit(input.db, input.actor, "admin.case.manual_review_flagged", "ShieldCase", input.caseId, {
    caseId: input.caseId,
    reason: input.reason
  });
}

export async function resolveManualReview(input: { actor: AppUser; caseId: string; resolutionNote: string; db: AdminOpsDatabase }) {
  assertAdminUser(input.actor);
  await input.db.caseOperationState.upsert({
    where: { caseId: input.caseId },
    create: {
      caseId: input.caseId,
      manualReviewNeeded: false,
      manualReviewResolutionNote: input.resolutionNote,
      manualReviewResolvedAt: new Date(),
      manualReviewResolvedById: input.actor.id,
      manualReviewResolvedByEmail: input.actor.email,
      anonymizationStatus: "none"
    },
    update: {
      manualReviewNeeded: false,
      manualReviewResolutionNote: input.resolutionNote,
      manualReviewResolvedAt: new Date(),
      manualReviewResolvedById: input.actor.id,
      manualReviewResolvedByEmail: input.actor.email
    }
  });
  await createAudit(input.db, input.actor, "admin.case.manual_review_resolved", "ShieldCase", input.caseId, {
    caseId: input.caseId,
    resolutionNote: input.resolutionNote
  });
}

export async function triggerCaseAnonymization(input: { actor: AppUser; caseId: string; reason: string; db: AdminOpsDatabase }) {
  assertAdminUser(input.actor);
  const record = await input.db.shieldCase.findUnique({ where: { id: input.caseId }, include: { owner: true } });
  const userId = record?.owner?.id;
  if (!userId) throw new Error("No customer is attached to this case.");

  await input.db.caseOperationState.upsert({
    where: { caseId: input.caseId },
    create: {
      caseId: input.caseId,
      anonymizationStatus: "requested",
      anonymizationReason: input.reason,
      anonymizationRequestedAt: new Date(),
      anonymizationRequestedById: input.actor.id,
      anonymizationRequestedByEmail: input.actor.email
    },
    update: {
      anonymizationStatus: "requested",
      anonymizationReason: input.reason,
      anonymizationRequestedAt: new Date(),
      anonymizationRequestedById: input.actor.id,
      anonymizationRequestedByEmail: input.actor.email
    }
  });
  await createAudit(input.db, input.actor, "admin.case.anonymization_requested", "ShieldCase", input.caseId, {
    caseId: input.caseId,
    reason: input.reason
  });

  const result = await anonymizeUserData({
    userId,
    requestedByUserId: input.actor.id,
    requestedByEmail: input.actor.email
  }, input.db);

  await input.db.caseOperationState.upsert({
    where: { caseId: input.caseId },
    create: {
      caseId: input.caseId,
      anonymizationStatus: "completed",
      anonymizationCompletedAt: new Date(),
      anonymizationCompletedById: input.actor.id,
      anonymizationCompletedByEmail: input.actor.email
    },
    update: {
      anonymizationStatus: "completed",
      anonymizationCompletedAt: new Date(),
      anonymizationCompletedById: input.actor.id,
      anonymizationCompletedByEmail: input.actor.email
    }
  });
  await createAudit(input.db, input.actor, "admin.case.anonymization_completed", "ShieldCase", input.caseId, {
    caseId: input.caseId,
    anonymizedEmail: result.anonymizedEmail
  });
  return result;
}

export async function refreshCaseDisplayState(input: { actor: AppUser; caseId: string; db: AdminOpsDatabase }) {
  assertAdminUser(input.actor);
  const record = await input.db.shieldCase.findUnique({ where: { id: input.caseId }, include: adminCaseInclude() });
  if (!record) throw new Error("Case not found.");
  const nextState = deriveAdminDisplayState(record);
  const existing = await input.db.caseOperationState.findUnique({ where: { caseId: input.caseId } });
  const changed = JSON.stringify(existing?.displayState ?? null) !== JSON.stringify(nextState);
  await input.db.caseOperationState.upsert({
    where: { caseId: input.caseId },
    create: { caseId: input.caseId, anonymizationStatus: "none", displayState: nextState },
    update: { displayState: nextState }
  });
  if (changed) {
    await createAudit(input.db, input.actor, "admin.case.display_state_refreshed", "ShieldCase", input.caseId, {
      caseId: input.caseId,
      displayState: nextState
    });
  }
  return { changed, displayState: nextState };
}

export function toProviderEventView(event: {
  provider: string;
  providerEventId: string;
  type: string;
  payload: unknown;
  processedAt: Date;
  createdAt: Date;
}): AdminProviderEventView {
  return {
    provider: event.provider,
    type: event.type,
    providerEventId: event.providerEventId,
    receivedAt: event.createdAt,
    processingStatus: event.processedAt ? "processed" : "received",
    dedupeStatus: "deduped by providerEventId",
    payloadPreview: redactForStorage(event.payload)
  };
}

export function toAuditTimelineItem(event: {
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  metadata: unknown;
  createdAt: Date;
}): AdminAuditTimelineItem {
  return {
    timestamp: event.createdAt,
    actorType: event.actorEmail?.includes("@") ? "admin" : event.actorUserId ? "user" : event.action.includes("webhook") ? "provider" : "system",
    actorLabel: event.actorEmail ?? event.actorUserId ?? "system",
    action: event.action,
    metadata: redactForStorage(event.metadata)
  };
}

export function adminCaseInclude() {
  return {
    owner: {
      include: {
        productOrders: { orderBy: { updatedAt: "desc" }, take: 3 },
        entitlements: { orderBy: { updatedAt: "desc" }, take: 3 }
      }
    },
    operationState: true,
    providerCandidates: { orderBy: { updatedAt: "desc" }, take: 3 },
    providerInvitations: { orderBy: { createdAt: "desc" }, take: 3 },
    providerReports: { orderBy: { updatedAt: "desc" }, take: 3, include: { reportSummary: true } },
    monitoringEnrollments: { orderBy: { updatedAt: "desc" }, take: 3 }
  };
}

async function createAudit(
  db: AdminOpsDatabase,
  actor: AppUser,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Prisma.InputJsonValue
) {
  await db.auditEvent.create({
    data: {
      actorUserId: actor.id,
      actorEmail: actor.email,
      action,
      targetType,
      targetId,
      metadata: redactForStorage(metadata)
    }
  });
}

function deriveProgress(
  invitationStatus: string | undefined,
  reportStatus: string,
  report: NonNullable<AdminCaseRecord["providerReports"]>[number] | undefined
): CaseProgressState {
  if (report?.completedAt || reportStatus === "complete") return "report_complete";
  if (report?.canceledAt || reportStatus === "canceled") return "canceled";
  if (report?.suspendedAt || reportStatus === "suspended") return "suspended";
  if (reportStatus && reportStatus !== "none") return "report_pending";
  if (invitationStatus === "completed") return "candidate_pending";
  if (invitationStatus === "expired") return "expired";
  if (invitationStatus && invitationStatus !== "none") return "invitation_sent";
  return "created";
}

function labelPayment(value: string): string {
  return value === "PAID" ? "Paid" : "Pending payment";
}

function labelInvitation(value: string): string {
  if (value === "completed") return "Candidate action required";
  if (value === "none") return "No invitation";
  return "Invitation created";
}

function labelReport(value: string): string {
  if (value === "complete") return "Report complete";
  if (value === "none") return "Report pending";
  return value === "canceled" || value === "suspended" ? value : "Report pending";
}

function labelSummary(value: SummaryState): string {
  if (value === "summary_ready") return "Summary ready";
  if (value === "summary_failed") return "Summary failed";
  return "Summary pending";
}

function labelReadiness(value: string): string {
  return value === "needs_attorney_review" || value === "manual_review" ? "Manual review recommended" : value || "Not enough information";
}

function labelMonitoring(value: MonitoringState): string {
  if (value === "monitoring_active") return "Monitoring active";
  if (value === "monitoring_canceled") return "Monitoring canceled";
  return "No monitoring";
}

function normalizeAnonymizationStatus(value: string | undefined): AnonymizationStatus {
  return value === "requested" || value === "completed" ? value : "none";
}

function latestProductOrder(record: AdminCaseRecord) {
  return record.productOrders?.[0] ?? record.owner?.productOrders?.[0];
}

function isAnonymizedEmail(value: string | undefined): boolean {
  return Boolean(value?.startsWith("deleted-") && value.endsWith("@deleted.local"));
}

function isFailureRawOutput(value: unknown): boolean {
  return Boolean(asRecord(value).failure);
}

function readReadinessStatus(value: unknown): string {
  const record = asRecord(value);
  const status = record.status;
  return typeof status === "string" ? status : "insufficient_information";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function collectProviderIds(record: AdminCaseRecord): string[] {
  return [
    record.id,
    ...(record.providerCandidates ?? []).map((item) => item.providerCandidateId),
    ...(record.providerInvitations ?? []).map((item) => item.providerInvitationId),
    ...(record.providerReports ?? []).map((item) => item.providerReportId)
  ].filter(Boolean);
}

function providerEventMatches(payload: unknown, providerIds: string[]): boolean {
  const serialized = JSON.stringify(payload);
  return providerIds.some((id) => serialized.includes(id));
}
