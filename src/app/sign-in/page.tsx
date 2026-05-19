import { SignInForm } from "@/app/sign-in/sign-in-form";

type SignInPageProps = {
  searchParams: Promise<{
    email?: string;
    redirectTo?: string;
    checkout?: string;
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  return (
    <div className="panel auth-panel">
      <span className="eyebrow">Dashboard access</span>
      <h1>Sign in to RecordShield</h1>
      <p className="muted">
        Enter the email you used for checkout. We will send a secure link to open your private review dashboard.
      </p>
      {params.checkout === "success" ? (
        <p className="auth-callout">
          Payment received. Check your email for dashboard access, or request a fresh link below.
        </p>
      ) : null}
      {params.error === "invalid-link" ? (
        <p className="auth-error">That sign-in link expired or was already used. Request a new secure link.</p>
      ) : null}
      <SignInForm initialEmail={params.email ?? ""} redirectTo={params.redirectTo ?? "/dashboard"} />
    </div>
  );
}
