"use client";

import Script from "next/script";
import { useConsent } from "@/lib/consent-context";

const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
const gaId = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Analytics is entirely opt-in: nothing is requested from a third party until
 * consent is granted. Configure one of:
 *   NEXT_PUBLIC_ANALYTICS_PROVIDER=plausible + NEXT_PUBLIC_ANALYTICS_DOMAIN
 *   NEXT_PUBLIC_ANALYTICS_PROVIDER=ga        + NEXT_PUBLIC_GA_ID
 */
export function Analytics() {
  const { consent } = useConsent();

  if (consent !== "granted") return null;

  if (provider === "plausible" && domain) {
    return <Script defer data-domain={domain} src="https://plausible.io/js/script.js" strategy="afterInteractive" />;
  }

  if (provider === "ga" && gaId) {
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { anonymize_ip: true });`}
        </Script>
      </>
    );
  }

  return null;
}
