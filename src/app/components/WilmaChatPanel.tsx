"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

const promptChips = ["Case dismissed", "Completed probation", "Arrest, no conviction", "What may show up?", "Understand a charge"];

const stateOptions = [
  ["", "Select a state"],
  ["IL", "Illinois"],
  ["PA", "Pennsylvania"],
  ["MD", "Maryland"],
  ["DC", "District of Columbia"],
  ["MS", "Mississippi"],
  ["TX", "Texas"]
] as const;

type WilmaChatResponse = {
  sessionId?: string;
  assistantMessage?: string;
  nextQuestion?: string;
  showPaidCta?: boolean;
  allowPaidCta?: boolean;
  error?: string;
  message?: string;
};

export function WilmaChatPanel() {
  const [state, setState] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null);
  const [nextQuestion, setNextQuestion] = useState<string | null>(null);
  const [showPaidCta, setShowPaidCta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const anonymousId = useMemo(() => (typeof window === "undefined" ? "recordshield_web" : getAnonymousId()), []);

  async function askWilma(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/wilma/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-legalease-device-id": anonymousId
        },
        body: JSON.stringify({
          sessionId,
          message,
          state,
          email: email || undefined,
          anonymousId,
          deviceId: anonymousId
        })
      });
      const data = (await response.json().catch(() => ({}))) as WilmaChatResponse;

      if (!response.ok) {
        setError(data.message ?? data.error ?? "Wilma is not available right now.");
        return;
      }

      setSessionId(data.sessionId);
      setAssistantMessage(data.assistantMessage ?? "Wilma reviewed that.");
      setNextQuestion(data.nextQuestion ?? null);
      setShowPaidCta(Boolean(data.showPaidCta || data.allowPaidCta));
    } catch {
      setError("Wilma is not available right now.");
    } finally {
      setLoading(false);
    }
  }

  async function startDocumentPrepCheckout() {
    if (!sessionId) {
      setError("Ask Wilma first so checkout can attach to your session.");
      return;
    }

    setError(null);
    setCheckoutLoading(true);
    try {
      const response = await fetch(`/api/checkout/document-prep?sessionId=${encodeURIComponent(sessionId)}`, {
        method: "POST"
      });
      const data = (await response.json().catch(() => ({}))) as { url?: string | null; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? "Document-prep checkout is not available for this session.");
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError("Document-prep checkout is not available right now.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <form className="wilma-panel rs-wilma-panel" aria-label="Ask Wilma" onSubmit={askWilma}>
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
      <div className="wilma-body rs-wilma-body">
        <div className="prompt-row" aria-label="Example prompts">
          {promptChips.map((chip) => (
            <button className="prompt" key={chip} type="button" onClick={() => setMessage(chip)}>
              {chip}
            </button>
          ))}
        </div>
        <label className="field" htmlFor="wilma-state">
          Record state
        </label>
        <select id="wilma-state" name="state" value={state} onChange={(event) => setState(event.target.value)} required>
          {stateOptions.map(([value, label]) => (
            <option key={value || "empty"} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="field" htmlFor="wilma-email">
          Email for follow-up
        </label>
        <input
          id="wilma-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label className="field" htmlFor="wilma-situation">
          What happened?
        </label>
        <textarea
          id="wilma-situation"
          name="situation"
          placeholder="Briefly describe the situation. Do not include SSNs, full birth dates, driver license numbers, or other sensitive identifiers."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
        />
        <p className="small">Wilma gives general information only and does not guarantee outcomes.</p>
        <button className="btn primary rs-wilma-submit" type="submit" disabled={loading}>
          {loading ? "Asking..." : "Ask Wilma"}
        </button>
        {assistantMessage ? (
          <div className="rs-wilma-answer" aria-live="polite">
            <strong>Wilma</strong>
            <p>{assistantMessage}</p>
            {nextQuestion ? <p>{nextQuestion}</p> : null}
            {showPaidCta ? (
              <button className="btn primary" type="button" onClick={startDocumentPrepCheckout} disabled={checkoutLoading}>
                {checkoutLoading ? "Starting checkout..." : "Start document prep"}
              </button>
            ) : null}
          </div>
        ) : null}
        {error ? (
          <p className="rs-form-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function getAnonymousId(): string {
  const key = "recordshield_wilma_device_id";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const next = window.crypto?.randomUUID?.() ?? `device_${Date.now()}`;
  window.localStorage.setItem(key, next);
  return next;
}
