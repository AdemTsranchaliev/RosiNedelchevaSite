import type { Metadata } from "next";
import Image from "next/image";
import { ContactForm } from "@/components/ContactForm";
import { site, siteImages, socials } from "@/lib/content";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Свържете се с Росица Неделчева — телефон, имейл, Instagram и Facebook, или оставете запитване за картите и терапията.",
};

function SocialIcon({ id }: { id: string }) {
  if (id === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
        <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
      <path
        d="M14 8.5V7.2A2.2 2.2 0 0 1 16.2 5H18v3h-1.6c-.4 0-.6.2-.6.6V11H18l-.4 3h-2.2v7h-3v-7H10v-3h2.4V8.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M8.2 4.8h2.2l1.2 2.8-1.4 1.2a12.2 12.2 0 0 0 5 5l1.2-1.4 2.8 1.2v2.2c0 .8-.6 1.4-1.4 1.4A13.6 13.6 0 0 1 6.8 6.2c0-.8.6-1.4 1.4-1.4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" stroke="currentColor" strokeWidth="1.4" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

const channels = [
  {
    label: "Телефон",
    value: site.phone,
    href: site.phoneHref,
    icon: <PhoneIcon />,
  },
  {
    label: "Имейл",
    value: site.email,
    href: site.emailHref,
    icon: <MailIcon />,
  },
];

export default function ContactPage() {
  return (
    <div className="bg-paper pt-20">
      <section className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-mute">Контакти</p>
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <h1 className="font-display text-4xl leading-[1.02] tracking-tight md:text-6xl">Свържете се</h1>
            <p className="max-w-sm text-[15px] font-light leading-relaxed text-ink-soft">
              За картите, индивидуални сесии или събития. Обадете се, пишете или оставете запитване.
            </p>
          </div>

          <div className="mt-12 overflow-hidden border border-line lg:grid lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
            <aside className="flex flex-col bg-card-gold">
              <div className="relative aspect-[4/3] bg-paper-2 sm:aspect-[3/2]">
                <Image
                  src={siteImages.portrait}
                  alt="Росица Неделчева"
                  fill
                  priority
                  className="object-cover object-[center_18%]"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3a322c] via-[#3a322c]/75 to-transparent px-6 pb-5 pt-24 text-paper md:px-8">
                  <p className="font-display text-3xl tracking-tight">{site.name}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-paper/80">
                    {site.tagline}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col px-6 py-6 md:px-8 md:py-7">
                <ul className="divide-y divide-ink/10 border-y border-ink/10">
                  {channels.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="group flex items-center gap-4 py-4 transition"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-paper text-clay transition group-hover:bg-clay group-hover:text-paper">
                          {item.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-mute">
                            {item.label}
                          </span>
                          <span className="mt-1 block font-display text-xl leading-tight tracking-tight transition group-hover:text-accent md:text-[1.65rem]">
                            {item.value}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-mute">
                    Социални мрежи
                  </p>
                  <ul className="mt-3 grid grid-cols-2 gap-2">
                    {socials.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-12 items-center justify-center gap-2 border border-ink/15 bg-paper/70 text-[12px] font-medium uppercase tracking-[0.14em] text-ink transition hover:border-clay hover:bg-clay hover:text-paper"
                        >
                          <SocialIcon id={item.id} />
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>

            <div className="bg-paper-2/70 px-6 py-8 md:px-10 md:py-10">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
