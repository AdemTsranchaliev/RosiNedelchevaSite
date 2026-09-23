import type { Metadata } from "next";
import Link from "next/link";
import { legalLinks, site } from "@/lib/content";

export function legalMetadata(title: string, description: string): Metadata {
  return { title, description };
}

export function LegalDocument({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  return (
    <div className="bg-paper pt-20">
      <article className="mx-auto max-w-2xl px-5 py-16 md:px-8 md:py-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Документи</p>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-6 text-[15px] font-light leading-relaxed text-ink-soft">{summary}</p>
        <p className="mt-8 text-sm font-light leading-relaxed text-ink-soft">
          Пълният текст се подготвя. Дотогава пиши на{" "}
          <a
            href={site.emailHref}
            className="text-ink underline decoration-accent/60 underline-offset-4"
          >
            {site.email}
          </a>
          .
        </p>
        <nav aria-label="Други документи" className="mt-12 flex flex-wrap gap-x-5 gap-y-2">
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
      </article>
    </div>
  );
}
