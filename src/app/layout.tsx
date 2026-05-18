import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MobileNavMenu } from "@/app/components/MobileNavMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecordShield by LegalEase",
  description:
    "A private record review that helps consumers understand what may appear and see their next step.",
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
              <Image
                className="logo"
                src="/brand/images/recordshield-header-logo.png"
                alt="RecordShield by LegalEase"
                width={430}
                height={96}
                priority
              />
            </Link>
            <div className="links">
              <Link href="/#how">How it works</Link>
              <Link href="/#what-you-get">Inside your review</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/ask-wilma">Ask Wilma</Link>
              <Link href="/support">Support</Link>
              <Link className="cta" href="/#pricing">
                Start my private review
              </Link>
            </div>
            <MobileNavMenu />
          </div>
        </nav>
        <main>{children}</main>
        <footer className="footer">
          <div className="footer-brand">
            <strong>RecordShield by LegalEase</strong>
            <span>© 2026 LegalEase. All rights reserved.</span>
          </div>
          <div className="footer-links">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/support">Support</Link>
            <Link href="/#personal-use-notice">Personal Use Notice</Link>
          </div>
          <Image
            className="footer-logo"
            src="/brand/images/legalease-footer-logo.png"
            alt="LegalEase"
            width={174}
            height={54}
          />
        </footer>
      </body>
    </html>
  );
}
