import type { Metadata } from "next";
import Image from "next/image";
import { site, siteImages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Свържете се с Росица Неделчева — телефон, имейл и запитване за картите или терапия.",
};

export default function ContactPage() {
  return (
    <div className="bg-paper pt-20">
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <div className="relative mb-10 aspect-[4/5] overflow-hidden bg-paper-2 lg:mb-0 lg:aspect-[3/4]">
              <Image
                src={siteImages.portrait}
                alt="Росица Неделчева"
                fill
                priority
                className="object-cover object-[center_18%]"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-mute">
              Контакти
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
              Свържете се
            </h1>
            <p className="mt-6 max-w-md text-[15px] font-light leading-relaxed text-ink-soft">
              За запитвания относно картите, индивидуални сесии или събития.
            </p>

            <div className="mt-10 space-y-7">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-mute">
                  Телефон
                </p>
                <a
                  href={site.phoneHref}
                  className="mt-2 block font-display text-2xl tracking-tight transition hover:text-accent"
                >
                  {site.phone}
                </a>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-mute">
                  Имейл
                </p>
                <a
                  href={site.emailHref}
                  className="mt-2 block font-display text-2xl tracking-tight transition hover:text-accent"
                >
                  {site.email}
                </a>
              </div>
            </div>

            <form className="mt-12 border border-line bg-paper-2/50 p-6 md:p-8">
              <h2 className="font-display text-2xl tracking-tight">Запитване</h2>
              <p className="mt-2 text-sm font-light text-mute">
                Формата е визуална — още не изпраща автоматично.
              </p>
              <div className="mt-8 space-y-5">
                <label className="block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">
                    Име
                  </span>
                  <input
                    type="text"
                    name="name"
                    className="mt-2 w-full border-b border-line bg-transparent py-3 text-sm outline-none transition focus:border-ink"
                    placeholder="Вашето име"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">
                    Имейл
                  </span>
                  <input
                    type="email"
                    name="email"
                    className="mt-2 w-full border-b border-line bg-transparent py-3 text-sm outline-none transition focus:border-ink"
                    placeholder="name@email.com"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">
                    Съобщение
                  </span>
                  <textarea
                    name="message"
                    rows={4}
                    className="mt-2 w-full resize-y border-b border-line bg-transparent py-3 text-sm outline-none transition focus:border-ink"
                    placeholder="Интересувам се от картите..."
                  />
                </label>
                <button
                  type="button"
                  className="mt-2 h-11 bg-ink px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition hover:bg-ink-soft"
                >
                  Изпрати
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
