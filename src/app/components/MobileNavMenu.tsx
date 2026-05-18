"use client";

import Link from "next/link";
import { useState } from "react";

const mobileLinks = [
  ["How it works", "/#how"],
  ["Inside your review", "/#what-you-get"],
  ["Pricing", "/#pricing"],
  ["Ask Wilma", "/ask-wilma"],
  ["Support", "/support"]
];

export function MobileNavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-menu">
      <button
        type="button"
        className="mobile-menu-button"
        aria-expanded={open}
        aria-controls="mobile-menu-links"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((current) => !current)}
      >
        Menu
      </button>
      <div className="mobile-menu-links" id="mobile-menu-links" hidden={!open}>
        {mobileLinks.map(([label, href]) => (
          <Link href={href} key={href} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
