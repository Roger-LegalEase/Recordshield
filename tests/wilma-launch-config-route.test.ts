import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createWilmaConfigRouteHandler } from "@/app/api/wilma/config/route";
import { hashLegalEaseOsReference } from "@/lib/legalese-os-events";
import type { WilmaLaunchConfig } from "@/wilma/launch/types";

describe("/api/wilma/config route", () => {
  it("returns public launch status without internal rollout details", async () => {
    const handler = createWilmaConfigRouteHandler({
      currentUser: async () => null,
      launchBackend: backend(config({ rolloutPercent: 100 }))
    });

    const response = await handler(new Request("http://localhost:3000/api/wilma/config?anonymousId=device"));
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(data.available).toBe(true);
    expect(data.allowedStates).toEqual(["IL", "PA", "MD", "DC", "MS", "TX"]);
    expect(data.rolloutPercent).toBeUndefined();
    expect(data.killSwitch).toBeUndefined();
    expect(data.betaTokens).toBeUndefined();
  });

  it("returns maintenance copy when offline", async () => {
    const handler = createWilmaConfigRouteHandler({
      currentUser: async () => null,
      launchBackend: backend(config({ maintenanceMode: true }))
    });

    const response = await handler(new Request("http://localhost:3000/api/wilma/config"));
    const data = (await response.json()) as { available: boolean; mode: string; message: string };

    expect(response.status).toBe(200);
    expect(data.available).toBe(false);
    expect(data.mode).toBe("maintenance");
    expect(data.message).toBe("Wilma is temporarily offline while we make updates. Please check back soon.");
  });

  it("enforces beta-only status for public config", async () => {
    const handler = createWilmaConfigRouteHandler({
      currentUser: async () => null,
      launchBackend: backend(config({ betaOnly: true, betaAllowedEmails: ["beta@example.com"] }))
    });

    const blocked = await handler(new Request("http://localhost:3000/api/wilma/config"));
    const allowed = await handler(new Request("http://localhost:3000/api/wilma/config?email=beta@example.com"));

    expect(((await blocked.json()) as { available: boolean; mode: string })).toMatchObject({
      available: false,
      mode: "beta_only"
    });
    expect(((await allowed.json()) as { available: boolean }).available).toBe(true);
  });

  it("emits a signed engine health event from the readiness seam when enabled and configured", async () => {
    const timestamp = "2026-06-18T18:30:00.000Z";
    const configEnv = legalEaseOsConfig({ enabled: "true" });
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 202 }));
    const handler = createWilmaConfigRouteHandler({
      currentUser: async () => null,
      launchBackend: backend(config({ maintenanceMode: true, betaOnly: true })),
      legalEaseOsConfigEnv: configEnv,
      legalEaseOsFetch: fetcher,
      now: () => new Date(timestamp)
    });

    const response = await handler(
      new Request("http://localhost:3000/api/wilma/config?email=roger@example.com&anonymousId=device-123")
    );

    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(configEnv.LEGALEASE_OS_EVENTS_ENDPOINT);
    expect(init.method).toBe("POST");

    const headers = init.headers as Record<string, string>;
    const body = String(init.body);
    const payload = JSON.parse(body) as Record<string, unknown>;
    const expectedSignature = createHmac("sha256", configEnv.LEGALEASE_OS_EVENTS_SECRET)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    expect(headers["content-type"]).toBe("application/json");
    expect(headers["x-legalease-os-timestamp"]).toBe(timestamp);
    expect(headers["x-legalease-os-signature"]).toBe(`sha256=${expectedSignature}`);
    expect(headers["x-idempotency-key"]).toBe(payload.idempotency_key);
    expect(payload).toMatchObject({
      source_system: "expungement_ai",
      event_type: "engine.health_changed",
      occurred_at: timestamp,
      subject_type: "engine",
      subject_ref_hash: hashLegalEaseOsReference("expungement-engine"),
      jurisdiction: "ALL",
      pii_classification: "none",
      summary: "Expungement engine health check completed.",
      recommended_operator_action: "Review if repeated health failures appear."
    });
    expect(payload.metrics).toMatchObject({
      available: false,
      allowed_states_count: 6,
      beta_only: true,
      maintenance_mode: true,
      kill_switch: false,
      mode: "maintenance"
    });
    expect(body).not.toContain("expungement-engine");
    expect(body).not.toContain("roger@example.com");
    expect(body).not.toContain("device-123");
    expect(body).not.toContain(configEnv.LEGALEASE_OS_EVENTS_SECRET);
  });

  it.each([
    ["disabled", legalEaseOsConfig({ enabled: "false" })],
    ["missing endpoint", { LEGALEASE_OS_EVENTS_ENABLED: "true", LEGALEASE_OS_EVENTS_SECRET: "os_events_secret_123" }],
    ["missing secret", { LEGALEASE_OS_EVENTS_ENABLED: "true", LEGALEASE_OS_EVENTS_ENDPOINT: "https://command.example.com/api/os-loops/events" }]
  ])("does not emit engine health when exporter is %s", async (_label, legalEaseOsConfigEnv) => {
    const fetcher = vi.fn();
    const handler = createWilmaConfigRouteHandler({
      currentUser: async () => null,
      launchBackend: backend(config()),
      legalEaseOsConfigEnv,
      legalEaseOsFetch: fetcher
    });

    const response = await handler(new Request("http://localhost:3000/api/wilma/config"));

    expect(response.status).toBe(200);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("does not break the readiness response when engine health export fails", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("Command Center unreachable");
    });
    const handler = createWilmaConfigRouteHandler({
      currentUser: async () => null,
      launchBackend: backend(config()),
      legalEaseOsConfigEnv: legalEaseOsConfig({ enabled: "true" }),
      legalEaseOsFetch: fetcher
    });

    const response = await handler(new Request("http://localhost:3000/api/wilma/config"));
    const data = (await response.json()) as { available: boolean };

    expect(response.status).toBe(200);
    expect(data.available).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

function config(overrides: Partial<WilmaLaunchConfig> = {}): WilmaLaunchConfig {
  return {
    publicEnabled: true,
    betaOnly: false,
    allowedStates: ["IL", "PA", "MD", "DC", "MS", "TX"],
    rolloutPercent: 100,
    maintenanceMode: false,
    killSwitch: false,
    betaAllowedEmails: [],
    betaTokens: [],
    ...overrides
  };
}

function backend(launchConfig: WilmaLaunchConfig) {
  return {
    async getLaunchConfig() {
      return launchConfig;
    }
  };
}

function legalEaseOsConfig({ enabled }: { enabled: "true" | "false" }) {
  return {
    LEGALEASE_OS_EVENTS_ENABLED: enabled,
    LEGALEASE_OS_EVENTS_ENDPOINT: "https://command.example.com/api/os-loops/events",
    LEGALEASE_OS_EVENTS_SECRET: "os_events_secret_123"
  };
}
