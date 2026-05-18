import Link from "next/link";
import { RecordCheckCheckoutForm } from "@/app/components/RecordCheckCheckoutForm";

const momentCards = [
  ["Job applications", "Know what may appear before an employer asks."],
  ["Housing applications", "Prepare before application questions catch you off guard."],
  ["Licensing reviews", "Understand old records before a licensing process."],
  ["Cleanup decisions", "See whether a cleanup path may be worth exploring."]
];

const includedCards = [
  ["Secure personal check", "Complete the provider check needed to start your review."],
  ["Private dashboard", "Track your status and keep notes in one place."],
  ["Record summary", "See what appears without decoding confusing report language alone."],
  ["Next-step guidance", "Download your summary, ask Wilma, or explore cleanup through Expungement.ai."]
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
              <span className="chip">Clear next-step summary</span>
            </div>
          </div>
          <figure className="life rs-hero-status-visual" aria-label="RecordShield review status">
            <img src="/brand/images/hero-lifestyle.png" alt="Person privately reviewing their RecordShield dashboard at home" />
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

      <section className="section" id="moment-before">
        <div className="container">
          <h2 className="h2">Built for the moment before the background check.</h2>
          <div className="moment-grid">
            {momentCards.map(([title, body]) => (
              <article className="feature rs-compact-card" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section white" id="what-you-get">
        <div className="container">
          <span className="eyebrow">What you get</span>
          <h2 className="h2">What your $149 review includes</h2>
          <div className="features rs-includes-grid">
            {includedCards.map(([title, body]) => (
              <article className="feature" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section navy" id="how">
        <div className="container">
          <span className="eyebrow">How it works</span>
          <h2 className="h2 light">How it works</h2>
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
                For $149, get a private review built for your own planning before an important application,
                opportunity, or cleanup decision.
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
            <h2 className="h2 light">Questions after your review starts?</h2>
            <p className="body muted-light">
              Wilma can explain common record terms, help organize your questions, and point you toward general next
              steps.
            </p>
            <p className="wilma-note">General information only. No legal advice or guarantees.</p>
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

      <section className="section white" id="personal-use">
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
