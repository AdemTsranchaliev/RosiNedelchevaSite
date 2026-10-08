export const CONSENT_STORAGE_KEY = "rn-cookie-consent-v2";
export const CONSENT_EVENT = "rn-consent-change";

export type TrackingConsent = {
  analytics: boolean;
  marketing: boolean;
};

let consentCacheRaw: string | null = null;
let consentCache: TrackingConsent | null = null;

function parseConsent(saved: string | null): TrackingConsent | null {
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as Partial<TrackingConsent>;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") return null;
    return { analytics: parsed.analytics, marketing: parsed.marketing };
  } catch {
    return null;
  }
}

export function readTrackingConsent(): TrackingConsent | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (saved === consentCacheRaw) return consentCache;
  consentCacheRaw = saved;
  consentCache = parseConsent(saved);
  return consentCache;
}

export function writeTrackingConsent(value: TrackingConsent) {
  const raw = JSON.stringify(value);
  localStorage.setItem(CONSENT_STORAGE_KEY, raw);
  consentCacheRaw = raw;
  consentCache = value;
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function onConsentChange(listener: () => void) {
  window.addEventListener(CONSENT_EVENT, listener);
  return () => window.removeEventListener(CONSENT_EVENT, listener);
}
