"use client";

import { useSyncExternalStore } from "react";
import { onConsentChange, readTrackingConsent, type TrackingConsent } from "@/lib/consent";

export type ConsentState = TrackingConsent | null | "pending";

function clientConsent(): ConsentState {
  return readTrackingConsent();
}

function pendingConsent(): ConsentState {
  return "pending";
}

export function useConsentState(): ConsentState {
  return useSyncExternalStore(onConsentChange, clientConsent, pendingConsent);
}
