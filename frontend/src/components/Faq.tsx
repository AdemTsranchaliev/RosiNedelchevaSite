"use client";

import { useState } from "react";
import { faqs } from "@/lib/content";

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="border-t border-line bg-paper px-5 py-12 text-ink md:px-8 md:py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-accent">Въпроси</p>
          <h2 className="mt-4 font-display text-3xl tracking-tight md:text-5xl">Често задавани въпроси</h2>
          <p className="mt-4 max-w-xs text-[15px] font-light leading-relaxed text-ink-soft">
            За комплекта, ползването и доставката.
          </p>
        </div>
        <div>
          {faqs.map((item, index) => {
            const selected = open === index;
            const panelId = `faq-panel-${index}`;
            return (
              <div key={item.q} className="border-t border-ink/10 last:border-b">
                <button
                  type="button"
                  aria-expanded={selected}
                  aria-controls={panelId}
                  onClick={() => setOpen(selected ? null : index)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span
                    className={`font-display text-xl leading-tight tracking-tight transition-colors duration-500 md:text-2xl ${
                      selected ? "text-ink" : "text-ink/80"
                    }`}
                  >
                    {item.q}
                  </span>
                  <span
                    className={`faq-mark relative grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors duration-500 ${
                      selected ? "border-accent text-accent" : "border-ink/15 text-ink/45"
                    }`}
                    aria-hidden
                  >
                    <span className="absolute h-px w-3 bg-current" />
                    <span
                      className={`absolute h-3 w-px bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        selected ? "scale-y-0" : "scale-y-100"
                      }`}
                    />
                  </span>
                </button>
                <div id={panelId} className={`faq-panel ${selected ? "is-open" : ""}`}>
                  <div>
                    <p className="faq-answer max-w-xl pb-6 pr-12 text-[15px] font-light leading-relaxed text-ink-soft">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
