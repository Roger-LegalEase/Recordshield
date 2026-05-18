const supportEmail = "support@legalease.law";

export default function SupportPage() {
  return (
    <main className="panel">
      <h1>Support</h1>
      <p className="muted">Need help with your RecordShield review?</p>
      <p>
        Contact LegalEase support at <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>
      <h2>What support can help with</h2>
      <ul className="panel-list">
        <li>Payment questions</li>
        <li>Accessing your secure provider invitation</li>
        <li>Review status updates</li>
        <li>Dashboard access</li>
        <li>Data deletion or anonymization requests</li>
      </ul>
      <h2>What support cannot do</h2>
      <p>
        Support cannot provide legal advice, guarantee outcomes, change court records, change provider records
        directly, or use RecordShield to make employment, housing, credit, insurance, or eligibility decisions about
        another person.
      </p>
      <h2>Important</h2>
      <p>RecordShield is for personal review and planning only.</p>
    </main>
  );
}
