"use client";

import Link from "next/link";
import { useConsent } from "@/lib/consent-context";

/**
 * Cookie banner shown until the visitor makes a choice. Essential session
 * cookies are always on; analytics is opt-in.
 */
export function CookieConsent() {
  const { consent, accept, deny } = useConsent();

  if (consent !== "unknown") return null;

  return (
    <div className="cd-consent" role="region" aria-label="Cookie preferences">
      <div className="cd-consent-copy">
        <p>
          <strong>Cookies on CityDental.</strong> We use essential cookies to keep sign-in secure. Optional analytics
          cookies help us improve the site and are only set if you accept.{" "}
          <Link href="/contact">Questions about privacy?</Link>
        </p>
      </div>
      <div className="cd-consent-actions">
        <button type="button" className="cd-button cd-button-primary cd-button-sm" onClick={accept}>
          Accept analytics
        </button>
        <button type="button" className="cd-button cd-button-secondary cd-button-sm" onClick={deny}>
          Essential only
        </button>
      </div>
    </div>
  );
}
