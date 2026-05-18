import { describe, expect, it } from "vitest";
import { assertRecordShieldSummarySafe, scanProhibitedRecordShieldLanguage } from "@/lib/recordshield/guardrails";

describe("RecordShield copy guardrails", () => {
  it("allows careful disclaimer language", () => {
    expect(scanProhibitedRecordShieldLanguage("General information only. No legal advice or guarantees.")).toEqual([
      { term: "guarantee", reason: "Do not guarantee outcomes." }
    ]);
    expect(scanProhibitedRecordShieldLanguage("General information only. This is not legal advice.")).toEqual([]);
  });

  it("blocks eligibility, qualification, and outcome promises", () => {
    const findings = scanProhibitedRecordShieldLanguage("You qualify and your record will be cleared.");

    expect(findings.map((finding) => finding.term)).toEqual(["qualify", "will be cleared/removed/sealed/expunged"]);
  });

  it("throws when generated summary copy is unsafe", () => {
    expect(() => assertRecordShieldSummarySafe("You are eligible and safe to apply.")).toThrow(/Unsafe RecordShield language/);
  });
});
