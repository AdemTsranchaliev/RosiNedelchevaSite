import Image from "next/image";
import { CardDraw } from "@/components/CardDraw";
import {
  ProductBuyPanel,
} from "@/components/ProductBuyPanel";
import { ProductGallery } from "@/components/ProductGallery";
import {
  IconShield,
  IconSpark,
  IconTruck,
  IconUsers,
  sectionIcons,
} from "@/components/Icons";
import {
  audience,
  howToUseTips,
  importantWarnings,
  introduction,
  product,
  sections,
  site,
} from "@/lib/content";

const trust = [
  { icon: IconSpark, title: "6 раздела", text: "Въпроси и техники" },
  { icon: IconUsers, title: "За двама", text: "Хора и терапевти" },
  { icon: IconShield, title: "Създадени от специалист", text: "Психолог / ПТ" },
  { icon: IconTruck, title: "Доставка", text: "1–3 работни дни" },
];

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[100svh] bg-deep text-paper md:grid md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="relative z-10 order-2 flex flex-col justify-center px-5 py-12 md:order-1 md:min-h-[100svh] md:px-10 md:py-24 lg:px-14">
          <p className="animate-rise text-[11px] font-medium uppercase tracking-[0.3em] text-accent-soft">
            Росица Неделчева
          </p>
          <h1 className="animate-rise d1 mt-5 max-w-[14ch] font-display text-[2.75rem] leading-[1.02] tracking-tight md:text-5xl lg:text-[4.1rem]">
            {product.title}
          </h1>
          <p className="animate-rise d2 mt-6 max-w-sm text-[15px] font-light leading-relaxed text-paper/65">
            {product.subtitle}
          </p>
          <div className="animate-rise d3 mt-10 flex flex-wrap items-center gap-5">
            <p className="font-display text-[1.75rem] tracking-tight">
              {product.price.toFixed(2).replace(".", ",")} лв.
            </p>
            <a
              href="#porachai"
              className="inline-flex h-12 items-center bg-paper px-8 text-[11px] font-medium uppercase tracking-[0.22em] text-ink transition duration-300 hover:bg-accent-soft"
            >
              Поръчай
            </a>
            <a
              href="#otvori-karta"
              className="inline-flex h-12 items-center border border-paper/25 px-7 text-[11px] font-medium uppercase tracking-[0.22em] text-paper/80 transition hover:border-paper/50 hover:text-paper"
            >
              Отвори карта
            </a>
          </div>
        </div>

        <div className="relative order-1 min-h-[58vh] md:order-2 md:min-h-[100svh]">
          <Image
            src={product.imageBox}
            alt="Терапевтични карти Справяне с тревожността"
            fill
            priority
            className="animate-reveal object-cover object-center"
            sizes="(max-width: 768px) 100vw, 55vw"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-20 bg-gradient-to-r from-deep to-transparent md:block lg:w-28" />
        </div>
      </section>

      <section className="border-b border-line bg-paper px-5 py-8 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-4 py-2">
              <Icon className="mt-0.5 h-10 w-10 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="mt-0.5 text-sm font-light text-mute">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="porachai" className="scroll-mt-20 bg-paper px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          <ProductGallery />
          <div className="lg:sticky lg:top-28">
            <ProductBuyPanel />
            <ul className="mt-10 space-y-4 border-t border-line pt-8">
              {product.highlights.map((item, i) => {
                const Icon = sectionIcons[i] ?? IconSpark;
                return (
                  <li
                    key={item}
                    className="flex gap-3 text-[14px] font-light leading-relaxed text-ink-soft"
                  >
                    <Icon className="mt-0.5 h-7 w-7 shrink-0 text-accent" />
                    <span>{item}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="relative h-[42vh] min-h-[280px] overflow-hidden md:h-[52vh]">
        <Image
          src={product.imageLifestyle}
          alt="Росица Неделчева"
          fill
          className="object-cover object-[center_28%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-deep/40" />
        <div className="absolute inset-0 flex items-end px-5 pb-10 md:px-8 md:pb-14">
          <p className="mx-auto w-full max-w-6xl font-display text-3xl text-paper md:text-5xl">
            Създадени от практикуващ психолог
          </p>
        </div>
      </section>

      <section className="bg-paper px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="relative aspect-[3/4] overflow-hidden bg-paper-2">
            <Image
              src={product.imageCalm}
              alt="Росица Неделчева"
              fill
              className="object-cover object-[center_18%]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-mute">
              За картите
            </p>
            <h2 className="mt-4 font-display text-3xl leading-[1.1] tracking-tight md:text-[2.75rem]">
              Въпросите от терапевтичния процес — на твоя ритъм
            </h2>
            <div className="mt-8 space-y-5 text-[15px] font-light leading-[1.8] text-ink-soft">
              {introduction.map((p) => (
                <p key={p.slice(0, 28)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-paper-2 px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-mute">
            За кого
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {audience.map((item, i) => {
              const Icon = i === 0 ? IconSpark : IconUsers;
              return (
                <div
                  key={item.title}
                  className="border border-line bg-paper p-7 md:p-9"
                >
                  <Icon className="h-11 w-11 text-accent" />
                  <h3 className="mt-5 font-display text-2xl tracking-tight md:text-[1.75rem]">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-[15px] font-light leading-relaxed text-ink-soft">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-paper px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-md">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-mute">
                Съдържание
              </p>
              <h2 className="mt-4 font-display text-3xl tracking-tight md:text-5xl">
                Шест раздела
              </h2>
            </div>
            <p className="max-w-sm text-sm font-light leading-relaxed text-ink-soft md:text-right">
              Избери темата, от която имаш нужда. Няма правилен или грешен начин.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section, index) => {
              const Icon = sectionIcons[index];
              return (
                <article
                  key={section.id}
                  className="group border border-line bg-paper p-6 transition duration-300 hover:border-accent/40 md:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Icon className="h-12 w-12 text-ink transition group-hover:text-accent" />
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: section.color }}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-6 font-display text-sm text-mute">
                    {String(section.id).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 font-display text-xl leading-snug tracking-tight">
                    {section.name}
                  </h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">
                    {section.summary}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 grid gap-3 border border-line bg-paper-2/70 p-6 sm:grid-cols-2 md:p-8">
            {howToUseTips.map((tip) => (
              <p key={tip.when} className="text-sm font-light text-ink-soft">
                <span className="text-ink">{tip.when}</span>
                <span className="text-mute"> — {tip.use}</span>
              </p>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href="#otvori-karta"
              className="inline-flex h-12 items-center bg-ink px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition hover:bg-ink-soft"
            >
              Опитай — отвори карта
            </a>
          </div>
        </div>
      </section>

      <CardDraw />

      <section className="relative overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="relative min-h-[320px] md:min-h-[420px]">
            <Image
              src={product.imageBox}
              alt="Кутия на картите"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="relative min-h-[320px] md:min-h-[420px]">
            <Image
              src={product.imageCards}
              alt="Преглед на разделите"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-paper px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3">
            <IconShield className="h-8 w-8 text-accent" />
            <h2 className="font-display text-2xl tracking-tight md:text-3xl">Важно</h2>
          </div>
          <p className="mt-4 text-sm font-light leading-relaxed text-ink-soft">
            Картите не заместват психотерапия или медицинска помощ. Потърси
            специалист, ако:
          </p>
          <ul className="mt-6 columns-1 gap-8 sm:columns-2">
            {importantWarnings.map((item) => (
              <li
                key={item}
                className="mb-3 break-inside-avoid text-sm font-light leading-relaxed text-mute"
              >
                — {item.replace(/;$/, "")}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm font-light leading-relaxed text-ink-soft">
            При силна болка в гърдите, тежък задух или припадък — потърси
            незабавна медицинска помощ.
          </p>
        </div>
      </section>

      <section className="bg-deep px-5 py-16 text-paper md:px-8 md:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <h2 className="max-w-md font-display text-3xl tracking-tight md:text-4xl">
            Готови за следващата стъпка?
          </h2>
          <div className="flex flex-wrap gap-3">
            <a
              href="#porachai"
              className="inline-flex h-12 items-center bg-paper px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-ink transition hover:bg-accent-soft"
            >
              Поръчай
            </a>
            <a
              href={site.phoneHref}
              className="inline-flex h-12 items-center border border-paper/20 px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper/75 transition hover:border-paper/50 hover:text-paper"
            >
              {site.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
