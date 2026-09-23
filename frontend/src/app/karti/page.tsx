import type { Metadata } from "next";
import { Faq } from "@/components/Faq";
import { ProductBuyPanel } from "@/components/ProductBuyPanel";
import { ProductGallery } from "@/components/ProductGallery";
import { sectionIcons } from "@/components/Icons";
import {
  audience,
  importantWarnings,
  product,
  sections,
} from "@/lib/content";

export const metadata: Metadata = {
  title: product.title,
  description: product.subtitle,
};

const madeOf = [
  {
    title: "Въпроси",
    text: "За мислите, емоциите, тялото и поведението. Когато ги виждаш по-ясно, можеш да избираш как да реагираш.",
    color: "#e4d9d0",
  },
  {
    title: "Насоки",
    text: "Да разпознаеш какво поддържа тревожността и кои навици носят само кратко облекчение.",
    color: "#e6d9b4",
  },
  {
    title: "Техники",
    text: "За моменти на напрежение и за нови начини да се справяш в ежедневието.",
    color: "#d9d4c6",
  },
];

export default function ProductPage() {
  return (
    <div className="bg-paper pt-16 text-ink md:pt-[4.25rem]">
      <section id="porachai" className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-20">
          <ProductGallery />
          <ProductBuyPanel showPrice canAdd titleLevel="h1" />
        </div>
      </section>

      <section className="border-t border-line" aria-label="Какво съдържа комплектът">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-5 py-10 sm:grid-cols-4 md:px-8 md:py-12">
          {product.specs.map((spec) => (
            <div key={spec.detail}>
              <dt className="font-display text-4xl leading-none tracking-tight md:text-5xl">{spec.lead}</dt>
              <dd className="mt-2 text-sm font-light text-ink-soft">{spec.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-line px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl tracking-tight md:text-5xl">Какво представляват</h2>
          <p className="mt-4 max-w-xl text-[15px] font-light leading-relaxed text-ink-soft">
            Създадени са от практиката на Росица Неделчева. Помагат тревожността да се
            разбира постепенно — с по-малко интензивност и повече вътрешна стабилност.
          </p>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {madeOf.map((item) => (
              <article
                key={item.title}
                className="relative px-6 py-8 sm:px-7 sm:py-10"
                style={{ backgroundColor: item.color }}
              >
                <div className="pointer-events-none absolute inset-3 rounded-[1rem] border border-ink/25" />
                <div className="relative">
                  <h3 className="font-display text-3xl tracking-tight">{item.title}</h3>
                  <p className="mt-4 text-sm font-light leading-relaxed">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-6">
            <h2 className="font-display text-3xl tracking-tight md:text-5xl">Вътре</h2>
            <p className="hidden max-w-xs text-right text-sm font-light leading-relaxed text-ink-soft sm:block">
              100 карти в шест раздела. Взимаш темата, от която имаш нужда.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section, index) => {
              const Icon = sectionIcons[index];
              return (
                <article
                  key={section.id}
                  className="relative px-5 py-6"
                  style={{ backgroundColor: section.color }}
                >
                  <div className="pointer-events-none absolute inset-2.5 rounded-[0.85rem] border border-ink/25" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <Icon className="h-9 w-9 text-ink" />
                      <p className="font-display text-2xl leading-none text-ink/40">{section.id}</p>
                    </div>
                    <h3 className="mt-6 font-display text-[1.45rem] leading-tight tracking-tight">
                      {section.name}
                    </h3>
                    <p className="mt-3 text-sm font-light leading-relaxed">{section.summary}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-card-gold px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:gap-16">
          {audience.map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-3xl tracking-tight md:text-4xl">{item.title}</h2>
              <p className="mt-3 max-w-md text-[15px] font-light leading-relaxed text-ink-soft">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">
              Важно
            </h2>
            <p className="mt-4 max-w-sm text-[15px] font-light leading-relaxed text-ink-soft">
              Тези карти не заместват психотерапия, медицинска консултация или
              психиатрично лечение.
            </p>
          </div>
          <div>
            <p className="text-[15px] font-light leading-relaxed">
              Препоръчително е да потърсиш професионална помощ, ако:
            </p>
            <ul className="mt-4 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
              {importantWarnings.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm font-light leading-snug text-ink-soft"
                >
                  <span className="mt-[0.55em] h-px w-3 shrink-0 bg-ink/30" aria-hidden />
                  {item.replace(/[;.]$/, "")}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-ink/10 pt-4 text-sm font-light leading-relaxed">
              При внезапна силна болка в гърдите, тежък задух, припадък или други
              необичайни физически симптоми             потърси незабавна медицинска помощ.
            </p>
          </div>
        </div>
      </section>

      <Faq />
    </div>
  );
}
