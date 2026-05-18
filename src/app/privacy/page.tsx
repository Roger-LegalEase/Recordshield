export default function PrivacyPage() {
  return (
    <main className="panel">
      <h1>Privacy</h1>
      <p className="muted">RecordShield is built to collect only what is needed to provide your private review.</p>
      <h2>Information we may use</h2>
      <p>
        We may store your account contact details, payment references, provider status updates, review summaries,
        support notes, and records needed to operate the service.
      </p>
      <h2>Secure provider flow</h2>
      <p>
        Your personal record check may be completed through Checkr or another selected provider. Sensitive information
        such as Social Security numbers, full dates of birth, or driver license numbers should be entered only through
        the provider&apos;s secure flow when required.
      </p>
      <h2>Payments</h2>
      <p>Payments are processed through Stripe. RecordShield does not store your full payment card number.</p>
      <h2>AI-assisted summaries</h2>
      <p>
        RecordShield may use AI tools to help generate clear summaries from limited, minimized information. These
        summaries are for personal planning only and are not legal advice.
      </p>
      <h2>Deletion requests</h2>
      <p>
        You may request deletion or anonymization of your information. Some billing, audit, fraud-prevention, or
        compliance records may need to be retained when appropriate.
      </p>
    </main>
  );
}
