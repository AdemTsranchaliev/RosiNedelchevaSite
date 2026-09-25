"use client";

import { useEffect, useState } from "react";
import { mediaSrc } from "@/lib/public-path";
import { api } from "@/lib/session";

export type PublicReview = {
  id: number;
  authorName: string;
  city: string;
  rating: number;
  body: string;
  images: string[];
  createdAt: string;
};

export type ReviewSummary = {
  productId: number;
  average: number;
  count: number;
  reviews: PublicReview[];
};

export function Stars({ rating, className = "h-4 w-4" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((value) => (
        <svg key={value} viewBox="0 0 20 20" className={`${className} ${value <= Math.round(rating) ? "text-accent" : "text-ink/15"}`}>
          <path
            fill="currentColor"
            d="M10 1.8 12.4 7l5.6.5-4.2 3.7 1.3 5.5L10 14.2 4.9 16.7 6.2 11.2 2 7.5 7.6 7 10 1.8Z"
          />
        </svg>
      ))}
    </span>
  );
}

export function ReviewSummaryLine({ productId = 1 }: { productId?: number }) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    api<ReviewSummary>(`/api/reviews?productId=${productId}`)
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [productId]);

  if (!summary || summary.count === 0) return null;

  return (
    <a href="#revyuta" className="mt-4 inline-flex items-center gap-2 text-sm text-ink-soft">
      <Stars rating={summary.average} />
      <span>
        {summary.average.toFixed(1).replace(".", ",")} · {summary.count} {summary.count === 1 ? "ревю" : "ревюта"}
      </span>
    </a>
  );
}

export function ProductReviews({ productId = 1 }: { productId?: number }) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    api<ReviewSummary>(`/api/reviews?productId=${productId}`)
      .then((next) => {
        setSummary(next);
        if (next.count > 0) {
          const scriptId = "product-review-schema";
          document.getElementById(scriptId)?.remove();
          const script = document.createElement("script");
          script.id = scriptId;
          script.type = "application/ld+json";
          script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Справяне с тревожността",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: next.average,
              reviewCount: next.count,
              bestRating: 5,
              worstRating: 1,
            },
          });
          document.head.appendChild(script);
        }
      })
      .catch(() => setSummary(null));
  }, [productId]);

  useEffect(() => {
    if (!summary?.count) return;
    const id = window.location.hash.replace("#", "");
    if (!id.startsWith("revyu-")) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [summary]);

  if (!summary) return null;

  return (
    <section id="revyuta" className="scroll-mt-24 border-t border-line px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">От купувачи</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl tracking-tight md:text-5xl">Ревюта</h2>
          {summary.count > 0 ? (
            <p className="flex items-center gap-3 text-sm text-ink-soft">
              <Stars rating={summary.average} className="h-5 w-5" />
              <span className="font-display text-3xl leading-none text-ink">{summary.average.toFixed(1).replace(".", ",")}</span>
              <span>{summary.count} {summary.count === 1 ? "ревю" : "ревюта"}</span>
            </p>
          ) : (
            <p className="text-sm font-light text-ink-soft">Все още няма публикувани ревюта.</p>
          )}
        </div>

        {summary.reviews.length > 0 ? (
          <ul className="mt-10 grid gap-8 md:grid-cols-2">
            {summary.reviews.map((review) => (
              <li key={review.id} id={`revyu-${review.id}`} className="scroll-mt-28 border-t border-line pt-6">
                <Stars rating={review.rating} />
                <p className="mt-3 text-sm font-medium">
                  {review.authorName}
                  {review.city ? <span className="font-light text-ink-soft"> · {review.city}</span> : null}
                </p>
                <p className="mt-1 text-xs font-light text-ink-soft">
                  {new Date(review.createdAt).toLocaleDateString("bg-BG", { dateStyle: "long" })}
                </p>
                {review.body ? <p className="mt-3 text-[15px] font-light leading-relaxed text-ink">{review.body}</p> : null}
                {review.images.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {review.images.map((image) => (
                      <button key={image} type="button" onClick={() => setOpen(mediaSrc(image))} className="h-20 w-20 overflow-hidden bg-card-sand">
                        <img src={mediaSrc(image)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {open ? (
        <button type="button" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6" onClick={() => setOpen(null)}>
          <img src={open} alt="" className="max-h-[85vh] max-w-full object-contain" />
        </button>
      ) : null}
    </section>
  );
}
