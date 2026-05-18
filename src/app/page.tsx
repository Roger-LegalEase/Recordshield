import Link from "next/link";
import Image from "next/image";
import { RecordCheckCheckoutForm } from "@/app/components/RecordCheckCheckoutForm";

const scenarioCards = [
  {
    title: "You got the interview.",
    body: "Now you want to know what the background check might see.",
    tag: "Check before they check"
  },
  {
    title: "You found the apartment.",
    body: "Before you pay another fee, know what may come up.",
    tag: "Know before you pay"
  },
  {
    title: "You are applying for a license.",
    body: "Do not let old paperwork create new stress.",
    tag: "Prepare before review"
  },
  {
    title: "You are trying to move forward.",
    body: "If cleanup is the next chapter, start by knowing what is actually there.",
    tag: "Start with clarity"
  }
];

const steps = [
  ["01", "Pay once", "Start your private review for $149.", ""],
  ["02", "Complete the secure check", "Use the provider link to request your personal report.", "accent"],
  ["03", "Get your summary", "RecordShield organizes the result into your private dashboard.", "accent"],
  ["04", "Choose your next step", "Save your summary, ask Wilma, or start a cleanup review if appropriate.", ""]
];

const checkoutIncludes = [
  "Secure personal record check",
  "Private dashboard",
  "Record summary",
  "Next-step guidance"
];

