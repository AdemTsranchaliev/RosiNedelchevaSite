"use client";

import Image from "next/image";
import { useState } from "react";
import { sectionIcons } from "@/components/Icons";
import { howToUseTips, sections } from "@/lib/content";

function whenToUse(id: number) {
  return howToUseTips.find((tip) => tip.ids.includes(id))?.when;
}

function pad(id: number) {
  return String(id).padStart(2, "0");
}

export function HowToUse() {
  const [activeId, setActiveId] = useState(sections[0].id);
  const index = sections.findIndex((section) => section.id === activeId);
  const active = sections[index];
  const Icon = sectionIcons[index];
  const caution = "caution" in active ? active.caution : undefined;
  const when = whenToUse(active.id);
  const cardImage = "sample" in active && active.sample ? active.sample : active.cover;

  function select(id: number) {
    setActiveId(id);
    if (window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => {
        document.getElementById("razdel-panel")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    }
  }

  return (
    <section id="kak-se-polzvat" className="border-t border-line bg-paper px-5 py-12 text-ink md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl tracking-tight md:text-5xl">Как се ползват</h2>
          <p className="mt-4 text-[15px] font-light leading-relaxed text-ink-soft">
            Няма правилен или грешен начин. Избери темата, от която имаш нужда сега.
          </p>
          <p className="mt-2 text-sm font-light leading-relaxed text-ink-soft">
            Можеш да вървиш подред или да спреш на една карта. След нея си дай малко време —
            отговорът не е задължителен.
          </p>
        </div>

        <div className="mt-8 grid items-start gap-6 md:mt-12 md:grid-cols-[minmax(16.5rem,22rem)_minmax(0,1fr)] md:items-stretch md:gap-x-10 lg:gap-x-14">
          <div role="tablist" aria-label="Раздели" className="grid gap-1">
            {sections.map((section) => {
              const selected = section.id === activeId;
              return (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  id={`razdel-tab-${section.id}`}
                  aria-selected={selected}
                  aria-controls="razdel-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(section.id)}
                  onKeyDown={(event) => {
                    const delta =
                      event.key === "ArrowDown" || event.key === "ArrowRight"
                        ? 1
                        : event.key === "ArrowUp" || event.key === "ArrowLeft"
                          ? -1
                          : 0;
                    if (!delta) return;
                    event.preventDefault();
                    const next = sections[(index + delta + sections.length) % sections.length];
                    select(next.id);
                    requestAnimationFrame(() => {
                      document.getElementById(`razdel-tab-${next.id}`)?.focus();
                    });
                  }}
                  className={`flex w-full items-center gap-3.5 rounded-md px-3 py-3 text-left transition-colors ${
                    selected ? "text-ink" : "text-ink/55 hover:bg-ink/[0.04] hover:text-ink"
                  }`}
                  style={selected ? { backgroundColor: section.color } : undefined}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center font-sans text-[12px] font-medium tabular-nums leading-none ${
                      selected ? "bg-paper/70 text-ink" : "text-ink/75"
                    }`}
                    style={selected ? undefined : { backgroundColor: section.color }}
                  >
                    {pad(section.id)}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[1.2rem] leading-tight tracking-tight">
                      {section.name}
                    </span>
                    <span
                      className={`mt-0.5 block text-[12px] font-light leading-snug ${
                        selected ? "text-ink/70" : "text-ink/45"
                      }`}
                    >
                      {whenToUse(section.id)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <article
            id="razdel-panel"
            role="tabpanel"
            aria-labelledby={`razdel-tab-${active.id}`}
            className="relative px-6 py-8 transition-colors duration-500 sm:px-10 sm:py-11 md:h-full"
            style={{ backgroundColor: active.color }}
          >
            <div className="pointer-events-none absolute inset-3 rounded-[1rem] border border-ink/20" />
            <div key={active.id} className="animate-fade relative grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_10.5rem] lg:items-center">
              <div className="order-2 min-w-0 lg:order-1">
                <div className="flex items-center justify-between gap-4">
                  <Icon className="h-10 w-10 text-ink" />
                  <p className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-ink/55">
                    Раздел {pad(active.id)}
                  </p>
                </div>
                {when ? (
                  <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.2em] text-ink/55">
                    {when}
                  </p>
                ) : null}
                <h3 className="mt-2 max-w-lg font-display text-[1.85rem] leading-[1.12] tracking-tight sm:text-[2.15rem]">
                  {active.name}
                </h3>
                <p className="mt-4 max-w-xl text-[15px] font-light leading-relaxed">{active.guide}</p>
                {caution ? (
                  <p className="mt-8 max-w-xl border-t border-ink/15 pt-5 text-sm font-light leading-relaxed">
                    <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-ink/55">
                      Важно
                    </span>
                    {caution}
                  </p>
                ) : null}
              </div>
              <figure className="relative order-1 mx-auto aspect-[2/3] w-40 shadow-[0_18px_36px_-22px_rgba(78,69,62,0.75)] ring-1 ring-ink/10 lg:order-2 lg:w-full lg:rotate-1">
                <Image
                  src={cardImage}
                  alt={`Карта от раздел ${active.name}`}
                  fill
                  className="object-cover"
                  sizes="180px"
                />
              </figure>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
