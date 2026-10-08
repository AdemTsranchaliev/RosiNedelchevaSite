import { readTrackingConsent, type TrackingConsent } from "@/lib/consent";

/**
 * Ключовете се слагат в средата (виж frontend/env.example).
 * Празен ключ = инструментът не се зарежда.
 *
 * NEXT_PUBLIC_GTM_ID            GTM-XXXX
 * NEXT_PUBLIC_GA_ID             G-XXXX
 * NEXT_PUBLIC_META_PIXEL_ID     числото на пиксела
 * NEXT_PUBLIC_CLARITY_ID        проектът в Clarity
 * NEXT_PUBLIC_GSC_VERIFICATION  кодът от Google Search Console
 * NEXT_PUBLIC_TAGS_IN_GTM       true, след като GA, Pixel и Clarity са тагове в контейнера
 */

function readId(value: string | undefined, pattern: RegExp) {
  const id = value?.trim() ?? "";
  return pattern.test(id) ? id : "";
}

export const trackingConfig = {
  gtmId: readId(process.env.NEXT_PUBLIC_GTM_ID, /^GTM-[A-Z0-9]+$/),
  gaId: readId(process.env.NEXT_PUBLIC_GA_ID, /^G-[A-Z0-9]+$/),
  pixelId: readId(process.env.NEXT_PUBLIC_META_PIXEL_ID, /^\d{5,20}$/),
  clarityId: readId(process.env.NEXT_PUBLIC_CLARITY_ID, /^[a-z0-9]{4,32}$/i),
  gsc: readId(process.env.NEXT_PUBLIC_GSC_VERIFICATION, /^[A-Za-z0-9_-]{8,200}$/),
  tagsInGtm: process.env.NEXT_PUBLIC_TAGS_IN_GTM === "true",
};

export const consentBootstrap = `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};
window.gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
window.gtag('set', 'ads_data_redaction', true);
window.gtag('set', 'url_passthrough', true);
`;

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: (...args: unknown[]) => void;
    __rnPixel?: unknown[][];
  }
}

export type TrackedItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export function toTrackedItem(item: { id: string; title: string; price: number; quantity: number }): TrackedItem {
  return { id: item.id, name: item.title, price: item.price, quantity: item.quantity };
}

export function updateConsentMode(consent: TrackingConsent) {
  window.dataLayer = window.dataLayer || [];
  const gtag: Gtag =
    window.gtag ??
    function gtag() {
      // gtag.js expects the Arguments object from this exact call.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
  window.gtag = gtag;
  gtag("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  });
}

function allowedConsent() {
  const consent = readTrackingConsent();
  if (!consent?.analytics && !consent?.marketing) return null;
  return consent;
}

function pushEcommerce(
  event: string,
  items: TrackedItem[],
  value: number,
  extra?: { transactionId?: string; eventId?: string; shipping?: number },
) {
  const consent = allowedConsent();
  if (!consent) return null;
  const ecommerce = {
    currency: "EUR",
    value,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    ...(extra?.transactionId ? { transaction_id: extra.transactionId } : {}),
    ...(extra?.shipping !== undefined ? { shipping: extra.shipping } : {}),
  };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event,
    ...(extra?.eventId ? { event_id: extra.eventId } : {}),
    ecommerce,
  });
  if (consent.analytics && !trackingConfig.tagsInGtm && trackingConfig.gaId) {
    window.gtag?.("event", event, ecommerce);
  }
  return consent;
}

export function trackPageView() {
  const consent = allowedConsent();
  if (!consent) return;
  const page = {
    page_path: `${window.location.pathname}${window.location.search}`,
    page_location: window.location.href,
    page_title: document.title,
  };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: "page_view", ...page });
  if (!trackingConfig.tagsInGtm && consent.analytics && trackingConfig.gaId) {
    window.gtag?.("event", "page_view", page);
  }
  if (!trackingConfig.tagsInGtm && consent.marketing && trackingConfig.pixelId) {
    trackPixel("PageView");
  }
}

export function trackViewItem(item: TrackedItem) {
  const consent = pushEcommerce("view_item", [item], item.price);
  if (!consent?.marketing) return;
  trackPixel("ViewContent", {
    content_ids: [item.id],
    content_name: item.name,
    content_type: "product",
    value: item.price,
    currency: "EUR",
  });
}

export function trackAddToCart(item: TrackedItem) {
  const value = item.price * item.quantity;
  const consent = pushEcommerce("add_to_cart", [item], value);
  if (!consent?.marketing) return;
  trackPixel("AddToCart", {
    content_ids: [item.id],
    content_name: item.name,
    content_type: "product",
    contents: [{ id: item.id, quantity: item.quantity }],
    value,
    currency: "EUR",
  });
}

export function trackBeginCheckout(items: TrackedItem[], value: number) {
  const consent = pushEcommerce("begin_checkout", items, value);
  if (!consent?.marketing) return;
  trackPixel("InitiateCheckout", {
    content_ids: items.map((item) => item.id),
    content_type: "product",
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    value,
    currency: "EUR",
  });
}

export function trackPurchase(order: {
  number: string;
  total: number;
  items: TrackedItem[];
  eventId?: string;
  shipping?: number;
}) {
  const key = `rn-purchase-${order.number}`;
  try {
    if (sessionStorage.getItem(key)) return;
  } catch {
    // Keep going; the in-memory page still sends once.
  }
  const consent = pushEcommerce("purchase", order.items, order.total, {
    transactionId: order.number,
    eventId: order.eventId,
    shipping: order.shipping,
  });
  if (!consent) return;
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // The event was sent; a refresh may send it again.
  }
  if (!consent.marketing) return;
  trackPixel(
    "Purchase",
    {
      content_ids: order.items.map((item) => item.id),
      content_type: "product",
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      value: order.total,
      currency: "EUR",
    },
    order.eventId ? { eventID: order.eventId } : undefined,
  );
}

function trackPixel(event: string, params?: Record<string, unknown>, options?: { eventID: string }) {
  if (trackingConfig.tagsInGtm || !trackingConfig.pixelId || !readTrackingConsent()?.marketing) return;
  const args: unknown[] = params ? ["track", event, params] : ["track", event];
  if (options) args.push(options);
  if (window.fbq) {
    window.fbq(...args);
    return;
  }
  window.__rnPixel = window.__rnPixel ?? [];
  window.__rnPixel.push(args);
}

export function newEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `rn-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function marketingAttribution(eventId: string) {
  if (!readTrackingConsent()?.marketing) return null;
  return {
    eventId,
    fbp: readCookie("_fbp"),
    fbc: readFbc(),
    marketingConsent: true,
    sourceUrl: window.location.href,
  };
}

function readCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function readFbc() {
  const existing = readCookie("_fbc");
  if (existing) return existing;
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid || !/^[A-Za-z0-9_-]{1,200}$/.test(fbclid)) return null;
  return `fb.1.${Date.now()}.${fbclid}`;
}