const faqs = [
  [
    "Is RecordShield a background check company?",
    "RecordShield helps you request a personal record check through a secure provider flow, then organizes the result so you can understand what may appear."
  ],
  ["Can I use it to screen someone else?", "No. RecordShield is for your own personal review only."],
  [
    "Does RecordShield provide legal advice?",
    "No. It provides general information and personal planning support."
  ],
  [
    "What happens if something appears?",
    "You will see a private summary and possible next steps. If cleanup may be worth exploring, we may point you toward LegalEase or Expungement.ai."
  ],
  [
    "What happens after I pay?",
    "After payment, you'll receive access to your private review dashboard and instructions to complete your secure provider check."
  ],
  [
    "How long does the review take?",
    "Timing can vary based on provider processing, court data, and jurisdiction. Your dashboard will show where your review stands."
  ],
  ["Is this a subscription?", "No. RecordShield Private Review is a one-time $149 review."]
];

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-inner">
          <div>
            <span className="eyebrow">Private Record Review</span>
            <h1 className="h1" id="hero-heading">
              Know what may show up before it costs you the opportunity.
            </h1>
            <p className="lead">
              RecordShield helps you privately review what may appear on your record before a job, housing, licensing,
              or agency check catches you off guard.
            </p>
            <div className="actions">
              <Link className="btn primary" href="#pricing">
                Start my private review — $149
              </Link>
              <Link className="btn ghost" href="#how">
                See how it works
              </Link>
            </div>
            <div className="chips" aria-label="RecordShield trust badges">
              <span className="chip">One-time payment</span>
              <span className="chip">Secure provider check</span>
              <span className="chip">Private dashboard</span>
            </div>
          </div>
          <figure className="life rs-hero-status-visual" aria-label="RecordShield review status">
            <Image
              src="/brand/images/hero-lifestyle.png"
              alt="Person privately reviewing their RecordShield dashboard at home"
              fill
              priority
              sizes="(max-width: 1040px) calc(100vw - 56px), 620px"
            />
            <div className="float-card rs-status-card" aria-label="RecordShield dashboard preview">
              <div className="top">
                <span>RecordShield Private Review</span>
                <strong>$149</strong>
              </div>
              <div className="bar" aria-hidden="true">
                <span />
              </div>
              <div className="mini rs-status-mini">
                <div>
                  <strong>Secure Check</strong>
                  <p>In progress</p>
                </div>
                <div>
                  <strong>Private Summary</strong>
                  <p>Preparing review</p>
                </div>
                <div>
                  <strong>Next Step</strong>
                  <p>Available after review</p>
                </div>
              </div>
            </div>
          </figure>
        </div>
      </section>

      <section className="section moment-section" id="moment-before">
        <div className="container moment-shell">
          <div className="moment-copy">
            <span className="eyebrow">Built for the moment before</span>
            <h2 className="h2 light">That &quot;what if something shows up?&quot; feeling is real.</h2>
            <p>
              RecordShield is built for the moment when you need answers before somebody else runs the check.
            </p>
          </div>
          <div className="scenario-track">
            {scenarioCards.map(({ title, body, tag }) => (
              <article className="scenario-card" key={title}>
                <span>{tag}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section white includes-section" id="what-you-get">
        <div className="container review-preview-layout">
          <div className="review-preview-intro">
            <span className="eyebrow">Inside your review</span>
            <h2 className="h2">What happens after the check</h2>
            <p className="body">
              Once your secure check is complete, RecordShield organizes the result into a private workspace so you can
              see what surfaced, what may need attention, and what to do next.
            </p>
          </div>
          <div className="product-preview-stage" aria-label="RecordShield private review dashboard preview">
            <article className="preview-main-card">
              <div className="preview-main-top">
                <div>
                  <span className="preview-kicker">Private workspace</span>
                  <h3>Private Review Dashboard</h3>
                </div>
                <span className="status-pill">Summary in progress</span>
              </div>

              <div className="preview-status-row">
                <div>
                  <span>Review status</span>
                  <strong>Preparing summary</strong>
                </div>
                <div>
                  <span>Report status</span>
                  <strong>Report received</strong>
                </div>
                <div>
                  <span>Next step</span>
                  <strong>Available soon</strong>
                </div>
              </div>

              <div className="preview-summary-block">
                <span>Details being organized</span>
                <p>
                  RecordShield is reviewing the report details and preparing your private summary.
                </p>
              </div>

              <div className="preview-progress-strip" aria-label="Review progress">
                <span className="complete">Secure check ✓</span>
                <span className="complete">Report received ✓</span>
                <span>Summary in progress</span>
                <span>Next steps</span>
              </div>

              <div className="preview-actions" aria-label="Available dashboard actions">
                <span>Ask Wilma</span>
                <span>Save notes</span>
                <span>View next steps</span>
              </div>
            </article>

            <article className="preview-float-card preview-float-appears">
              <h3>What appears</h3>
              <ul>
                <li>Report detail</li>
                <li>More information may help</li>
                <li>Source details pending</li>
              </ul>
            </article>

            <article className="preview-float-card preview-float-steps">
              <h3>Possible next steps</h3>
              <ul>
                <li>Download summary</li>
                <li>Ask Wilma</li>
                <li>Upload documents</li>
                <li>Explore cleanup review</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section navy" id="how">
        <div className="container">
          <span className="eyebrow">How it works</span>
          <h2 className="h2 light">From payment to private summary.</h2>
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
          <h2 className="h2">Start your private review</h2>
          <div className="pricing pricing-funnel">
            <div className="pricing-copy">
              <p className="body">
                For $149, get a private record check, dashboard, and review summary built for your own planning before
                an important application, opportunity, or cleanup decision.
              </p>
              <p className="body pricing-helper">
                A report alone can leave you guessing. RecordShield helps you understand what may appear and what to do
                next.
              </p>
              <p className="trust-line">No subscription. No hidden membership. No scare tactics.</p>
            </div>
            <div className="price checkout-card">
              <span className="badge">Private Record Review</span>
              <h3>RecordShield Private Review</h3>
              <div className="big">$149</div>
              <p className="small">One-time payment</p>
              <ul>
                {checkoutIncludes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <RecordCheckCheckoutForm source="pricing" />
              <p className="small">For your own personal review only. Not for screening other people.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section navy" id="ask-wilma">
        <div className="container wilma-support">
          <div>
            <span className="eyebrow">Wilma support</span>
            <h2 className="h2 light">When record language gets confusing, ask Wilma.</h2>
            <p className="body muted-light">
              Wilma can explain common record terms, help organize your questions, and point you toward general next
              steps.
            </p>
            <p className="wilma-note">General information only. No legal advice or guarantees.</p>
            <div className="wilma-prompt-row" aria-label="Example Wilma questions">
              <span>What does this term mean?</span>
              <span>What documents should I look for?</span>
              <span>What could I do next?</span>
            </div>
          </div>
          <Link className="btn primary" href="/ask-wilma">
            Ask Wilma
          </Link>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="container">
          <span className="eyebrow">Questions</span>
          <h2 className="h2">Frequently asked questions</h2>
          <div className="faq-grid">
            {faqs.map(([question, answer]) => (
              <article className="faq-card" key={question}>
                <h3>{question}</h3>
                <p>{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section white" id="personal-use-notice">
        <div className="container">
          <div className="notice notice-spaced personal-use-block">
            <h2>Personal Use Notice</h2>
            <p>
              RecordShield is for your own personal review and planning. It is not a service for employers, landlords,
              lenders, insurers, agencies, or other third parties to screen, rank, approve, deny, or make eligibility
              decisions about another person. LegalEase does not provide legal advice, guarantee outcomes, determine
              court eligibility, or change provider records directly.
            </p>
          </div>
        </div>
      </section>

      <Link className="mobile-sticky-cta" href="#pricing">
        Start private review — $149
      </Link>
    </>
  );
}
