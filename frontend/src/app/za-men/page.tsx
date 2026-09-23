import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { about, site, siteImages } from "@/lib/content";

export const metadata: Metadata = {
  title: "За мен",
  description:
    "Росица Неделчева — психолог и психотерапевт. Индивидуални сесии, групова терапия, лекции и ритрийти.",
};

export default function AboutPage() {
  return (
    <div className="bg-paper pt-20">
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <div className="relative aspect-[3/4] overflow-hidden bg-paper-2">
            <Image
              src={siteImages.portrait}
              alt="Росица Неделчева"
              fill
              priority
              className="object-cover object-[center_20%]"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-mute">
              За мен
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              {about.heading}
            </h1>
            <p className="mt-8 text-[15px] font-light leading-[1.75] text-ink-soft md:text-base">
              {about.intro}
            </p>
            <p className="mt-5 text-[15px] font-light leading-[1.75] text-ink-soft md:text-base">
              Сега имам щастието да помагам не само на физическо, но и на психично
              ниво.
            </p>
            <blockquote className="mt-10 border-l border-accent pl-6 font-display text-2xl leading-snug tracking-tight text-ink md:text-3xl">
              {about.belief}
            </blockquote>
            <p className="mt-8 text-[15px] font-light leading-[1.75] text-ink-soft md:text-base">
              {about.triad}
            </p>
          </div>
        </div>
      </section>

      <section className="relative h-[40vh] min-h-[240px] overflow-hidden md:h-[48vh]">
        <Image
          src={siteImages.wide}
          alt=""
          fill
          className="object-cover object-[center_30%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-deep/40" />
      </section>

      <section className="border-y border-line bg-paper-2 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl tracking-tight md:text-4xl">
            Услуги
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {about.services.map((service) => (
              <article
                key={service.title}
                className="border border-line bg-paper p-7 md:p-8"
              >
                <Image
                  src={service.icon}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12"
                />
                <h3 className="mt-5 font-display text-2xl tracking-tight">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">
                  {service.text}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-16 flex flex-wrap gap-x-8 gap-y-3">
            {about.topics.map((topic) => (
              <span
                key={topic}
                className="text-[12px] font-medium uppercase tracking-[0.16em] text-mute"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-3xl tracking-tight">
              Искате да поговорим?
            </h2>
            <p className="mt-3 max-w-md text-sm font-light text-ink-soft">
              Подкрепям хората, избрали пътя към по-дълбокото себепознание.
            </p>
          </div>
          <Link
            href="/kontakti"
            className="inline-flex h-11 items-center bg-ink px-7 text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition hover:bg-ink-soft"
          >
            Контакти
          </Link>
        </div>
      </section>
    </div>
  );
}
