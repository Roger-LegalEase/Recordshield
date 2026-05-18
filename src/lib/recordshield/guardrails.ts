export type GuardrailFinding = {
  term: string;
  reason: string;
};

const prohibitedPatterns: Array<{ pattern: RegExp; term: string; reason: string }> = [
  { pattern: /\byou (are )?eligible\b/i, term: "eligible", reason: "Do not promise eligibility." },
  { pattern: /\byou qualify\b/i, term: "qualify", reason: "Do not say the user qualifies." },
  { pattern: /\bguarantee(?:d|s)?\b/i, term: "guarantee", reason: "Do not guarantee outcomes." },
  { pattern: /\bwill be (?:cleared|removed|sealed|expunged)\b/i, term: "will be cleared/removed/sealed/expunged", reason: "Do not promise record changes." },
  { pattern: /\bsafe to apply\b/i, term: "safe to apply", reason: "Do not imply the user can safely apply." },
  { pattern: /\blegal advice\b/i, term: "legal advice", reason: "RecordShield provides general information only." }
];

const allowedDisclaimers = [
  "does not provide legal advice",
  "no legal advice",
  "not legal advice",
  "general information only"
];

export function scanProhibitedRecordShieldLanguage(text: string): GuardrailFinding[] {
  const normalized = text.toLowerCase();
  return prohibitedPatterns.flatMap((entry) => {
    if (!entry.pattern.test(text)) return [];
    if (entry.term === "legal advice" && allowedDisclaimers.some((phrase) => normalized.includes(phrase))) {
      return [];
    }
    return [{ term: entry.term, reason: entry.reason }];
  });
}

export function assertRecordShieldSummarySafe(text: string): void {
  const findings = scanProhibitedRecordShieldLanguage(text);
  if (findings.length > 0) {
    throw new Error(`Unsafe RecordShield language: ${findings.map((finding) => finding.term).join(", ")}`);
  }
}
