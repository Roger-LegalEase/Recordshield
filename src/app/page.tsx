import Link from "next/link";
import { RecordCheckCheckoutForm } from "@/app/components/RecordCheckCheckoutForm";
import { WilmaChatPanel } from "@/app/components/WilmaChatPanel";

const useCases = [
  {
    image: "/brand/images/use-case-interview.png",
    alt: "Person privately preparing before an interview",
    title: "Before a job background check",
    body: "See what may appear before an employer asks for a background check.",
  },
  {
    image: "/brand/images/use-case-application.png",
    alt: "Person completing a private application at home",
    title: "Before housing or licensing",
    body: "Understand old records before an application asks questions you are not ready to answer.",
  },
  {
    image: "/brand/images/use-case-clarity.png",
    alt: "Person calmly reviewing information on a phone",
    title: "Before you assume the worst",
    body: "Get a private review so you know what you're actually dealing with before you spend more time, money, or energy worrying.",
  },
];

const features = [
  ["Secure personal record check", "Complete a secure check through our secure provider flow."],
  ["Private dashboard", "Track your review, save notes, and keep everything organized."],
  ["Easy-to-understand review summary", "See what appears and what may matter before your next application."],
  ["Clear next-step guidance", "If something appears, RecordShield helps you understand whether a cleanup path may be worth exploring."],
];

const steps = [
  ["01", "Start your private review", "Create your secure dashboard and begin your personal record review.", ""],
  ["02", "Complete the secure check", "Follow the secure provider flow so your report can be requested safely.", "accent"],
  ["03", "Review what appears", "RecordShield organizes what shows up so you do not have to decode it alone.", "accent"],
  ["04", "See your next step", "If something may be cleanable, we show you where to go next through LegalEase or Expungement.ai.", ""],
];

const includes = [
  "Secure personal record check",
  "Private dashboard",
  "Easy-to-understand review summary",
  "Clear next-step guidance",
  "Saved notes and documents",
  "No subscription",
];

const bestFor = ["Job applications", "Housing applications", "Licensing", "Personal planning", "Expungement readiness"];

const faqs = [
  [
    "Is RecordShield a background check company?",
    "RecordShield helps you request a personal record check through a secure provider flow and then organizes the information in a private dashboard so you can understand what may appear."
  ],
  [
    "Can I use RecordShield to screen someone else?",
    "No. RecordShield is for your own personal review only. It cannot be used by employers, landlords, lenders, insurers, agencies, or other third parties to screen another person."
  ],
  [
    "Does RecordShield provide legal advice?",
    "No. RecordShield provides general information and personal planning support. It does not provide legal advice or guarantee outcomes."
  ],
  [
    "What happens if something appears on my record?",
    "RecordShield helps you understand what appeared and whether a cleanup path may be worth exploring through LegalEase or Expungement.ai."
  ],
  [
    "Does RecordShield remove records?",
    "No. RecordShield does not remove, seal, expunge, or change records directly. If cleanup may be worth exploring, we can point you toward next steps."
  ],
  ["Is this a subscription?", "No. RecordShield Private Review is a one-time $149 review."],
  [
    "What should I avoid entering into Wilma?",
    "Do not enter Social Security numbers, full birth dates, driver license numbers, or other sensitive identifiers."
  ]
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
              RecordShield helps you privately check your record, understand what appears, and see your next step before a job, housing,
              licensing, or agency review catches you off guard.
            </p>
            <div className="actions">
              <Link className="btn primary" href="#pricing">
                Start my private review
              </Link>
              <Link className="btn ghost" href="#how">
                See how it works
              </Link>
            </div>
            <div className="chips" aria-label="RecordShield trust badges">
              <span className="chip">Private dashboard</span>
              <span className="chip">One-time $149 review</span>
              <span className="chip">No subscription</span>
              <span className="chip">Clear next-step guidance</span>
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
                <span>Private Record Review</span>
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
          <span className="eyebrow">Before they ask, know for yourself.</span>
          <h2 className="h2">A private review before an important life move.</h2>
          <p className="body">
            A record issue can come up when you are applying for a job, housing, school, licensing, or a volunteer opportunity.
            RecordShield gives you a private way to see what may appear, understand what it means, and decide what to do next.
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

      <section className="section white" id="what-you-get">
        <div className="container product">
          <div>
            <span className="eyebrow">What you get</span>
            <h2 className="h2">More than a report. A clearer way to understand your record.</h2>
            <p className="body">
              RecordShield gives you a private dashboard where you can see your check status, review what appears, save notes, and
              understand possible next steps without sorting through confusing record language on your own.
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
            No subscription. No hidden membership. No scare tactics. Just a private way to see what may show up and understand what to do
            next.
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
            For people who need to know what may show up before a job, housing, licensing, or personal decision.
          </p>
          <div className="pricing">
            <div className="price">
              <span className="badge">Private Record Review</span>
              <span className="eyebrow">One-time payment</span>
              <div className="big">$149</div>
              <p className="small">
                Privately check your record, understand what appears, and see possible next steps before an important application or life
                decision.
              </p>
              <ul>
                {includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="best-for">
                <strong>Best for:</strong>
                <ul className="best-for-list">
                  {bestFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="pricing-trust-row">
                <span>No subscription</span>
                <span>No hidden membership</span>
                <span>No scare tactics</span>
              </div>
              <RecordCheckCheckoutForm source="pricing" />
              <p className="small">For your own personal review only. Not for screening other people.</p>
            </div>
            <div className="side">
              <div className="monitor">
                <h3>Checkout summary</h3>
                <p>
                  RecordShield Private Review includes one private dashboard, one secure personal record check, and clear next-step
                  guidance for your own planning.
                </p>
                <div className="option">
                  <strong>RecordShield Private Review</strong>
                  <div className="small">$149</div>
                </div>
              </div>
              <div className="notice">
                <h4>Personal use notice</h4>
                <p>
                  RecordShield is for your own personal review and planning. It is not a service for employers, landlords, lenders,
                  insurers, agencies, or other third parties to screen, rank, approve, deny, or make eligibility decisions about another
                  person. LegalEase does not provide legal advice, guarantee outcomes, determine court eligibility, or change provider
                  records directly.
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
            <p>
              Wilma can explain common record terms, help organize your facts, and point you toward possible self-help next steps when
              appropriate.
            </p>
            <p className="wilma-note">Wilma gives general information only. She does not provide legal advice or guarantee outcomes.</p>
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
            </div>
          </div>
          <WilmaChatPanel />
        </div>
      </section>

      <section className="section white">
        <div className="container">
          <span className="eyebrow">Private dashboard</span>
          <h2 className="h2">Everything about your review, organized in one place.</h2>
          <p className="body">Track your Private Record Review, review status, findings, documents, notes, and Wilma questions from one private dashboard.</p>
          <img className="dashboard-wide" src="/brand/images/product-device-mockup.png" alt="RecordShield dashboard modules" loading="lazy" />
          <div className="notice notice-spaced">
            <h4>Personal use notice</h4>
            <p>
              RecordShield is for your own personal review and planning. It is not a service for employers, landlords, lenders, insurers,
              agencies, or other third parties to screen, rank, approve, deny, or make eligibility decisions about another person.
              LegalEase does not provide legal advice, guarantee outcomes, determine court eligibility, or change provider records
              directly.
            </p>
          </div>
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
    </>
  );
}
