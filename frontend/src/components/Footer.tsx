import Link from "next/link";
import { Monogram } from "@/components/BrandMark";
import { footerNav, legalLinks, site, socials } from "@/lib/content";

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

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,0.75fr))] lg:gap-10 lg:py-16 md:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label={`${site.name} — начало`}>
            <Monogram className="h-12 w-12" />
            <span>
              <span className="block font-display text-lg leading-none tracking-tight text-ink">
                {site.name}
              </span>
              <span className="mt-1 block text-[11px] font-light tracking-wide text-mute">
                {site.tagline}
              </span>
            </span>
          </Link>
          <p className="mt-5 max-w-xs text-sm font-light leading-relaxed text-mute">
            Терапевтични карти за тревожност — за теб и за практиката.
          </p>
        </div>

        <nav aria-label="В футъра">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Навигация</p>
          <ul className="mt-4 space-y-2.5">
            {footerNav.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft transition hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Контакт</p>
          <a href={site.phoneHref} className="mt-4 block text-sm font-light text-ink-soft hover:text-ink">
            {site.phone}
          </a>
          <a href={site.emailHref} className="mt-2 block text-sm font-light text-ink-soft hover:text-ink">
            {site.email}
          </a>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Социални</p>
          <ul className="mt-4 space-y-3">
            {socials.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-sm text-ink-soft transition hover:text-ink"
                >
                  <SocialIcon id={item.id} />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
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
