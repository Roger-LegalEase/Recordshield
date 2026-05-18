import { redactForStorage } from "@/lib/security/redaction";

export type ReconciliationActionType =
  | "review_created"
  | "dashboard_access_granted"
  | "provider_invite_retry_requested"
  | "provider_invite_failed"
  | "provider_reminder_due"
  | "review_engine_job_requested"
  | "qa_overdue_flagged"
  | "review_ready_email_retry_requested"
  | "duplicate_payment_flagged";

export type ReconciliationAction = {
  type: ReconciliationActionType;
  orderId?: string;
  caseId?: string;
  userId?: string;
  email?: string | null;
  metadata?: Record<string, unknown>;
};

export type ReconciliationThresholds = {
  providerInviteAfterMinutes: number;
  providerReminderFirstHours: number;
  providerReminderSecondHours: number;
  reviewEngineAfterMinutes: number;
  qaOverdueBusinessHours: number;
  duplicatePaymentWindowMinutes: number;
};

export const defaultReconciliationThresholds: ReconciliationThresholds = {
  providerInviteAfterMinutes: 15,
  providerReminderFirstHours: 24,
  providerReminderSecondHours: 72,
  reviewEngineAfterMinutes: 60,
  qaOverdueBusinessHours: 24,
  duplicatePaymentWindowMinutes: 30
};

