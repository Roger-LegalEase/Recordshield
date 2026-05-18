import type { RecordShieldDerivedStatus } from "@/lib/recordshield/status-orchestration";

type RecordShieldStatusPanelProps = {
  status: RecordShieldDerivedStatus;
};

export function RecordShieldStatusPanel({ status }: RecordShieldStatusPanelProps) {
  const { userFacing } = status;
  return (
    <section className="status-panel" aria-labelledby="review-status-title">
      <div>
        <p className="eyebrow">Review Status</p>
        <h2 id="review-status-title">{userFacing.title}</h2>
        <p className="muted">{userFacing.body}</p>
      </div>
      <dl className="status-detail-grid">
        <div>
          <dt>Current step</dt>
          <dd>{userFacing.currentStep}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatDateTime(status.lastUpdatedAt)}</dd>
        </div>
        <div>
          <dt>Next step</dt>
          <dd>{userFacing.nextStep}</dd>
        </div>
        <div>
          <dt>Need help?</dt>
          <dd>{userFacing.supportNote}</dd>
        </div>
      </dl>
      <div className="status-actions">
        {userFacing.primaryCta ? (
          <a className="button" href={userFacing.primaryCta.href}>
            {userFacing.primaryCta.label}
          </a>
        ) : null}
        {userFacing.secondaryCta ? (
          <a className="button secondary" href={userFacing.secondaryCta.href}>
            {userFacing.secondaryCta.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}
