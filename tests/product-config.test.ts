import { describe, expect, it } from "vitest";
import { createProductConfig } from "@/lib/product-config";
import { parseEnv } from "@/lib/env";

const env = parseEnv({
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/legalease_recordshield",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  RECORDSHIELD_BASIC_PRICE_CENTS: "14900",
  RECORDSHIELD_FAMILY_PRICE_CENTS: "29900",
  RECORDSHIELD_BUSINESS_PRICE_CENTS: "49900",
  STRIPE_SECRET_KEY: "sk_test_123",
  STRIPE_WEBHOOK_SECRET: "whsec_123",
  STRIPE_PRICE_RECORDSHIELD_PRIVATE_REVIEW: "price_recordshield_private_review",
  STRIPE_PRICE_MONITORING_MONTHLY: "price_monitoring_monthly",
  STRIPE_PRICE_MONITORING_ANNUAL: "price_monitoring_annual",
  STRIPE_PRICE_MONITORING_PLUS_MONTHLY: "price_monitoring_plus_monthly",
  CHECKR_API_KEY: "checkr_test_123",
  CHECKR_BASE_URL: "https://api.checkr-staging.com/v1",
  CHECKR_PACKAGE_SLUG: "recordshield_background_check",
  CHECKR_WORK_LOCATION_COUNTRY: "US",
  CHECKR_WORK_LOCATION_STATE: "NY",
  CHECKR_WORK_LOCATION_CITY: "New York"
});

describe("createProductConfig", () => {
  it("maps env prices into product config", () => {
    const config = createProductConfig(env);

    expect(config.basic).toMatchObject({
      key: "basic",
      name: "RecordShield Basic",
      priceCents: 14900,
      formattedPrice: "$149"
    });
    expect(config.family.formattedPrice).toBe("$299");
    expect(config.business.formattedPrice).toBe("$499");
  });

  it("uses default price cents when build env omits product pricing", () => {
    const config = createProductConfig(parseEnv({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" }));

    expect(config.basic.priceCents).toBe(14900);
    expect(config.family.priceCents).toBe(29900);
    expect(config.business.priceCents).toBe(49900);
  });
});
