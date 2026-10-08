"use client";

import { useEffect, useState } from "react";
import { cookieCategories, type CookieCategory } from "@/lib/cookies";
import {
  readTrackingConsent,
  writeTrackingConsent,
  type TrackingConsent,
} from "@/lib/consent";
import { useConsentState } from "@/lib/use-consent";

export function CookiePreferences({ compact = false }: { compact?: boolean }) {
  const choice = useConsentState();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!choice || choice === "pending") return;
    setAnalytics(choice.analytics);
    setMarketing(choice.marketing);
  }, [choice]);

  function save(value: TrackingConsent) {
    const previous = choice && choice !== "pending" ? choice : readTrackingConsent();
    try {
      writeTrackingConsent(value);
    } catch {
      setNote("Браузърът блокира записа. Изборът важи само за тази страница.");
      return;
    }
    setAnalytics(value.analytics);
    setMarketing(value.marketing);
    setNote("Изборът е записан.");
    if (
      previous &&
      (previous.analytics !== value.analytics || previous.marketing !== value.marketing)
    ) {
      window.location.reload();
    }
  }

  const checked = {
    necessary: true,
    analytics,
    marketing,
  };

  return (
    <div>
      {!compact ? (
        <p className="text-[15px] font-light leading-relaxed text-ink-soft">
          Необходимите записи са винаги включени. Аналитичните и рекламните тръгват само ако ги разрешите. Можете да промените избора по всяко време.
        </p>
      ) : (
        <p className="text-sm font-light leading-relaxed text-ink-soft">
          Необходимите са винаги включени. Останалите тръгват само ако ги разрешите.
        </p>
      )}

      <div className={compact ? "mt-3 space-y-3" : "mt-6 space-y-4"}>
        {cookieCategories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            compact={compact}
            checked={checked[category.id]}
            onChange={
              category.id === "analytics"
                ? setAnalytics
                : category.id === "marketing"
                  ? setMarketing
                  : undefined
            }
          />
        ))}
      </div>

      <div className={`grid grid-cols-2 gap-2 ${compact ? "mt-4" : "mt-6"}`}>
        <button
          type="button"
          onClick={() => save({ analytics: false, marketing: false })}
          className="inline-flex h-11 items-center justify-center border border-line px-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition hover:border-ink"
        >
          Само необходимите
        </button>
        <button
          type="button"
          onClick={() => save({ analytics: true, marketing: true })}
          className="inline-flex h-11 items-center justify-center border border-line px-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition hover:border-ink"
        >
          Приеми всички
        </button>
      </div>
      <button
        type="button"
        onClick={() => save({ analytics, marketing })}
        className="mt-2 inline-flex h-11 w-full items-center justify-center bg-clay text-[11px] font-medium uppercase tracking-[0.14em] text-paper transition hover:bg-ink"
      >
        Запази избора
      </button>
      {note ? <p className="mt-3 text-sm font-light text-ink">{note}</p> : null}
    </div>
  );
}

function CategoryCard({
  category,
  compact,
  checked,
  onChange,
}: {
  category: CookieCategory;
  compact: boolean;
  checked: boolean;
  onChange?: (value: boolean) => void;
}) {
  const locked = Boolean(category.locked);

  return (
    <section className="border border-line">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={locked}
        onClick={() => onChange?.(!checked)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left disabled:cursor-default"
      >
        <span>
          <span className="block text-[13px] text-ink">{category.label}</span>
          <span className={`mt-1 block font-light text-mute ${compact ? "text-xs leading-relaxed" : "text-[13px] leading-relaxed"}`}>
            {category.summary}
          </span>
        </span>
        <span className={`relative h-[22px] w-10 shrink-0 rounded-full ${checked ? "bg-clay" : "bg-ink/15"}`} aria-hidden>
          <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-paper ${checked ? "right-0.5" : "left-0.5"}`} />
        </span>
      </button>
      <ul className="divide-y divide-line border-t border-line">
        {category.items.map((item) => (
          <li key={item.name} className={compact ? "px-4 py-3" : "px-4 py-3.5"}>
            <p className="text-[13px] text-ink">{item.name}</p>
            <p className="mt-1 text-xs font-light leading-relaxed text-ink-soft">{item.purpose}</p>
            <p className="mt-1.5 text-[11px] font-light leading-relaxed text-mute">
              {item.who} · {item.duration}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
