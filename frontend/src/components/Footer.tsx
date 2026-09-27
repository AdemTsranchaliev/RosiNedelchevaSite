import Link from "next/link";
import { Monogram } from "@/components/BrandMark";
import { NewsletterForm } from "@/components/NewsletterForm";
import { footerNav, legalLinks, site, socials } from "@/lib/content";

function LineIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

function PhoneIcon() {
  return (
    <LineIcon>
      <path
        d="M8.2 4.8h2.2l1.2 2.8-1.4 1.2a12.2 12.2 0 0 0 5 5l1.2-1.4 2.8 1.2v2.2c0 .8-.6 1.4-1.4 1.4A13.6 13.6 0 0 1 6.8 6.2c0-.8.6-1.4 1.4-1.4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </LineIcon>
  );
}

function MailIcon() {
  return (
    <LineIcon>
      <rect x="3.5" y="5.5" width="17" height="13" stroke="currentColor" strokeWidth="1.4" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </LineIcon>
  );
}

function SocialIcon({ id }: { id: string }) {
  if (id === "instagram") {
    return (
      <LineIcon>
        <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
      </LineIcon>
    );
  }

  return (
    <LineIcon>
      <path
        d="M14 8.5V7.2A2.2 2.2 0 0 1 16.2 5H18v3h-1.6c-.4 0-.6.2-.6.6V11H18l-.4 3h-2.2v7h-3v-7H10v-3h2.4V8.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </LineIcon>
  );
}

export function Footer() {
  return (
    <footer className="bg-paper">
      <NewsletterForm />
      <div className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 md:grid-cols-12 md:items-start md:gap-x-10 md:px-8 md:py-16">
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3" aria-label={`${site.name} — начало`}>
              <Monogram className="h-11 w-11" />
              <span>
                <span className="block font-display text-xl leading-none tracking-tight text-ink">
                  {site.name}
                </span>
                <span className="mt-1.5 block text-[11px] font-light tracking-wide text-mute">
                  {site.tagline}
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-[17rem] text-sm font-light leading-relaxed text-mute">
              Терапевтични карти за тревожност — за теб и за практиката.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-12 md:contents">
            <nav aria-label="Навигация" className="md:col-span-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Навигация</p>
              <ul className="mt-4 space-y-2.5">
                {footerNav.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] font-light text-ink-soft transition hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="md:col-span-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Контакт</p>
              <a
                href={site.phoneHref}
                className="mt-4 flex items-center gap-2.5 text-[15px] font-light text-ink transition hover:text-accent"
              >
                <span className="text-accent">
                  <PhoneIcon />
                </span>
                {site.phone}
              </a>
              <a
                href={site.emailHref}
                className="mt-2.5 flex items-center gap-2.5 break-words text-[15px] font-light text-ink-soft transition hover:text-ink"
              >
                <span className="text-accent">
                  <MailIcon />
                </span>
                {site.email}
              </a>

              <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Социални</p>
              <ul className="mt-4 space-y-2.5">
                {socials.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 text-[15px] font-light text-ink-soft transition hover:text-ink"
                    >
                      <span className="text-accent">
                        <SocialIcon id={item.id} />
                      </span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p className="text-[11px] text-mute">
            © {new Date().getFullYear()} {site.name}
          </p>
          <nav aria-label="Документи" className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] uppercase tracking-[0.14em] text-mute transition hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
