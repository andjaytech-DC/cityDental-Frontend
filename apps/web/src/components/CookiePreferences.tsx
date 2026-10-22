"use client";

import { useConsentOptional } from "@/lib/consent-context";

/** Footer control that reopens the cookie banner so consent can be changed. */
export function CookiePreferences() {
  const consent = useConsentOptional();
  if (!consent) return null;
  return (
    <button type="button" className="cd-link-button" onClick={consent.reset}>
      Cookie settings
    </button>
  );
}
