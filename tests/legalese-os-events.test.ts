import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { parseEnv } from "@/lib/env";
import { parsePublicEnv } from "@/lib/public-env";
import {
  emitLegalEaseOsEvent,
  hashLegalEaseOsReference,
  normalizeLegalEaseOsEventPayload
} from "@/lib/legalese-os-events";

const baseEvent = {
  source_system: "expungement_ai",
  event_type: "wilma.safety_flagged",
  occurred_at: "2026-06-18T14:30:00.000Z",
  subject_type: "wilma_session",
  subject_ref: "wilma_session_123",
  jurisdiction: "IL",
  pathway_key: "illinois_non_conviction",
  packet_type: "expungement_petition",
  metrics: { flagged_count: 1 },
  summary: "Wilma safety guard fired for legal-advice request.",
  recommended_operator_action: "Review the guard summary.",
  pii_classification: "hashed_reference_only"
} as const;

const enabledConfig = {
  LEGALEASE_OS_EVENTS_ENABLED: "true",
  LEGALEASE_OS_EVENTS_ENDPOINT: "https://command.example.com/api/os-loops/events",
  LEGALEASE_OS_EVENTS_SECRET: "os_events_secret_123"
} as const;

describe("LegalEase OS event exporter", () => {
  it("is configured only through server env, not public env", () => {
    const config = parseEnv({
      NEXT_PUBLIC_APP_URL: "https://product.example.com",
      ...enabledConfig
    });
    const publicConfig = parsePublicEnv({
      NEXT_PUBLIC_APP_URL: "https://product.example.com",
      ...enabledConfig
    });
    const moduleSource = readFileSync("src/lib/legalese-os-events.ts", "utf8");

    expect(config).toMatchObject(enabledConfig);
    expect(publicConfig).toEqual({ NEXT_PUBLIC_APP_URL: "https://product.example.com" });
    expect(JSON.stringify(publicConfig)).not.toContain("LEGALEASE_OS_EVENTS_SECRET");
    expect(moduleSource).toContain('import "server-only";');
  });

  it.each([
    ["disabled", { LEGALEASE_OS_EVENTS_ENABLED: "false", LEGALEASE_OS_EVENTS_ENDPOINT: enabledConfig.LEGALEASE_OS_EVENTS_ENDPOINT, LEGALEASE_OS_EVENTS_SECRET: enabledConfig.LEGALEASE_OS_EVENTS_SECRET }, "disabled"],
    ["missing endpoint", { LEGALEASE_OS_EVENTS_ENABLED: "true", LEGALEASE_OS_EVENTS_SECRET: enabledConfig.LEGALEASE_OS_EVENTS_SECRET }, "missing_endpoint"],
    ["missing secret", { LEGALEASE_OS_EVENTS_ENABLED: "true", LEGALEASE_OS_EVENTS_ENDPOINT: enabledConfig.LEGALEASE_OS_EVENTS_ENDPOINT }, "missing_secret"]
  ])("%s exporter is a safe no-op", async (_label, configEnv, skippedReason) => {
    const fetcher = vi.fn();

    await expect(emitLegalEaseOsEvent(baseEvent, { configEnv, fetcher })).resolves.toMatchObject({
      enabled: skippedReason !== "disabled",
      sent: false,
      skipped_reason: skippedReason
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("normalizes payloads with allowlisted fields, hashed references, and deterministic idempotency", () => {
    const first = normalizeLegalEaseOsEventPayload({
      ...baseEvent,
      name: "Jane Person",
      email: "jane@example.com",
      phone: "212-555-1212",
      date_of_birth: "1975-04-12",
      ssn: "123-45-6789",
      raw_facts: { caseNumber: "secret-case" },
      wilma_transcript: "My case was dismissed and my email is jane@example.com.",
      payment_intent_id: "pi_123_secret",
      token: "tok_secret",
      metrics: {
        flagged_count: 1,
        customerEmail: "jane@example.com",
        phone: "212-555-1212",
        paymentIntentId: "pi_123_secret"
      }
    });
    const second = normalizeLegalEaseOsEventPayload(baseEvent);

    expect(first).toMatchObject({
      source_system: "expungement_ai",
      event_type: "wilma.safety_flagged",
      subject_type: "wilma_session",
      subject_ref_hash: hashLegalEaseOsReference("wilma_session_123"),
      jurisdiction: "IL",
      pii_classification: "hashed_reference_only"
    });
    expect(first.idempotency_key).toBe(second.idempotency_key);
    const serialized = JSON.stringify(first);
    expect(serialized).not.toContain("wilma_session_123");
    expect(serialized).not.toContain("Jane Person");
    expect(serialized).not.toContain("jane@example.com");
    expect(serialized).not.toContain("212-555-1212");
    expect(serialized).not.toContain("1975-04-12");
    expect(serialized).not.toContain("123-45-6789");
    expect(serialized).not.toContain("secret-case");
    expect(serialized).not.toContain("dismissed and my email");
    expect(serialized).not.toContain("pi_123_secret");
    expect(serialized).not.toContain("tok_secret");
  });

  it("creates a signed POST request with Command Center headers", async () => {
    const timestamp = "2026-06-18T14:30:00.000Z";
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 202 }));

    const result = await emitLegalEaseOsEvent(baseEvent, {
      configEnv: enabledConfig,
      fetcher,
      now: () => new Date(timestamp)
    });

    expect(result).toMatchObject({ enabled: true, sent: true, status: 202 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(enabledConfig.LEGALEASE_OS_EVENTS_ENDPOINT);
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    const body = String(init.body);
    const expectedSignature = createHmac("sha256", enabledConfig.LEGALEASE_OS_EVENTS_SECRET)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    expect(headers["content-type"]).toBe("application/json");
    expect(headers["x-legalease-os-timestamp"]).toBe(timestamp);
    expect(headers["x-legalease-os-signature"]).toBe(`sha256=${expectedSignature}`);
    expect(headers["x-idempotency-key"]).toBe(result.idempotency_key);
    expect(JSON.parse(body)).toEqual(normalizeLegalEaseOsEventPayload(baseEvent));
  });

  it("swallows network failures and returns a safe failure result", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("network down");
    });

    await expect(emitLegalEaseOsEvent(baseEvent, { configEnv: enabledConfig, fetcher })).resolves.toMatchObject({
      enabled: true,
      sent: false,
      skipped_reason: "send_failed"
    });
  });
});
