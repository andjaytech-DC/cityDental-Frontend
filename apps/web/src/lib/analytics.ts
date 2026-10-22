import { CONSENT_STORAGE_KEY, type ConsentState } from "@/lib/consent-context";

type EventProps = Record<string, string | number | boolean>;

interface AnalyticsWindow extends Window {
  plausible?: (event: string, options?: { props?: EventProps }) => void;
  gtag?: (...args: unknown[]) => void;
}

export function getStoredConsent(): ConsentState {
  if (typeof window === "undefined") return "unknown";
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === "granted" || stored === "denied" ? stored : "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Consent-gated event tracking. Does nothing until the visitor has accepted
 * optional cookies and an analytics provider is actually loaded.
 */
export function trackEvent(name: string, props?: EventProps): void {
  if (typeof window === "undefined") return;
  if (getStoredConsent() !== "granted") return;

  const analyticsWindow = window as AnalyticsWindow;
  if (typeof analyticsWindow.plausible === "function") {
    analyticsWindow.plausible(name, props ? { props } : undefined);
    return;
  }
  if (typeof analyticsWindow.gtag === "function") {
    analyticsWindow.gtag("event", name, props ?? {});
  }
}
