"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type SignInFormProps = {
  initialEmail: string;
  redirectTo: string;
};

export function SignInForm({ initialEmail, redirectTo }: SignInFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const response = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, redirectTo })
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      emailDeliveryConfigured?: boolean;
    };

    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Could not send a sign-in link.");
      return;
    }

    setStatus("sent");
    setMessage(
      data.emailDeliveryConfigured
        ? "Check your email for a secure dashboard link."
        : "Dashboard email delivery is not configured yet. Contact support for access."
    );
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label className="field" htmlFor="sign-in-email">
        Email address
      </label>
      <input
        id="sign-in-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        placeholder="you@example.com"
        onChange={(event) => setEmail(event.target.value)}
      />
      <button className="btn primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send secure link"}
      </button>
      {message ? <p className={status === "error" ? "auth-error" : "auth-success"}>{message}</p> : null}
    </form>
  );
}
