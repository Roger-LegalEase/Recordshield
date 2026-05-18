import { expungementHandoffSelectableData } from "@/lib/recordshield/status-orchestration";

type ExpungementHandoffConsentProps = {
  action: string;
};

export function ExpungementHandoffConsent({ action }: ExpungementHandoffConsentProps) {
  return (
    <form className="handoff-consent-card" action={action} method="post">
      <div>
        <p className="eyebrow">Cleanup review</p>
        <h2>Use my RecordShield details to start my cleanup review?</h2>
        <p className="muted">
          We can use selected details from your RecordShield review to help start your Expungement.ai cleanup review.
          You will be able to review and confirm everything before continuing.
        </p>
      </div>
      <fieldset>
        <legend>Selected details</legend>
        {expungementHandoffSelectableData.map((label) => (
          <label key={label} className="checkbox-row">
            <input type="checkbox" name="selectedData" value={label} defaultChecked />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <label className="checkbox-row consent-row">
        <input type="checkbox" name="consent" value="yes" required />
        <span>I consent to share the selected RecordShield details with Expungement.ai to start my cleanup review.</span>
      </label>
      <div className="status-actions">
        <button className="button" type="submit">
          Continue to Expungement.ai
        </button>
        <a className="button secondary" href="/dashboard">
          Do not share details
        </a>
      </div>
    </form>
  );
}
