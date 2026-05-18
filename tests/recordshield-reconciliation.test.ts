import { describe, expect, it, vi } from "vitest";
import { reconcileRecordShieldReviews, type ReconciliationDatabase } from "@/lib/recordshield/reconciliation";

function createDb(overrides: Partial<ReconciliationDatabase> = {}): ReconciliationDatabase {
  return {
    productOrder: {
      findMany: vi.fn().mockResolvedValue([])
    },
    user: {
      findFirst: vi.fn().mockResolvedValue({ id: "user_1", email: "customer@example.com" }),
      create: vi.fn().mockResolvedValue({ id: "user_1", email: "customer@example.com" })
    },
    shieldCase: {
      findFirst: vi.fn().mockResolvedValue({ id: "case_1", ownerId: "user_1", status: "IN_REVIEW" }),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: "case_created", ownerId: "user_1", status: "IN_REVIEW" })
    },
    auditEvent: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([])
    },
    caseOperationState: {
      upsert: vi.fn().mockResolvedValue({})
    },
    ...overrides
  };
}

describe("RecordShield reconciliation", () => {
  it("creates a review for a successful payment with no review record", async () => {
    const db = createDb({
      productOrder: {
        findMany: vi.fn().mockResolvedValueOnce([
          {
            id: "order_1",
            userId: "user_1",
            email: "customer@example.com",
            productKey: "record_check",
            status: "PAID",
            paidAt: new Date("2026-05-18T12:00:00Z")
          }
        ]).mockResolvedValueOnce([])
      },
      shieldCase: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: "case_created", ownerId: "user_1", status: "IN_REVIEW" })
      }
    });

    const result = await reconcileRecordShieldReviews(db, { now: new Date("2026-05-18T12:20:00Z") });

    expect(result.actions).toContainEqual(expect.objectContaining({ type: "review_created", caseId: "case_created" }));
    expect(db.shieldCase.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ displayName: "RecordShield Private Review" })
    }));
  });

  it("flags provider invite failure after paid review gets stuck", async () => {
    const db = createDb({
      productOrder: {
        findMany: vi.fn().mockResolvedValueOnce([
          {
            id: "order_1",
            userId: "user_1",
            email: "customer@example.com",
            productKey: "record_check",
            status: "PAID",
            paidAt: new Date("2026-05-18T12:00:00Z")
          }
        ]).mockResolvedValueOnce([])
      }
    });

    const result = await reconcileRecordShieldReviews(db, {
      now: new Date("2026-05-18T12:20:00Z"),
      retryProviderInvite: vi.fn().mockResolvedValue({ ok: false, reason: "missing provider config" })
    });

    expect(result.actions).toContainEqual(expect.objectContaining({
      type: "provider_invite_failed",
      caseId: "case_1"
    }));
  });

  it("requests review engine work when report is received but no summary exists", async () => {
    const db = createDb({
      shieldCase: {
        findFirst: vi.fn().mockResolvedValue({ id: "case_1", ownerId: "user_1", status: "IN_REVIEW" }),
        create: vi.fn().mockResolvedValue({ id: "case_1", ownerId: "user_1", status: "IN_REVIEW" }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "case_1",
            ownerId: "user_1",
            productKey: "record_check",
            status: "IN_REVIEW",
            updatedAt: new Date("2026-05-18T12:00:00Z"),
            owner: { id: "user_1", email: "customer@example.com" },
            providerInvitations: [],
            providerReports: [
              {
                id: "report_1",
                status: "complete",
                completedAt: new Date("2026-05-18T12:00:00Z"),
                updatedAt: new Date("2026-05-18T12:00:00Z"),
                reportSummary: null
              }
            ],
            operationState: null
          }
        ])
      }
    });

    const result = await reconcileRecordShieldReviews(db, {
      now: new Date("2026-05-18T13:10:00Z"),
      enqueueReviewEngine: vi.fn().mockResolvedValue({ ok: true })
    });

    expect(result.actions).toContainEqual(expect.objectContaining({
      type: "review_engine_job_requested",
      caseId: "case_1"
    }));
  });

  it("flags QA overdue when manual review is still pending", async () => {
    const db = createDb({
      shieldCase: {
        findFirst: vi.fn().mockResolvedValue({ id: "case_1", ownerId: "user_1", status: "IN_REVIEW" }),
        create: vi.fn().mockResolvedValue({ id: "case_1", ownerId: "user_1", status: "IN_REVIEW" }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "case_1",
            ownerId: "user_1",
            productKey: "record_check",
            status: "IN_REVIEW",
            owner: { id: "user_1", email: "customer@example.com" },
            providerInvitations: [],
            providerReports: [
              {
                id: "report_1",
                status: "complete",
                completedAt: new Date("2026-05-17T12:00:00Z"),
                updatedAt: new Date("2026-05-17T12:00:00Z"),
                reportSummary: null
              }
            ],
            operationState: { manualReviewNeeded: true }
          }
        ])
      }
    });

    const result = await reconcileRecordShieldReviews(db, { now: new Date("2026-05-18T13:00:00Z") });

    expect(result.actions).toContainEqual(expect.objectContaining({ type: "qa_overdue_flagged" }));
    expect(db.caseOperationState?.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ displayState: { qaStatus: "qa_overdue" } })
    }));
  });

  it("flags duplicate payment risk without issuing an automatic refund", async () => {
    const db = createDb({
      productOrder: {
        findMany: vi.fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              id: "order_2",
              userId: "user_1",
              email: "customer@example.com",
              productKey: "record_check",
              status: "PAID",
              paidAt: new Date("2026-05-18T12:10:00Z")
            },
            {
              id: "order_1",
              userId: "user_1",
              email: "customer@example.com",
              productKey: "record_check",
              status: "PAID",
              paidAt: new Date("2026-05-18T12:00:00Z")
            }
          ])
      }
    });

    const result = await reconcileRecordShieldReviews(db, { now: new Date("2026-05-18T12:20:00Z") });

    expect(result.actions).toContainEqual(expect.objectContaining({
      type: "duplicate_payment_flagged",
      orderId: "order_2"
    }));
    expect(result.actions.some((action) => action.type === "refund_processed")).toBe(false);
  });
});
