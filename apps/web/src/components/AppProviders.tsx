"use client";

import type { ReactNode } from "react";
import { Analytics } from "@/components/Analytics";
import { CookieConsent } from "@/components/CookieConsent";
import { ToastProvider } from "@/components/ui/Toast";
import { ConsentProvider } from "@/lib/consent-context";

/**
 * Client-side providers mounted once by the root layout: consent, toast
 * notifications and consent-gated analytics.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConsentProvider>
      <ToastProvider>
        {children}
        <CookieConsent />
        <Analytics />
      </ToastProvider>
    </ConsentProvider>
  );
}
