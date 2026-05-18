"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type CheckoutResponse = {
  url?: string | null;
  error?: string;
};

type RecordCheckCheckoutFormProps = {
  source: string;
};

export function RecordCheckCheckoutForm({ source }: RecordCheckCheckoutFormProps) {
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/checkout/record-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          inviteCode: inviteCode || undefined,
          source
        })
      });
      const data = (await response.json().catch(() => ({}))) as CheckoutResponse;

      if (!response.ok || !data.url) {
        setError(data.error ?? "Checkout is not available right now.");
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError("Checkout is not available right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="rs-checkout-form" onSubmit={startCheckout}>
      <label className="field" htmlFor={`${source}-checkout-email`}>
        Email for your private review
      </label>
      <div className="rs-checkout-row">
        <input
          id={`${source}-checkout-email`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Starting..." : "Start my private review"}
        </button>
      </div>
      <label className="field sr-only" htmlFor={`${source}-invite-code`}>
        Invite code
      </label>
      <input
        id={`${source}-invite-code`}
        className="rs-invite-input"
        name="inviteCode"
        type="text"
        autoComplete="off"
        placeholder="Invite code, if you have one"
        value={inviteCode}
        onChange={(event) => setInviteCode(event.target.value)}
      />
      {error ? (
        <p className="rs-form-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="small">You will complete payment in Stripe. No subscription.</p>
      )}
    </form>
  );
}
