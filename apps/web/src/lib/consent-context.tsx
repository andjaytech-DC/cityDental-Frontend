"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ConsentState = "unknown" | "granted" | "denied";

const STORAGE_KEY = "citydental.consent.v1";

interface ConsentContextValue {
  consent: ConsentState;
  accept: () => void;
  deny: () => void;
  reset: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readStoredConsent(): ConsentState {
  if (typeof window === "undefined") return "unknown";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "granted" || stored === "denied" ? stored : "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Cookie consent state. Optional analytics scripts are only loaded after an
 * explicit "accept"; essential cookies (session) are never blocked.
 */
export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>("unknown");

  useEffect(() => {
    setConsent(readStoredConsent());
  }, []);

  const save = useCallback((state: Exclude<ConsentState, "unknown">) => {
    setConsent(state);
    try {
      window.localStorage.setItem(STORAGE_KEY, state);
    } catch {
      // Storage can be unavailable (private mode); the in-memory state still applies.
    }
  }, []);

  const accept = useCallback(() => save("granted"), [save]);
  const deny = useCallback(() => save("denied"), [save]);
  const reset = useCallback(() => {
    setConsent("unknown");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  const value = useMemo(() => ({ consent, accept, deny, reset }), [consent, accept, deny, reset]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) throw new Error("useConsent must be used inside <ConsentProvider>");
  return context;
}

/** Context-free access for components that may be rendered standalone. */
export function useConsentOptional(): ConsentContextValue | null {
  return useContext(ConsentContext);
}

export { STORAGE_KEY as CONSENT_STORAGE_KEY };
