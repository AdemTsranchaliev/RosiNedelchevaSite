"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "rn-cookie-consent";
const OPEN_EVENT = "rn-open-cookie-consent";

type CookieChoice = "all" | "essential";
type View = "choice" | "settings";

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CookieConsent() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("choice");
  const admin = pathname.startsWith("/admin");
  const checkout = pathname.replace(/\/$/, "") === "/porachka";

  useEffect(() => {
    if (admin) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== "all" && saved !== "essential") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [admin]);

  useEffect(() => {
    const show = () => {
      setView("choice");
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  function choose(value: CookieChoice) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // The choice still closes the card if storage is blocked.
    }
    setOpen(false);
    setView("choice");
  }

  if (admin || !open) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-text"
      className={`cookie-card fixed inset-x-0 z-[55] border-t border-line bg-paper shadow-[0_-16px_40px_-28px_rgba(78,69,62,0.5)] sm:inset-x-auto sm:right-6 sm:w-[24rem] sm:border sm:shadow-[0_22px_50px_-24px_rgba(78,69,62,0.55)] ${
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
              onClick={() => choose("essential")}
              aria-label="Затвори и остави само необходимите"
              className="-mr-2 -mt-1 grid h-11 w-11 place-items-center text-mute transition hover:text-ink"
            >
              <CloseIcon />
            </button>
          </div>
          <p id="cookie-text" className="mt-2 text-sm font-light leading-relaxed text-ink-soft sm:mt-3">
            Ползваме ги, за да пазим количката и входа. Рекламни бисквитки няма.{" "}
            <Link href="/biskvitki" className="text-ink underline decoration-accent/60 underline-offset-4">
              Политика
            </Link>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5">
            <button
              type="button"
              onClick={() => choose("essential")}
              className="inline-flex h-11 items-center justify-center border border-line text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition hover:border-ink"
            >
              Отхвърли
            </button>
            <button
              type="button"
              onClick={() => choose("all")}
              className="inline-flex h-11 items-center justify-center bg-clay text-[11px] font-medium uppercase tracking-[0.14em] text-paper transition hover:bg-ink"
            >
              Приеми
            </button>
          </div>
          <button
            type="button"
            onClick={() => setView("settings")}
            className="mt-1 flex h-11 w-full items-center justify-center text-[11px] uppercase tracking-[0.16em] text-mute transition hover:text-ink sm:mt-3 sm:h-9"
          >
            Настройки
          </button>
        </div>
      ) : (
        <div className="px-4 pt-4 pb-4 sm:p-5">
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
              onClick={() => choose("essential")}
              aria-label="Затвори и остави само необходимите"
              className="-mr-2 -mt-1 grid h-11 w-11 place-items-center text-mute transition hover:text-ink"
            >
              <CloseIcon />
            </button>
          </div>
          <p id="cookie-title" className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
            Настройки
          </p>
          <p id="cookie-text" className="mt-3 text-sm font-light leading-relaxed text-ink-soft">
            Само необходимите бисквитки са включени. Аналитични и рекламни не се използват.
          </p>
          <div className="mt-4 flex items-center justify-between gap-4 border border-line px-3.5 py-3">
            <div>
              <p className="text-[13px] text-ink">Необходими</p>
              <p className="mt-0.5 text-xs font-light text-mute">Количка и вход</p>
            </div>
            <span className="relative h-[22px] w-10 shrink-0 rounded-full bg-clay" aria-hidden>
              <span className="absolute top-0.5 right-0.5 h-[18px] w-[18px] rounded-full bg-paper" />
            </span>
            <span className="sr-only">Винаги включени</span>
          </div>
          <button
            type="button"
            onClick={() => choose("essential")}
            className="mt-4 inline-flex h-11 w-full items-center justify-center bg-clay text-[11px] font-medium uppercase tracking-[0.14em] text-paper transition hover:bg-ink"
          >
            Запази
          </button>
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
