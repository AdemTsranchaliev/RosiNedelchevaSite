"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CookiePreferences } from "@/components/CookiePreferences";
import {
  readTrackingConsent,
  writeTrackingConsent,
  type TrackingConsent,
} from "@/lib/consent";
import { useConsentState } from "@/lib/use-consent";

const OPEN_EVENT = "rn-open-cookie-consent";

type View = "choice" | "settings";

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CookieConsent() {
  const pathname = usePathname();
  const choice = useConsentState();
  const [forced, setForced] = useState(false);
  const [view, setView] = useState<View>("choice");
  const admin = pathname.startsWith("/admin");
  const checkout = pathname.replace(/\/$/, "") === "/porachka";
  const open = !admin && (forced || choice === null);

  useEffect(() => {
    const show = () => {
      setView("settings");
      setForced(true);
    };
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  function choose(value: TrackingConsent) {
    const previous = choice !== "pending" ? choice : readTrackingConsent();
    try {
      writeTrackingConsent(value);
    } catch {
      // The choice still closes the card if storage is blocked.
    }
    setForced(false);
    setView("choice");
    if (
      previous &&
      (previous.analytics !== value.analytics || previous.marketing !== value.marketing)
    ) {
      window.location.reload();
    }
  }

  function openSettings() {
    setView("settings");
  }

  function dismiss() {
    if (choice === null) {
      choose({ analytics: false, marketing: false });
      return;
    }
    setForced(false);
    setView("choice");
  }

  if (admin || !open) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-text"
      className={`cookie-card fixed inset-x-0 z-[55] border-t border-line bg-paper shadow-[0_-16px_40px_-28px_rgba(78,69,62,0.5)] sm:inset-x-auto sm:right-6 sm:border sm:shadow-[0_22px_50px_-24px_rgba(78,69,62,0.55)] ${
        view === "settings" ? "sm:w-[34rem]" : "sm:w-[24rem]"
      } ${
        checkout
          ? "bottom-[calc(0.75rem+3rem+max(0.75rem,env(safe-area-inset-bottom,0px))+1px)] sm:bottom-6"
          : "bottom-0 pb-[env(safe-area-inset-bottom,0px)] sm:bottom-6 sm:pb-0"
      }`}
    >
      {view === "choice" ? (
        <div className="px-4 pt-4 pb-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p id="cookie-title" className="pt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
              Бисквитки
            </p>
            <button
              type="button"
              onClick={() => choose({ analytics: false, marketing: false })}
              aria-label="Затвори и остави само необходимите"
              className="-mr-2 -mt-1 grid h-11 w-11 place-items-center text-mute transition hover:text-ink"
            >
              <CloseIcon />
            </button>
          </div>
          <p id="cookie-text" className="mt-2 text-sm font-light leading-relaxed text-ink-soft sm:mt-3">
            Количката и входът работят и без тях. Със съгласие включваме статистика и измерване на реклами във Facebook и Instagram.{" "}
            <Link href="/biskvitki" className="text-ink underline decoration-accent/60 underline-offset-4">
              Политика
            </Link>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5">
            <button
              type="button"
              onClick={() => choose({ analytics: false, marketing: false })}
              className="inline-flex h-11 items-center justify-center border border-line text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition hover:border-ink"
            >
              Отхвърли
            </button>
            <button
              type="button"
              onClick={() => choose({ analytics: true, marketing: true })}
              className="inline-flex h-11 items-center justify-center bg-clay text-[11px] font-medium uppercase tracking-[0.14em] text-paper transition hover:bg-ink"
            >
              Приеми
            </button>
          </div>
          <button
            type="button"
            onClick={openSettings}
            className="mt-1 flex h-11 w-full items-center justify-center text-[11px] uppercase tracking-[0.16em] text-mute transition hover:text-ink sm:mt-3 sm:h-9"
          >
            Настройки
          </button>
        </div>
      ) : (
        <div className="max-h-[min(85dvh,44rem)] overflow-y-auto px-4 pt-4 pb-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setView("choice")}
              className="inline-flex h-11 items-center text-[11px] uppercase tracking-[0.16em] text-mute transition hover:text-ink"
            >
              Назад
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Затвори настройките"
              className="-mr-2 -mt-1 grid h-11 w-11 place-items-center text-mute transition hover:text-ink"
            >
              <CloseIcon />
            </button>
          </div>
          <p id="cookie-title" className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
            Настройки
          </p>
          <div id="cookie-text" className="mt-3">
            <CookiePreferences compact />
          </div>
        </div>
      )}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Настройки за бисквитки
    </button>
  );
}
