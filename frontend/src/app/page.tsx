import Image from "next/image";
import Link from "next/link";
import { CardDraw } from "@/components/CardDraw";
import { Faq } from "@/components/Faq";
import { HowToUse } from "@/components/HowToUse";
import { ProductBuyPanel } from "@/components/ProductBuyPanel";
import { ProductGallery } from "@/components/ProductGallery";
import { sectionIcons } from "@/components/Icons";
import { about, product, sections, site, siteImages } from "@/lib/content";

const heroFacts = [
  { lead: "100", text: "карти в 6 раздела" },
  { lead: "За теб", text: "и за практиката" },
  { lead: "Спокойно", text: "без грешен начин" },
];

const forWhom = [
  { title: "За теб", text: "Да разбереш тревожността и да я управляваш." },
  { title: "За практиката", text: "Въпроси и техники от терапевтичния процес." },
];

const trustPoints = [
  "Картите са от нейната практика",
  "Работи с тревожност, стрес и взаимоотношения",
  "Сесии на живо и онлайн",
];

export default function HomePage() {
  return (
    <>
      <section className="bg-card-gold pt-16 text-ink md:pt-[4.25rem]">
        <div className="grid lg:min-h-[calc(100svh-4.25rem)] lg:grid-cols-2">
          <div className="order-2 flex flex-col justify-center px-5 pb-10 pt-1 sm:px-12 sm:py-14 lg:order-1 lg:px-16 lg:py-16 xl:px-20">
            <p className="animate-rise font-display text-[1.65rem] leading-snug tracking-tight sm:text-[2rem]">
              А ако има и депресия?
            </p>
            <p className="animate-rise d1 mt-4 text-[11px] font-medium uppercase tracking-[0.28em] text-accent sm:mt-5 sm:tracking-[0.32em]">
              Терапевтични карти
            </p>
            <h1 className="animate-rise d1 mt-3 font-display text-[2.65rem] leading-[0.98] tracking-tight sm:mt-5 sm:text-6xl lg:text-[3.6rem] xl:text-[4.1rem]">
              {product.title}
            </h1>
            <p className="animate-rise d2 mt-3 max-w-md text-[15px] font-light leading-relaxed text-ink-soft sm:mt-4">
              {product.subtitle}
            </p>
            <p className="animate-rise d2 mt-3 hidden text-sm tracking-wide sm:block">
              {site.name}
              <span className="font-light text-ink-soft"> · {site.tagline}</span>
            </p>
            <p className="animate-rise d2 mt-4 text-[13px] font-light tracking-wide text-ink-soft sm:hidden">
              100 карти в 6 раздела
            </p>
            <ul className="animate-rise d2 mt-6 hidden max-w-md grid-cols-3 gap-x-4 border-t border-ink/15 pt-4 sm:grid">
              {heroFacts.map((fact) => (
                <li key={fact.lead}>
                  <p className="font-display text-2xl leading-none tracking-tight lg:text-[1.7rem]">
                    {fact.lead}
                  </p>
                  <p className="mt-1.5 text-[11px] font-light leading-snug text-ink-soft">{fact.text}</p>
                </li>
              ))}
            </ul>
            <div className="animate-rise d3 mt-6 flex flex-col items-start gap-4 sm:mt-7 sm:flex-row sm:items-center">
              <Link
                href="/karti"
                className="inline-flex h-12 w-full items-center justify-center bg-clay px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition duration-300 hover:bg-ink sm:w-auto"
              >
                Поръчай
              </Link>
              <a
                href="#otvori-karta"
                className="inline-flex items-center text-[11px] font-medium uppercase tracking-[0.2em] text-ink underline decoration-accent/60 underline-offset-[6px] transition hover:decoration-ink sm:h-12 sm:justify-center sm:border sm:border-ink/25 sm:px-8 sm:no-underline sm:decoration-transparent"
              >
                Отвори карта
              </a>
            </div>
          </div>

          <div className="order-1 flex items-center bg-card-gold lg:order-2">
            <div className="relative aspect-[3/2] w-full bg-card-gold">
              <Image
                src={product.imageBox}
                alt="Терапевтични карти Справяне с тревожността"
                fill
                priority
                className="animate-reveal object-cover object-center [-webkit-mask-image:linear-gradient(to_bottom,#000_52%,transparent)] [mask-image:linear-gradient(to_bottom,#000_52%,transparent)] lg:[-webkit-mask-image:none] lg:[mask-image:none]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="porachai" className="scroll-mt-20 border-t border-line bg-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 md:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-20">
          <ProductGallery />
          <ProductBuyPanel />
        </div>
      </section>

      <section className="bg-paper">
        <div className="grid lg:min-h-[640px] lg:grid-cols-2">
          <div className="relative h-72 sm:h-[28rem] lg:h-auto lg:min-h-[640px]">
            <Image
              src={siteImages.portrait}
              alt="Росица Неделчева"
              fill
              className="object-cover object-[center_18%]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-col justify-center bg-card-gold px-5 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">
              За автора
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
              {site.name}
            </h2>
            <p className="mt-3 text-sm font-medium tracking-wide text-ink-soft">
              {site.tagline}
            </p>
            <blockquote className="mt-8 max-w-md font-display text-2xl leading-snug tracking-tight md:text-[1.7rem]">
              {about.belief}
            </blockquote>
            <ul className="mt-8 space-y-2 text-sm font-light text-ink-soft">
              {trustPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {forWhom.map((item) => (
                <div key={item.title}>
                  <h3 className="font-display text-xl tracking-tight">{item.title}</h3>
                  <p className="mt-1 text-sm font-light leading-relaxed text-ink-soft">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/za-men"
              className="mt-10 inline-flex text-[11px] font-medium uppercase tracking-[0.2em] text-ink underline decoration-accent/60 underline-offset-[6px] transition hover:decoration-ink"
            >
              Повече за мен
            </Link>
          </div>
        </div>
      </section>

      <section id="razdeli" className="scroll-mt-20 overflow-hidden bg-paper px-5 py-12 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-6">
            <h2 className="font-display text-3xl tracking-tight md:text-5xl">
              Шест раздела
            </h2>
            <a
              href="#otvori-karta"
              className="hidden shrink-0 text-[11px] font-medium uppercase tracking-[0.2em] text-ink underline decoration-accent/60 underline-offset-[6px] sm:inline-flex"
            >
              Отвори карта
            </a>
          </div>

          <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {sections.map((section, index) => {
              const Icon = sectionIcons[index];
              return (
                <Link
                  key={section.id}
                  href="/karti"
                  className="relative aspect-[2/3] w-[58vw] max-w-[210px] shrink-0 snap-center transition duration-300 hover:-translate-y-1 sm:w-auto sm:max-w-none"
                  style={{ backgroundColor: section.color }}
                  aria-label={`${section.name} — детайл за картите`}
                >
                  <div className="pointer-events-none absolute inset-2.5 rounded-[0.85rem] border border-ink/30" />
                  <div className="relative flex h-full flex-col items-center justify-between px-3 py-6 text-center sm:px-4 sm:py-7">
                    <Icon className="h-10 w-10 text-ink sm:h-11 sm:w-11" />
                    <h3 className="font-display text-[1.05rem] leading-snug tracking-tight sm:text-[1.15rem]">
                      {section.name}
                    </h3>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/45">
                      {section.id}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <HowToUse />

      <CardDraw />

      <section className="bg-clay px-5 py-12 text-paper md:px-8 md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-3xl tracking-tight md:text-4xl">
              {product.title}
            </h2>
            <Link
              href="/karti"
              className="mt-4 inline-flex text-[11px] font-medium uppercase tracking-[0.2em] text-paper/80 underline decoration-paper/30 underline-offset-[6px] transition hover:text-paper hover:decoration-paper"
            >
              Подробно за картите
            </Link>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/karti"
              className="inline-flex h-12 items-center justify-center bg-paper px-8 text-[11px] font-medium uppercase tracking-[0.16em] text-ink transition hover:bg-card-gold sm:tracking-[0.2em]"
            >
              Поръчай
            </Link>
            <a
              href={site.phoneHref}
              className="inline-flex h-12 items-center justify-center border border-paper/40 px-8 text-[11px] font-medium uppercase tracking-[0.16em] text-paper transition hover:border-paper sm:tracking-[0.2em]"
            >
              {site.phone}
            </a>
          </div>
        </div>
      </section>

      <Faq />
    </>
  );
}
