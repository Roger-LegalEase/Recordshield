import { WilmaChatPanel } from "@/app/components/WilmaChatPanel";

export const metadata = {
  title: "Ask Wilma | RecordShield",
  description: "Ask Wilma for general record guidance and possible next steps."
};

export default function AskWilmaPage() {
  return (
    <section className="section navy">
      <div className="container wilma rs-wilma-wrap">
        <div>
          <span className="eyebrow">Ask Wilma</span>
          <h1 className="h2 light">Clear record guidance without guessing.</h1>
          <p className="body muted-light">
            Choose your state and briefly describe what happened. Wilma can explain common record terms, help organize your facts, and
            point you toward possible self-help next steps when appropriate.
          </p>
          <p className="rs-wilma-note">
            Do not enter Social Security numbers, full birth dates, driver license numbers, or other sensitive identifiers.
          </p>
        </div>
        <WilmaChatPanel />
      </div>
    </section>
  );
}
