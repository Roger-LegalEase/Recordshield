import Link from "next/link";

const useCases = [
  {
    image: "/brand/images/use-case-interview.png",
    alt: "Person privately preparing before an interview",
    title: "Before the interview",
    body: "Know what may appear before a job opportunity turns into a background check.",
  },
  {
    image: "/brand/images/use-case-application.png",
    alt: "Person completing a private application at home",
    title: "Before the application",
    body: "Understand old records before housing, school, licensing, or volunteer forms ask hard questions.",
  },
  {
    image: "/brand/images/use-case-clarity.png",
    alt: "Person calmly reviewing information on a phone",
    title: "Before you assume the worst",
    body: "Get a private review so you know what you're actually dealing with before you spend more time, money, or energy worrying.",
  },
];

const features = [
  ["Secure record check", "Start a personal record check through a trusted provider flow."],
  ["Private dashboard", "Track your review, save notes, and keep everything organized in one place."],
  ["Private Record Review", "See what appears and understand what may matter without decoding confusing record language on your own."],
  ["Next-step summary", "If something appears, RecordShield helps you understand whether a cleanup path may be worth exploring."],
];

const steps = [
  ["01", "Start your private review", "Create your secure dashboard and begin your personal record check.", ""],
  ["02", "Complete the secure check", "Follow the provider flow so your report can be requested safely.", "accent"],
  ["03", "Review what appears", "RecordShield organizes what shows up so you can understand it without guessing.", "accent"],
  ["04", "See your next move", "If something may be cleanable, we'll show you the next step through LegalEase or Expungement.ai.", ""],
];

const includes = [
  "Secure personal record check",
  "Private RecordShield dashboard",
  "Private Record Review",
  "Issue summary",
  "Next-step summary",
  "Expungement.ai path if applicable",
];

