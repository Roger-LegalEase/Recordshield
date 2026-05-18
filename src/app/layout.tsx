import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecordShield by LegalEase",
  description:
    "A private record review that helps consumers understand what may appear and see their next move.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="nav" aria-label="Main navigation">
          <div className="nav-inner">
            <Link href="/" aria-label="RecordShield home">
              <img className="logo" src="/brand/images/recordshield-header-logo.png" alt="RecordShield by LegalEase" />
            </Link>
            <div className="links">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/ask-wilma">Ask Wilma</Link>
              <Link href="/support">Support</Link>
              <Link href="/dashboard">Account</Link>
              <Link className="cta" href="/api/checkout/record-check">
                Start my private review
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="footer">
          <div>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/support">Support</Link>
            <Link href="/beta-disclaimer">Personal Use Notice</Link>
          </div>
          <img className="footer-logo" src="/brand/images/legalease-footer-logo.png" alt="LegalEase" />
        </footer>
      </body>
    </html>
  );
}
