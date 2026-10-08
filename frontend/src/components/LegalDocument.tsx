import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/CookieConsent";
import { legalLinks, legalUpdated, seller, site } from "@/lib/content";

export function legalMetadata(title: string, description: string): Metadata {
  return { title, description };
}

export function LegalDocument({
  title,
  summary,
  toc,
  children,
}: {
  title: string;
  summary: string;
  toc?: { href: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="legal-page bg-paper pt-20">
      <article className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Документи</p>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-6 text-[15px] font-light leading-relaxed text-ink-soft">{summary}</p>
        <p className="mt-4 text-[12px] font-light text-mute">Последна актуализация: {legalUpdated}</p>
        {toc ? (
          <nav aria-label="Съдържание" className="mt-8 border border-line px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Съдържание</p>
            <ol className="mt-3 space-y-2">
              {toc.map((item, index) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-[14px] font-light text-ink-soft underline decoration-transparent underline-offset-4 transition hover:text-ink hover:decoration-accent/60"
                  >
                    {index + 1}. {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        {children}
        <nav aria-label="Други документи" className="no-print mt-14 flex flex-wrap gap-x-5 gap-y-3 border-t border-line pt-6">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] uppercase tracking-[0.14em] text-mute transition hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <CookieSettingsButton className="text-[11px] uppercase tracking-[0.14em] text-mute transition hover:text-ink" />
        </nav>
      </article>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-32">
      <h2 className="font-display text-[1.7rem] leading-tight tracking-tight text-ink md:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] font-light leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="relative pl-4 before:absolute before:left-0 before:text-accent before:content-['–']">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function LegalCallout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="border-l border-accent bg-paper-2/70 px-5 py-4 text-ink">
      {title ? <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">{title}</p> : null}
      <div className={`${title ? "mt-2" : ""} space-y-3 text-[15px] font-light leading-relaxed`}>{children}</div>
    </div>
  );
}

const textLink = "text-ink underline decoration-accent/60 underline-offset-4";

export function SellerFacts() {
  const rows: { term: string; value: ReactNode }[] = [
    { term: "Дружество", value: seller.legalName },
    { term: "ЕИК", value: seller.eik },
    { term: "Седалище и адрес", value: seller.address },
    {
      term: "Имейл",
      value: (
        <a href={site.emailHref} className={textLink}>
          {site.email}
        </a>
      ),
    },
    {
      term: "Телефон",
      value: (
        <a href={site.phoneHref} className={textLink}>
          {site.phone}
        </a>
      ),
    },
  ];

  return (
    <dl className="divide-y divide-line border border-line">
      {rows.map((row) => (
        <div key={row.term} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
          <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">{row.term}</dt>
          <dd className="text-[15px] font-light text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  const className = textLink;
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