export type ReconciliationDatabase = {
  productOrder: {
    findMany(args: unknown): Promise<Array<{
      id: string;
      userId?: string | null;
      email?: string | null;
      productKey: string;
      status: string;
      stripeCustomerId?: string | null;
      stripeCheckoutSessionId?: string | null;
      stripePaymentIntentId?: string | null;
      paidAt?: Date | null;
      createdAt?: Date;
      updatedAt?: Date;
    }>>;
  };
  user: {
    findFirst(args: unknown): Promise<{ id: string; email?: string | null } | null>;
    create(args: { data: { email: string; role?: "CUSTOMER" } }): Promise<{ id: string; email?: string | null }>;
  };
  shieldCase: {
    findFirst(args: unknown): Promise<{ id: string; ownerId?: string | null; status: string; updatedAt?: Date | null } | null>;
    findMany(args: unknown): Promise<Array<{
      id: string;
      ownerId?: string | null;
      productKey: string;
      status: string;
      createdAt?: Date;
      updatedAt?: Date;
      providerInvitations?: Array<{ id: string; status: string; invitationUrl?: string | null; createdAt?: Date; updatedAt?: Date }>;
      providerReports?: Array<{ id: string; status: string; completedAt?: Date | null; updatedAt?: Date; reportSummary?: unknown | null }>;
      operationState?: { manualReviewNeeded?: boolean; manualReviewFlaggedAt?: Date | null; displayState?: unknown } | null;
      owner?: { id: string; email?: string | null } | null;
    }>>;
    create(args: {
      data: {
        ownerId: string;
        productKey: string;
        displayName: string;
        status: "IN_REVIEW";
      };
    }): Promise<{ id: string; ownerId?: string | null; status: string }>;
  };
  auditEvent: {
    create(args: {
      data: {
        actorUserId?: string;
        actorEmail?: string;
        action: string;
        targetType: string;
        targetId?: string;
        metadata: unknown;
      };
    }): Promise<unknown>;
    findMany?(args: unknown): Promise<Array<{ action: string; targetId?: string | null; createdAt: Date; metadata?: unknown }>>;
  };
  caseOperationState?: {
    upsert(args: {
      where: { caseId: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }): Promise<unknown>;
  };
};

export type ReconciliationDependencies = {
  now?: Date;
  thresholds?: Partial<ReconciliationThresholds>;
  retryProviderInvite?: (input: { caseId: string; userId?: string | null; email?: string | null }) => Promise<{ ok: boolean; reason?: string }>;
  enqueueReviewEngine?: (input: { caseId: string; reportId: string }) => Promise<{ ok: boolean; reason?: string }>;
  sendReviewReadyEmail?: (input: { caseId: string; userId?: string | null; email?: string | null }) => Promise<{ ok: boolean; reason?: string }>;
  log?: (action: ReconciliationAction) => void;
};

export async function reconcileRecordShieldReviews(
  db: ReconciliationDatabase,
  dependencies: ReconciliationDependencies = {}
): Promise<{ actions: ReconciliationAction[] }> {
  const now = dependencies.now ?? new Date();
  const thresholds = { ...defaultReconciliationThresholds, ...dependencies.thresholds };
  const actions: ReconciliationAction[] = [];

  await reconcilePaidOrders(db, actions, now, thresholds, dependencies);
  await reconcileActiveCases(db, actions, now, thresholds, dependencies);
  await flagDuplicatePayments(db, actions, now, thresholds);

  actions.forEach((action) => dependencies.log?.(action));
  return { actions };
}

async function reconcilePaidOrders(
  db: ReconciliationDatabase,
  actions: ReconciliationAction[],
  now: Date,
  thresholds: ReconciliationThresholds,
  dependencies: ReconciliationDependencies
) {
  const paidOrders = await db.productOrder.findMany({
    where: { status: "PAID", productKey: "record_check" },
    orderBy: { paidAt: "desc" },
    take: 500
  });

  for (const order of paidOrders) {
    const user = await findOrCreateUser(db, order.email, order.userId);
    const caseRecord = await db.shieldCase.findFirst({
      where: {
        productKey: "record_check",
        OR: [{ ownerId: user?.id ?? order.userId ?? undefined }, { owner: { email: order.email ?? undefined } }]
      }
    });

    if (!caseRecord && user) {
      const created = await db.shieldCase.create({
        data: {
          ownerId: user.id,
          productKey: "record_check",
          displayName: "RecordShield Private Review",
          status: "IN_REVIEW"
        }
      });
      actions.push({ type: "review_created", orderId: order.id, caseId: created.id, userId: user.id, email: order.email });
      await logReconciliationEvent(db, "recordshield.reconciliation.review_created", "ShieldCase", created.id, {
        orderId: order.id,
        stripeCheckoutSessionId: order.stripeCheckoutSessionId,
        stripePaymentIntentId: order.stripePaymentIntentId
      }, user.id, order.email);
      continue;
    }

    if (caseRecord && user && !caseRecord.ownerId) {
      actions.push({ type: "dashboard_access_granted", orderId: order.id, caseId: caseRecord.id, userId: user.id, email: order.email });
      await logReconciliationEvent(db, "recordshield.reconciliation.dashboard_access_granted", "ShieldCase", caseRecord.id, {
        orderId: order.id
      }, user.id, order.email);
    }

    if (caseRecord && isOlderThan(order.paidAt ?? order.updatedAt ?? now, now, thresholds.providerInviteAfterMinutes, "minutes")) {
      const result = await dependencies.retryProviderInvite?.({ caseId: caseRecord.id, userId: user?.id ?? order.userId, email: order.email });
      if (result) {
        actions.push({
          type: result.ok ? "provider_invite_retry_requested" : "provider_invite_failed",
          orderId: order.id,
          caseId: caseRecord.id,
          userId: user?.id ?? order.userId ?? undefined,
          email: order.email,
          metadata: result.reason ? { reason: result.reason } : undefined
        });
        await logReconciliationEvent(db, result.ok ? "recordshield.reconciliation.provider_invite_retry_requested" : "recordshield.reconciliation.provider_invite_failed", "ShieldCase", caseRecord.id, {
          orderId: order.id,
          result
        }, user?.id ?? order.userId ?? undefined, order.email);
      }
    }
  }
}

async function reconcileActiveCases(
  db: ReconciliationDatabase,
  actions: ReconciliationAction[],
  now: Date,
  thresholds: ReconciliationThresholds,
  dependencies: ReconciliationDependencies
) {
  const cases = await db.shieldCase.findMany({
    where: { productKey: "record_check", status: { in: ["IN_REVIEW", "ACTION_REQUIRED"] } },
    include: {
      owner: true,
      providerInvitations: { orderBy: { createdAt: "desc" }, take: 1 },
      providerReports: { orderBy: { updatedAt: "desc" }, take: 1, include: { reportSummary: true } },
      operationState: true
    },
    take: 500
  });

  for (const caseRecord of cases) {
    const invitation = caseRecord.providerInvitations?.[0];
    const report = caseRecord.providerReports?.[0];
    const updatedAt = caseRecord.updatedAt ?? now;
    const userId = caseRecord.owner?.id ?? caseRecord.ownerId ?? undefined;
    const email = caseRecord.owner?.email ?? null;

    if (invitation && invitation.status !== "completed" && isOlderThan(invitation.createdAt ?? updatedAt, now, thresholds.providerReminderFirstHours, "hours")) {
      const reminderWindow = isOlderThan(invitation.createdAt ?? updatedAt, now, thresholds.providerReminderSecondHours, "hours") ? "72h" : "24h";
      actions.push({ type: "provider_reminder_due", caseId: caseRecord.id, userId, email, metadata: { reminderWindow } });
      await logReconciliationEvent(db, "recordshield.reconciliation.provider_reminder_due", "ShieldCase", caseRecord.id, {
        reminderWindow
      }, userId, email);
    }

    if (report?.completedAt && !report.reportSummary && isOlderThan(report.completedAt, now, thresholds.reviewEngineAfterMinutes, "minutes")) {
      const result = await dependencies.enqueueReviewEngine?.({ caseId: caseRecord.id, reportId: report.id });
      actions.push({
        type: "review_engine_job_requested",
        caseId: caseRecord.id,
        userId,
        email,
        metadata: result ? { ok: result.ok, reason: result.reason } : { queued: false, reason: "No enqueueReviewEngine dependency configured" }
      });
      await logReconciliationEvent(db, "recordshield.reconciliation.review_engine_job_requested", "ShieldCase", caseRecord.id, {
        reportId: report.id,
        result
      }, userId, email);
    }

    if (report?.completedAt && caseRecord.operationState?.manualReviewNeeded && isOlderThan(report.completedAt, now, thresholds.qaOverdueBusinessHours, "hours")) {
      actions.push({ type: "qa_overdue_flagged", caseId: caseRecord.id, userId, email });
      await db.caseOperationState?.upsert({
        where: { caseId: caseRecord.id },
        create: {
          caseId: caseRecord.id,
          manualReviewNeeded: true,
          manualReviewReason: "QA overdue after report received",
          anonymizationStatus: "none",
          displayState: { qaStatus: "qa_overdue" }
        },
        update: {
          displayState: { qaStatus: "qa_overdue" }
        }
      });
      await logReconciliationEvent(db, "recordshield.reconciliation.qa_overdue_flagged", "ShieldCase", caseRecord.id, {}, userId, email);
    }

    if (report?.reportSummary && db.auditEvent.findMany) {
      const emailEvents = await db.auditEvent.findMany({
        where: { targetId: caseRecord.id, action: "review_ready_email_sent" },
        take: 1
      });
      if (emailEvents.length === 0) {
        const result = await dependencies.sendReviewReadyEmail?.({ caseId: caseRecord.id, userId, email });
        actions.push({
          type: "review_ready_email_retry_requested",
          caseId: caseRecord.id,
          userId,
          email,
          metadata: result ? { ok: result.ok, reason: result.reason } : { queued: false, reason: "No sendReviewReadyEmail dependency configured" }
        });
        await logReconciliationEvent(db, "recordshield.reconciliation.review_ready_email_retry_requested", "ShieldCase", caseRecord.id, {
          result
        }, userId, email);
      }
    }
  }
}

async function flagDuplicatePayments(
  db: ReconciliationDatabase,
  actions: ReconciliationAction[],
  now: Date,
  thresholds: ReconciliationThresholds
) {
  const since = new Date(now.getTime() - thresholds.duplicatePaymentWindowMinutes * 60_000);
  const recentPaidOrders = await db.productOrder.findMany({
    where: { status: "PAID", productKey: "record_check", paidAt: { gte: since } },
    orderBy: { paidAt: "desc" },
    take: 500
  });
  const byEmail = new Map<string, typeof recentPaidOrders>();
  for (const order of recentPaidOrders) {
    if (!order.email) continue;
    const key = order.email.toLowerCase();
    byEmail.set(key, [...(byEmail.get(key) ?? []), order]);
  }

  for (const orders of byEmail.values()) {
    if (orders.length < 2) continue;
    const newest = orders[0];
    actions.push({
      type: "duplicate_payment_flagged",
      orderId: newest.id,
      email: newest.email,
      metadata: { duplicateOrderIds: orders.map((order) => order.id) }
    });
    await logReconciliationEvent(db, "recordshield.reconciliation.duplicate_payment_flagged", "ProductOrder", newest.id, {
      duplicateOrderIds: orders.map((order) => order.id)
    }, newest.userId ?? undefined, newest.email);
  }
}

async function findOrCreateUser(
  db: ReconciliationDatabase,
  email?: string | null,
  userId?: string | null
): Promise<{ id: string; email?: string | null } | null> {
  const existing = await db.user.findFirst({
    where: {
      OR: [{ id: userId ?? undefined }, { email: email ?? undefined }]
    }
  });
  if (existing) return existing;
  if (!email) return null;
  return db.user.create({ data: { email, role: "CUSTOMER" } });
}

async function logReconciliationEvent(
  db: ReconciliationDatabase,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown>,
  actorUserId?: string,
  actorEmail?: string | null
) {
  await db.auditEvent.create({
    data: {
      actorUserId,
      actorEmail: actorEmail ?? undefined,
      action,
      targetType,
      targetId,
      metadata: redactForStorage(metadata)
    }
  });
}

function isOlderThan(date: Date, now: Date, amount: number, unit: "minutes" | "hours"): boolean {
  const ms = unit === "minutes" ? amount * 60_000 : amount * 60 * 60_000;
  return now.getTime() - date.getTime() >= ms;
}
