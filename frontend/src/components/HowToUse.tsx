"use client";

import { useState } from "react";
import { sectionIcons } from "@/components/Icons";
import { howToUseTips, sections } from "@/lib/content";

function whenToUse(id: number) {
  return howToUseTips.find((tip) => tip.ids.includes(id))?.when;
}

export function HowToUse() {
  const [activeId, setActiveId] = useState(sections[0].id);
  const index = sections.findIndex((section) => section.id === activeId);
  const active = sections[index];
  const Icon = sectionIcons[index];
  const caution = "caution" in active ? active.caution : undefined;

  function select(id: number) {
    setActiveId(id);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => {
        document.getElementById("razdel-panel")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    }
  }

  return (
    <section className="border-t border-line bg-paper px-5 py-12 text-ink md:px-8 md:py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)] lg:grid-rows-[auto_auto] lg:gap-x-16 lg:gap-y-0 xl:gap-x-20">
        <div>
          <h2 className="font-display text-3xl tracking-tight md:text-5xl">Как се ползват</h2>
          <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-ink-soft">
            Няма правилен или грешен начин. Избери темата, от която имаш нужда сега.
          </p>
        </div>

        <article
          id="razdel-panel"
          role="tabpanel"
          aria-labelledby={`razdel-tab-${active.id}`}
          className="relative px-5 py-8 transition-colors duration-500 sm:px-9 sm:py-11 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          style={{ backgroundColor: active.color }}
        >
          <div className="pointer-events-none absolute inset-3 rounded-[1rem] border border-ink/25" />
          <div key={active.id} className="animate-fade relative">
            <div className="flex items-start justify-between gap-4">
              <Icon className="h-10 w-10 text-ink" />
              <p className="font-display text-3xl leading-none tracking-tight text-ink/45">
                {active.id}
              </p>
            </div>
            <h3 className="mt-6 font-display text-[1.65rem] leading-tight tracking-tight sm:mt-8 sm:text-[1.75rem]">
              {active.name}
            </h3>
            <p className="mt-4 text-[15px] font-light leading-relaxed">{active.guide}</p>
            {caution ? (
              <p className="mt-6 border-t border-ink/15 pt-5 text-sm font-light leading-relaxed">
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-ink/55">
                  Важно
                </span>
                {caution}
              </p>
            ) : null}
          </div>
          <p className="relative mt-8 border-t border-ink/15 pt-4 text-[13px] font-light leading-relaxed text-ink/70">
            Можеш да вървиш подред или да спреш на една карта. След нея си дай малко време —
            отговорът не е задължителен.
          </p>
        </article>

        <div className="lg:col-start-1 lg:row-start-2 lg:mt-10">
          <div className="border-b border-ink/10" role="tablist" aria-label="Раздели">
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
                  className={`flex w-full items-center gap-4 border-t border-ink/10 py-3 text-left transition-colors ${
                    selected ? "text-ink" : "text-ink/55 hover:text-ink"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center border font-display text-lg leading-none transition ${
                      selected ? "border-ink" : "border-ink/15"
                    }`}
                    style={{ backgroundColor: section.color }}
                  >
                    {section.id}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-xl leading-tight tracking-tight md:text-[1.35rem]">
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
        </div>
      </div>
    </section>
  );
}
