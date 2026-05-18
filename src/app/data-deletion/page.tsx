const supportEmail = "support@legalease.law";

export default function DataDeletionPage() {
  return (
    <main className="panel">
      <h1>Data deletion and anonymization</h1>
      <p>
        You can request deletion or anonymization of personal information by contacting LegalEase support at{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>
      <h2>What may be changed</h2>
      <p>
        LegalEase can remove or anonymize account contact fields, case display fields, provider references, AI summary
        records, and support notes where supported by the current workflow.
      </p>
      <h2>What may be retained</h2>
      <p>
        Some non-personal billing, fraud-prevention, audit, compliance, or security records may be retained where
        appropriate.
      </p>
    </main>
  );
}