const promptChips = ["Case dismissed", "Completed probation", "Arrest, no conviction", "What may show up?", "Understand a charge"];

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-inner">
          <div>
            <span className="eyebrow">Private Record Review</span>
            <h1 className="h1" id="hero-heading">
              Know what may show up before it gets in your way.
            </h1>
            <p className="lead">
              RecordShield helps you privately check your record, understand what appears, and see your next step before an employer,
              landlord, licensing board, or agency asks.
            </p>
            <div className="actions">
              <Link className="btn primary" href="/api/checkout/record-check">
                Start my private review
              </Link>
              <Link className="btn ghost" href="#how">
                See how it works
              </Link>
            </div>
          </div>
          <figure className="life">
            <img src="/brand/images/hero-lifestyle.png" alt="Person privately reviewing their RecordShield dashboard at home" />
            <div className="privacy-badge">
              <span aria-hidden="true">✓</span>
              Private dashboard
            </div>
            <div className="float-card" aria-label="RecordShield dashboard preview">
              <div className="top">
                <span>RecordShield check</span>
                <strong>In progress</strong>
              </div>
              <div className="bar" aria-hidden="true">
                <span />
              </div>
              <div className="mini">
                <div>
                  <strong>Check status</strong>
                  <p>Your check is underway</p>
                </div>
                <div>
                  <strong>Next-step summary</strong>
                  <p>Review in progress</p>
                </div>
              </div>
            </div>
            <div className="ready-card">
              <span aria-hidden="true">✓</span>
              Review ready
            </div>
          </figure>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="eyebrow">Know before they know</span>
          <h2 className="h2">A private review before an important life move.</h2>
          <p className="body">
            A record issue can surface at the worst possible time. RecordShield gives you a private way to see what may appear and
            understand your next move before a job, housing, school, licensing, or volunteer opportunity raises the question.
          </p>
          <div className="grid3">
            {useCases.map((card) => (
              <article className="use" key={card.title}>
                <img className="use-img" src={card.image} alt={card.alt} loading="lazy" />
                <div className="use-icon" aria-hidden="true" />
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section white">
        <div className="container product">
          <div>
            <span className="eyebrow">What you get</span>
            <h2 className="h2">More than a report. A private review of what it means.</h2>
            <p className="body">
              RecordShield organizes your record check, review status, findings, documents, notes, and next steps in one secure
              dashboard built for personal planning.
            </p>
            <div className="features">
              {features.map(([title, body]) => (
                <article className="feature" key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="device-panel">
            <img src="/brand/images/product-device-mockup.png" alt="RecordShield dashboard" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="section navy" id="how">
        <div className="container">
          <span className="eyebrow">How it works</span>
          <h2 className="h2 light">From uncertainty to clarity in four simple steps.</h2>
          <p className="body muted-light">
            No scare tactics. No mystery subscription. No courthouse confusion. Just a private way to see what may show up and understand
            what to do next.
          </p>
          <div className="steps">
            {steps.map(([num, title, body, variant]) => (
              <article className={`step ${variant}`} key={num}>
                <div className="num" aria-hidden="true">
                  {num}
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="container">
          <span className="eyebrow">Pricing</span>
          <h2 className="h2">One private review. Clear next steps. No subscription.</h2>
          <p className="body">
            RecordShield is built for people who need clarity before they apply, move forward, or spend more money trying to understand
            what may be on their record.
          </p>
          <div className="pricing">
            <div className="price">
              <span className="badge">Private Record Review</span>
              <span className="eyebrow">One-time payment</span>
              <div className="big">$149</div>
              <p className="small">Launch price: $99 for the first 250 customers. Regular price: $149.</p>
              <p className="small">
                For personal planning only. Not for employment, tenant, credit, insurance, housing, or eligibility screening.
              </p>
              <ul>
                {includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="best-for">
                <strong>Best for:</strong> job applications, housing, licensing, personal planning
              </p>
              <div className="pricing-trust-row">
                <span>No subscription</span>
                <span>No hidden membership</span>
                <span>No scare tactics</span>
              </div>
              <Link className="btn primary" href="/api/checkout/record-check">
                Start my private review
              </Link>
            </div>
            <div className="side">
              <div className="monitor">
                <h3>Deeper Court Review</h3>
                <p>
                  For reports that show something unclear or incomplete. If your review needs more court-level detail, you may be able to
                  request a deeper review before deciding what to do next.
                </p>
                <div className="option">
                  <strong>Deeper review</strong>
                  <div className="small">+$150</div>
                </div>
                <Link className="btn primary" href="/support">
                  Request deeper review
                </Link>
              </div>
              <div className="monitor">
                <h3>Record Watch</h3>
                <p>
                  Record Watch helps you keep your dashboard active, store your review, receive reminders, and stay updated on future
                  cleanup opportunities.
                </p>
                <div className="option">
                  <strong>Optional add-on</strong>
                  <div className="small">$49/year</div>
                </div>
              </div>
              <div className="notice">
                <h4>Personal use notice</h4>
                <p>
                  RecordShield is for personal planning only. It is not an employment, tenant, credit, insurance, housing, or eligibility
                  screening service. LegalEase does not provide legal advice, determine eligibility, guarantee outcomes, or negotiate on
                  your behalf.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section navy" id="ask-wilma">
        <div className="container wilma">
          <div>
            <span className="eyebrow">Meet Wilma</span>
            <h2>Clear guidance when record language gets confusing.</h2>
            <p>Wilma helps you understand record terms, organize your facts, and think through general next steps.</p>
            <p className="wilma-note">General information only. No legal advice or outcome guarantees.</p>
            <div className="wilma-guide-card">
              <video
                className="wilma-guide-video"
                aria-label="Wilma, the RecordShield clear record guide"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster="/brand/images/wilma-guide-full.png"
              >
                <source src="/brand/images/wilma-recordshield-loop.mp4" type="video/mp4" />
              </video>
              <p className="wilma-video-caption">General guidance only. No legal advice or outcome guarantees.</p>
            </div>
          </div>
          <form className="wilma-panel" aria-label="Ask Wilma preview">
            <div className="wilma-head">
              <div className="avatar">
                <img src="/brand/images/wilma-avatar-head.png" alt="" aria-hidden="true" />
              </div>
              <div>
                <h3>Ask Wilma</h3>
                <p>Clear record guidance</p>
                <small>General information only</small>
              </div>
            </div>
            <div className="wilma-body">
              <div className="prompt-row" aria-label="Example prompts">
                {promptChips.map((chip) => (
                  <button className="prompt" key={chip} type="button">
                    {chip}
                  </button>
                ))}
              </div>
              <label className="field" htmlFor="wilma-state">
                Record state
              </label>
              <select id="wilma-state" name="state" defaultValue="">
                <option value="">Select a state</option>
                <option value="CA">California</option>
                <option value="IL">Illinois</option>
                <option value="NY">New York</option>
                <option value="TX">Texas</option>
              </select>
              <label className="field" htmlFor="wilma-situation">
                What happened?
              </label>
              <textarea
                id="wilma-situation"
                name="situation"
                placeholder="Briefly describe the situation. Do not include SSNs, full birth dates, driver license numbers, or other sensitive identifiers."
              />
              <p className="small">Wilma gives general information only and does not guarantee outcomes.</p>
              <br />
              <button className="btn primary" type="button">
                Ask Wilma
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="section white">
        <div className="container">
          <span className="eyebrow">Private dashboard</span>
          <h2 className="h2">Everything about your review, organized in one place.</h2>
          <p className="body">Track your record check, review status, findings, documents, notes, and Wilma questions from one private dashboard.</p>
          <img className="dashboard-wide" src="/brand/images/product-device-mockup.png" alt="RecordShield dashboard modules" loading="lazy" />
          <div className="notice notice-spaced">
            <h4>Personal use notice</h4>
            <p>
              RecordShield is for personal planning only. It is not an employment, tenant, credit, insurance, housing, or eligibility
              screening service. RecordShield does not provide legal advice or guarantee that your record can be expunged, sealed, removed,
              or changed.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
