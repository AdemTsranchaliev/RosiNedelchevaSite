import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { IconHandsHeart, IconLeaf, IconSun } from "@/components/Icons";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductShowcase } from "@/components/ProductShowcase";
import { audience, importantWarnings, product, sections, site, siteImages } from "@/lib/content";

export const metadata: Metadata = {
  title: product.title,
  description: product.subtitle,
};

const madeOf = [
  {
    title: "Въпроси",
    text: "За мислите, емоциите, тялото и поведението. Когато ги виждаш по-ясно, можеш да избираш как да реагираш.",
    color: "#e4d9d0",
    icon: IconLeaf,
  },
  {
    title: "Насоки",
    text: "Да разпознаеш какво поддържа тревожността и кои навици носят само кратко облекчение.",
    color: "#e6d9b4",
    icon: IconSun,
  },
  {
    title: "Техники",
    text: "За моменти на напрежение и за нови начини да се справяш в ежедневието.",
    color: "#d9d4c6",
    icon: IconHandsHeart,
  },
];

export default function ProductPage() {
  return (
    <div className="bg-paper pb-24 text-ink lg:pb-0">
      <ProductShowcase />

      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">Комплектът</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
            Въпроси, насоки и техники — в една кутия.
          </h2>
          <p className="mt-5 max-w-xl text-[15px] font-light leading-relaxed text-ink-soft">
            Създадени са от практиката на Росица Неделчева. Помагат тревожността да се
            разбира постепенно — с по-малко интензивност и повече вътрешна стабилност.
          </p>

          <div className="mt-12 grid items-end gap-4 md:grid-cols-3 md:gap-5">
            {madeOf.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className={`group relative aspect-[3/4] transition duration-500 hover:-translate-y-2 ${
                    index === 1 ? "md:-translate-y-8" : ""
                  }`}
                  style={{ backgroundColor: item.color }}
                >
                  <div className="pointer-events-none absolute inset-3 rounded-[1.15rem] border border-ink/30" />
                  <div className="pointer-events-none absolute inset-5 rounded-[0.85rem] border border-ink/15" />
                  <div className="relative flex h-full flex-col justify-between p-7 sm:p-8">
                    <Icon className="h-12 w-12 text-ink" />
                    <div>
                      <h3 className="font-display text-4xl tracking-tight">{item.title}</h3>
                      <p className="mt-3 text-sm font-light leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <figure className="relative mt-14 aspect-[2/1] overflow-hidden bg-paper-2 md:mt-20">
            <Image
              src={product.imageCards}
              alt="Шестте раздела и примерни карти"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1152px) 92vw, 1100px"
            />
          </figure>
        </div>
      </section>

      <section className="grid overflow-hidden md:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1.22fr)]">
        <div className="relative min-h-[24rem] md:min-h-[36rem]">
          <Image
            src={siteImages.portrait}
            alt={site.name}
            fill
            className="object-cover object-[center_16%]"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        </div>
        <div className="flex flex-col justify-center bg-card-gold px-6 py-14 sm:px-12 md:px-16 md:py-20">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">От практиката</p>
          <h2 className="mt-4 font-display text-4xl leading-none tracking-tight md:text-5xl">{site.name}</h2>
          <p className="mt-3 text-sm font-light tracking-wide text-ink-soft">{site.tagline}</p>
          <p className="mt-6 max-w-lg text-[15px] font-light leading-relaxed text-ink-soft">
            Картите носят въпроси и техники от терапевтичния процес. Полезни са за хора с
            тревожност и за психолози и терапевти, които работят с темата.
          </p>
          <Link
            href="/za-men"
            className="mt-8 inline-flex text-[11px] font-medium uppercase tracking-[0.2em] text-ink underline decoration-accent/60 underline-offset-[6px] transition hover:decoration-ink"
          >
            Повече за мен
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        {audience.map((item, index) => (
          <div
            key={item.title}
            className="relative overflow-hidden px-6 py-16 sm:px-12 md:px-14 md:py-24"
            style={{ backgroundColor: index === 0 ? "#e4d9d0" : "#d9d4c6" }}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">0{index + 1}</p>
            <h2 className="mt-4 max-w-sm font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
              {item.title}
            </h2>
            <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed">{item.text}</p>
            <div className="pointer-events-none absolute -right-8 -bottom-6 hidden w-40 rotate-[8deg] shadow-[0_24px_40px_-24px_rgba(42,36,32,0.55)] md:block">
              <div className="relative aspect-[2/3]">
                <Image
                  src={sections[index === 0 ? 0 : 5].cover}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="180px"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="border-t border-line px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Важно</h2>
            <p className="mt-4 max-w-sm font-display text-3xl leading-tight tracking-tight md:text-4xl">
              Картите не заместват терапия или медицинска помощ.
            </p>
          </div>
          <div>
            <p className="text-[15px] font-light leading-relaxed">
              Препоръчително е да потърсиш професионална помощ, ако:
            </p>
            <ul className="mt-4 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
              {importantWarnings.map((item) => (
                <li key={item} className="flex gap-3 text-sm font-light leading-snug text-ink-soft">
                  <span className="mt-[0.55em] h-px w-3 shrink-0 bg-ink/30" aria-hidden />
                  {item.replace(/[;.]$/, "")}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-ink/10 pt-4 text-sm font-light leading-relaxed">
              При внезапна силна болка в гърдите, тежък задух, припадък или други необичайни
              физически симптоми потърси незабавна медицинска помощ.
            </p>
          </div>
        </div>
      </section>

      <ProductReviews />
      <Faq />
    </div>
  );
}
