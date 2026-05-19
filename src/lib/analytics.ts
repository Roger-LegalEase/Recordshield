import type { Prisma } from "@prisma/client";

export const analyticsFunnelEvents = [
  "chat_started",
  "state_selected",
  "readiness_completed",
  "eligibility_completed",
  "email_captured",
  "may_be_ready",
  "likely_eligible",
  "checkout_started",
  "checkout_completed",
  "paid",
  "checkr_invitation_created",
  "report_status_updated",
  "summary_generated",
  "summary_failed",
  "monitoring_started",
  "monitoring_canceled",
  "deletion_requested",
  "deletion_completed",
  "document_generated",
  "refund_requested",
  "support_requested"
] as const;

export const conversionTrackingEvents = [
  "recordshield_start",
  "recordshield_completion",
  "cleanup_cta_click",
  "expungement_ai_intake_started",
  "payment_completed",
  "packet_generated"
] as const;

export type ConversionTrackingEvent = (typeof conversionTrackingEvents)[number];
export type AnalyticsFunnelEvent = (typeof analyticsFunnelEvents)[number] | ConversionTrackingEvent;

export type AnalyticsDatabase = {
  auditEvent: {
    create(args: {
      data: {
        actorUserId?: string;
        actorEmail?: string;
        action: string;
        targetType: string;
        targetId?: string;
        metadata: Prisma.InputJsonValue;
      };
    }): Promise<unknown>;
  };
};

export function isAnalyticsFunnelEvent(value: string): value is AnalyticsFunnelEvent {
  return (
    (analyticsFunnelEvents as readonly string[]).includes(value) ||
    (conversionTrackingEvents as readonly string[]).includes(value)
  );
}

const sensitiveAnalyticsKeys = [
  "ssn",
  "socialsecurity",
  "social_security",
  "dob",
  "dateofbirth",
  "date_of_birth",
  "birthdate",
  "driverlicense",
  "driver_license",
  "license_number",
  "rawpayload",
  "raw_payload",
  "providerpayload",
  "provider_payload",
  "reportdetails",
  "report_details",
  "criminalrecord",
  "criminal_record",
  "offense",
  "authorization",
  "token",
  "secret"
] as const;

export function assertSafeAnalyticsMetadata(value: unknown): void {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") {
      continue;
    }
    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (sensitiveAnalyticsKeys.some((sensitiveKey) => normalized.includes(sensitiveKey))) {
        throw new Error(`Analytics metadata cannot include sensitive key: ${key}`);
      }
      stack.push(child);
    }
  }
}

export async function trackAnalyticsEvent(
  db: AnalyticsDatabase | { auditEvent?: AnalyticsDatabase["auditEvent"] },
  input: {
    event: AnalyticsFunnelEvent;
    actorUserId?: string;
    actorEmail?: string;
    targetType: string;
    targetId?: string;
    metadata?: Prisma.InputJsonValue;
  }
): Promise<void> {
  if (!db.auditEvent) {
    return;
  }

  assertSafeAnalyticsMetadata(input.metadata ?? {});

  await db.auditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail,
      action: `analytics.${input.event}`,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue
    }
  });
}
