const dashboardItems = [
  ["Secure check", "In progress"],
  ["Private summary", "Preparing review"],
  ["Next step", "Available after review"]
];

const recordRows = [
  ["Review type", "Private Record Review"],
  ["Report detail", "Status listed"],
  ["Source", "County information pending"],
  ["Next label", "Possible path"]
];

export function HeroRecordStage() {
  return (
    <figure className="record-hero-stage" aria-label="Animated RecordShield review preview">
      <div className="record-card" aria-label="Sample private review record">
        <div className="record-card-header">
          <div>
            <span className="record-kicker">RecordShield</span>
            <h2>Private Review</h2>
          </div>
          <span className="record-chip">Needs review</span>
        </div>
        <div className="record-redaction-group" aria-hidden="true">
          <span className="record-redaction redaction-one" />
          <span className="record-redaction redaction-two" />
          <span className="record-redaction redaction-three" />
        </div>
        <div className="record-row-grid">
          {recordRows.map(([label, value]) => (
            <div className="record-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="record-note">
          <span>Located</span>
          <p>Record details are organized for private review before your next step.</p>
        </div>
        <div className="reviewed-stamp" aria-hidden="true">
          Reviewed
        </div>
      </div>
      <div className="hero-dashboard-card" aria-label="RecordShield dashboard status preview">
        <div className="hero-dashboard-top">
          <span>Dashboard preview</span>
          <strong>Live status</strong>
        </div>
        {dashboardItems.map(([label, value]) => (
          <div className="hero-dashboard-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </figure>
  );
}
