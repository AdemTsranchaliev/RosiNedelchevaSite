import Image from "next/image";
import Link from "next/link";
import { CardDraw } from "@/components/CardDraw";
import { Faq } from "@/components/Faq";
import { HowToUse } from "@/components/HowToUse";
import { PhoneVideo } from "@/components/PhoneVideo";
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
  { title: "За теб", text: "Да разбереш тревожността и да я управляваш.", color: "#e4d9d0" },
  { title: "За практиката", text: "Въпроси и техники от терапевтичния процес.", color: "#d9d4c6" },
];

const trustPoints = [
  "Картите са от нейната практика",
  "Работи с тревожност, стрес и взаимоотношения",
  "Сесии на живо и онлайн",
];

const fan = [
  { id: 2, className: "top-5 left-1 z-0 w-[40%] -rotate-6" },
  { id: 1, className: "top-0 left-1/2 z-10 w-[42%] -translate-x-1/2" },
  { id: 4, className: "top-6 right-1 z-0 w-[40%] rotate-6" },
];

function CardFan() {
  return (
    <div className="relative mx-auto h-64 w-full max-w-sm sm:h-72" aria-hidden>
      {fan.map((item) => {
        const section = sections.find((entry) => entry.id === item.id);
        const src = section && "sample" in section ? section.sample : undefined;
        if (!src) return null;
        return (
          <div
            key={item.id}
            className={`absolute shadow-[0_22px_40px_-24px_rgba(20,16,12,0.85)] ring-1 ring-paper/30 ${item.className}`}
          >
            <div className="relative aspect-[2/3]">
              <Image src={src} alt="" fill className="object-cover" sizes="180px" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 md:py-16 lg:py-24">
          <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1.12fr)_minmax(17.5rem,22rem)] md:gap-10 lg:gap-16">
            <ProductGallery />
            <ProductBuyPanel showPrice />
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-line pt-8 sm:grid-cols-4 md:mt-12">
            {product.specs.map((spec) => (
              <div key={spec.detail}>
                <dt className="font-display text-3xl leading-none tracking-tight md:text-4xl">{spec.lead}</dt>
                <dd className="mt-2 text-sm font-light text-ink-soft">{spec.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="overflow-hidden bg-card-gold">
        <div className="grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="relative h-[30rem] sm:h-[36rem] md:h-auto md:min-h-[42rem]">
            <Image
              src={siteImages.portrait}
              alt="Росица Неделчева"
              fill
              className="object-cover object-[center_14%]"
              sizes="(max-width: 768px) 100vw, 48vw"
            />
            <figure className="absolute right-4 bottom-5 z-10 w-[9.25rem] -rotate-3 shadow-[0_18px_36px_-20px_rgba(78,69,62,0.65)] ring-[6px] ring-card-gold sm:w-40 md:-right-16 md:bottom-16 md:w-[12.5rem] md:-rotate-2">
              <div className="relative aspect-[3/4] bg-ink">
                <Image
                  src={siteImages.portraitAlt}
                  alt=""
                  fill
                  className="object-cover object-[center_18%]"
                  sizes="200px"
                />
              </div>
            </figure>
          </div>
          <div className="flex flex-col justify-center px-5 py-12 sm:px-10 md:py-16 md:pr-8 md:pl-20 lg:py-20 lg:pr-16 lg:pl-28">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">
              За автора
            </p>
            <div className="relative mt-3 max-w-xl">
              <span
                className="pointer-events-none absolute -top-6 -left-1 font-display text-[4.5rem] leading-none text-ink/15 select-none sm:text-[5.5rem] md:-left-8"
                aria-hidden
              >
                „
              </span>
              <blockquote className="relative pt-6 font-display text-[1.7rem] leading-[1.2] tracking-tight sm:text-[2rem] lg:text-[2.2rem]">
                {about.belief}
              </blockquote>
            </div>
            <ul className="mt-8 grid max-w-sm grid-cols-3 gap-4 border-t border-ink/15 pt-6">
              {["Тяло", "Ум", "Душа"].map((word) => (
                <li key={word} className="font-display text-[1.65rem] leading-none tracking-tight sm:text-3xl">
                  {word}
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-ink-soft">{about.triad}</p>
            <div className="mt-7 flex items-center gap-4">
              <span className="h-px w-8 shrink-0 bg-accent" aria-hidden />
              <div>
                <h2 className="font-display text-2xl leading-none tracking-tight">{site.name}</h2>
                <p className="mt-1.5 text-[13px] font-light tracking-wide text-ink-soft">{site.tagline}</p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-ink-soft">
              {trustPoints.join(". ")}.
            </p>
            <div className="mt-8 grid max-w-lg gap-3 lg:grid-cols-2">
              {forWhom.map((item) => (
                <div key={item.title} className="relative px-5 py-5" style={{ backgroundColor: item.color }}>
                  <div className="pointer-events-none absolute inset-2 rounded-[0.7rem] border border-ink/25" />
                  <div className="relative">
                    <h3 className="font-display text-xl tracking-tight">{item.title}</h3>
                    <p className="mt-1.5 text-sm font-light leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/za-men"
              className="mt-8 inline-flex text-[11px] font-medium uppercase tracking-[0.2em] text-ink underline decoration-accent/60 underline-offset-[6px] transition hover:decoration-ink"
            >
              Повече за мен
            </Link>
          </div>
        </div>
      </section>

      <section id="razdeli" className="scroll-mt-20 bg-paper px-5 py-12 md:px-8 md:py-24">
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

          <div className="mt-8 grid gap-2.5 sm:mt-10 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
            {sections.map((section, index) => {
              const Icon = sectionIcons[index];
              return (
                <Link
                  key={section.id}
                  href="/karti"
                  className="relative flex items-center gap-3.5 px-3.5 py-3.5 transition duration-300 hover:-translate-y-1 sm:aspect-[2/3] sm:flex-col sm:justify-between sm:gap-0 sm:px-4 sm:py-7"
                  style={{ backgroundColor: section.color }}
                  aria-label={`${section.name} — детайл за картите`}
                >
                  <div className="pointer-events-none absolute inset-2 rounded-[0.7rem] border border-ink/30 sm:inset-2.5 sm:rounded-[0.85rem]" />
                  <Icon className="relative h-8 w-8 shrink-0 text-ink sm:h-11 sm:w-11" />
                  <h3 className="relative min-w-0 flex-1 font-display text-[1.15rem] leading-snug tracking-tight sm:flex-none sm:text-center sm:text-[1.15rem]">
                    {section.name}
                  </h3>
                  <p className="relative w-5 shrink-0 text-right font-display text-xl leading-none tabular-nums text-ink/45 sm:w-auto sm:text-[10px] sm:font-medium sm:uppercase sm:tracking-[0.2em]">
                    {section.id}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <PhoneVideo />

      <HowToUse />

      <CardDraw />

      <section className="overflow-hidden bg-clay px-5 py-12 text-paper md:px-8 md:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(17rem,24rem)] md:gap-14">
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
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
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
          <CardFan />
        </div>
      </section>

      <Faq />
    </>
  );
}
