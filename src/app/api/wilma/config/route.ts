import { NextResponse } from "next/server";
import type { AppUser } from "@/lib/auth";
import { emitLegalEaseOsEvent, type LegalEaseOsEventOptions } from "@/lib/legalese-os-events";
import { createEnvWilmaLaunchBackend, type WilmaLaunchBackend } from "@/wilma/adapters/launchBackend";
import { evaluateWilmaLaunchAccess, toPublicWilmaLaunchConfig } from "@/wilma/launch/evaluateLaunchAccess";
import type { WilmaLaunchAccessDecision, WilmaLaunchConfig } from "@/wilma/launch/types";

type WilmaConfigRouteDependencies = {
  launchBackend?: WilmaLaunchBackend;
  currentUser?: () => Promise<AppUser | null>;
  legalEaseOsConfigEnv?: LegalEaseOsEventOptions["configEnv"];
  legalEaseOsFetch?: LegalEaseOsEventOptions["fetcher"];
  now?: () => Date;
};

export function createWilmaConfigRouteHandler(dependencies: WilmaConfigRouteDependencies = {}) {
  return async function GET(request: Request) {
    const launchBackend = dependencies.launchBackend ?? createEnvWilmaLaunchBackend();
    const currentUserResolver = dependencies.currentUser ?? (await import("@/lib/auth")).currentUser;
    const user = await currentUserResolver();
    const url = new URL(request.url);
    const config = await launchBackend.getLaunchConfig();
    const decision = evaluateWilmaLaunchAccess(config, {
      state: normalizeState(url.searchParams.get("state")),
      email: url.searchParams.get("email"),
      betaToken: url.searchParams.get("betaToken") ?? request.headers.get("x-wilma-beta-token"),
      anonymousId: url.searchParams.get("anonymousId"),
      deviceId: request.headers.get("x-legalease-device-id"),
      remoteIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"),
      user
    });

    await emitEngineHealthChanged(config, decision, dependencies);

    return NextResponse.json(toPublicWilmaLaunchConfig(decision), { status: 200 });
  };
}

export const GET = createWilmaConfigRouteHandler();

function normalizeState(value: string | null): string | undefined {
  return value?.trim().toUpperCase() || undefined;
}

async function emitEngineHealthChanged(
  config: WilmaLaunchConfig,
  decision: WilmaLaunchAccessDecision,
  dependencies: WilmaConfigRouteDependencies
) {
  try {
    await emitLegalEaseOsEvent(
      {
        source_system: "expungement_ai",
        event_type: "engine.health_changed",
        occurred_at: dependencies.now?.() ?? new Date(),
        subject_type: "engine",
        subject_ref: "expungement-engine",
        jurisdiction: "ALL",
        metrics: {
          available: decision.allowed,
          allowed_states_count: decision.allowedStates.length,
          beta_only: config.betaOnly,
          maintenance_mode: config.maintenanceMode,
          kill_switch: config.killSwitch,
          mode: decision.mode
        },
        summary: "Expungement engine health check completed.",
        recommended_operator_action: "Review if repeated health failures appear.",
        pii_classification: "none"
      },
      {
        configEnv: dependencies.legalEaseOsConfigEnv,
        fetcher: dependencies.legalEaseOsFetch,
        now: dependencies.now
      }
    );
  } catch {
    // LegalEase OS telemetry must never affect public readiness checks.
  }
}
