import { WilmaChatPanel } from "@/app/components/WilmaChatPanel";

export const metadata = {
  title: "Ask Wilma | RecordShield",
  description: "Ask Wilma for general record guidance and next-step screening."
};

export default function AskWilmaPage() {
  return (
    <section className="section navy">
      <div className="container wilma rs-wilma-wrap">
        <div>
          <span className="eyebrow">Ask Wilma</span>
          <h1 className="h2 light">Clear record guidance without guessing.</h1>
          <p className="body muted-light">
            Share the state and a short description of what happened. Wilma gives general information, helps organize facts, and can
            point you toward available self-help document-prep next steps when appropriate.
          </p>
          <p className="rs-wilma-note">Do not enter SSNs, full birth dates, driver license numbers, or other sensitive identifiers.</p>
        </div>
        <WilmaChatPanel />
      </div>
    </section>
  );
}
