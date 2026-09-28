"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const PAGE_SIZE = 6;

function reviewCountLabel(count: number) {
  return count === 1 ? "1 ревю" : `${count} ревюта`;
}

function formatReviewDate(value: string) {
  return new Date(value).toLocaleDateString("bg-BG", { dateStyle: "long" });
}

export function ProductReviews({ productId = 1 }: { productId?: number }) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [open, setOpen] = useState<{ images: string[]; index: number } | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [photosOnly, setPhotosOnly] = useState(false);
  const [sort, setSort] = useState<"new" | "high">("new");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const scrolledToHash = useRef(false);

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

  const reviews = summary?.reviews ?? [];
  const photoCount = reviews.filter((review) => review.images.length > 0).length;
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }));

  const filtered = useMemo(() => {
    const next = reviews.filter((review) => {
      if (rating !== null && review.rating !== rating) return false;
      if (photosOnly && review.images.length === 0) return false;
      return true;
    });
    return next.sort((a, b) => {
      if (sort === "high" && b.rating !== a.rating) return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reviews, rating, photosOnly, sort]);

  const shown = filtered.slice(0, visible);

  useEffect(() => {
    if (!summary || scrolledToHash.current) return;
    const id = window.location.hash.replace("#", "");
    if (!id.startsWith("revyu-")) return;
    const reviewId = Number(id.slice("revyu-".length));
    const index = filtered.findIndex((review) => review.id === reviewId);
    if (index >= visible) {
      setVisible(index + 1);
      return;
    }
    const node = document.getElementById(id);
    if (!node) return;
    node.scrollIntoView({ block: "start" });
    scrolledToHash.current = true;
  }, [summary, filtered, visible]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      setOpen((current) => {
        if (!current || current.images.length < 2) return current;
        const step = event.key === "ArrowRight" ? 1 : -1;
        return { ...current, index: (current.index + step + current.images.length) % current.images.length };
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!summary) return null;

  const total = reviews.length;
  const average = total === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / total;
  const score = average.toFixed(1).replace(".", ",");
  const remaining = filtered.length - shown.length;
  const openPhotos = (images: string[], index: number) => setOpen({ images, index });

  return (
    <section id="revyuta" className="scroll-mt-24 border-t border-line bg-paper px-5 py-16 text-ink md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">От купувачи</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight md:text-5xl">Ревюта</h2>
          </div>
          {total > 0 ? (
            <div className="flex items-center gap-4">
              <p className="font-display text-6xl leading-none tracking-tight">{score}</p>
              <div>
                <Stars rating={average} className="h-4 w-4" />
                <p className="mt-1.5 text-sm font-light text-ink-soft">{reviewCountLabel(total)}</p>
              </div>
            </div>
          ) : (
            <p className="max-w-xs text-[15px] font-light leading-relaxed text-ink-soft">Все още няма публикувани ревюта.</p>
          )}
        </div>

        {total > 0 ? (
          <>
            <div className="mt-10 flex flex-col gap-6 border-t border-ink/10 pt-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="w-full max-w-sm space-y-1" role="group" aria-label="Филтър по оценка">
                {ratingCounts.map(({ star, count }) => {
                  const active = rating === star;
                  const width = total === 0 ? 0 : (count / total) * 100;
                  return (
                    <button
                      key={star}
                      type="button"
                      aria-pressed={active}
                      disabled={count === 0}
                      onClick={() => {
                        setRating(active ? null : star);
                        setVisible(PAGE_SIZE);
                      }}
                      className={`grid w-full grid-cols-[1rem_1fr_1.75rem] items-center gap-3 py-1 text-left disabled:cursor-default disabled:opacity-40 ${
                        active ? "text-ink" : "text-ink-soft"
                      }`}
                    >
                      <span className="text-sm tabular-nums">{star}</span>
                      <span className="h-px overflow-hidden bg-ink/15">
                        <span className={`block h-full ${active ? "bg-accent" : "bg-ink/70"}`} style={{ width: `${width}%` }} />
                      </span>
                      <span className="text-right text-xs tabular-nums">{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <button
                  type="button"
                  aria-pressed={photosOnly}
                  disabled={photoCount === 0}
                  onClick={() => {
                    setPhotosOnly((value) => !value);
                    setVisible(PAGE_SIZE);
                  }}
                  className={`text-[11px] font-medium uppercase tracking-[0.16em] disabled:cursor-default disabled:opacity-40 ${
                    photosOnly ? "text-ink underline decoration-accent underline-offset-[6px]" : "text-ink-soft"
                  }`}
                >
                  Със снимка · {photoCount}
                </button>
                <div className="flex gap-4" role="group" aria-label="Подредба">
                  {(
                    [
                      ["new", "Най-нови"],
                      ["high", "Най-високи"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={sort === value}
                      onClick={() => {
                        setSort(value);
                        setVisible(PAGE_SIZE);
                      }}
                      className={`text-[11px] font-medium uppercase tracking-[0.16em] ${
                        sort === value ? "text-ink underline decoration-accent/70 underline-offset-[6px]" : "text-ink-soft"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-sm font-light text-ink-soft">
                  {filtered.length === total ? reviewCountLabel(filtered.length) : `${filtered.length} от ${total}`}
                </p>
              </div>
            </div>

            {shown.length > 0 ? (
              <ul className="mt-4 border-t border-ink/10">
                {shown.map((review) => (
                  <li key={review.id}>
                    <ReviewCard review={review} onOpen={openPhotos} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 border-t border-ink/10 py-10 text-[15px] font-light text-ink-soft">Няма ревюта за този избор.</p>
            )}

            {remaining > 0 ? (
              <button
                type="button"
                onClick={() => setVisible((count) => count + PAGE_SIZE)}
                className="w-full border-t border-ink/10 py-6 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft transition hover:text-ink"
              >
                Покажи още · {Math.min(PAGE_SIZE, remaining)}
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      {open ? <ReviewLightbox images={open.images} index={open.index} onIndex={(index) => setOpen({ images: open.images, index })} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}

function ReviewLightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: string[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const several = images.length > 1;
  const step = (delta: number) => onIndex((index + delta + images.length) % images.length);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#2a2420]/88 p-4 sm:p-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Снимка от ревю"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 grid h-10 w-10 place-items-center text-2xl text-paper/80 transition hover:text-paper"
        aria-label="Затвори"
      >
        ×
      </button>
      {several ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            step(-1);
          }}
          className="absolute top-1/2 left-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-ink sm:left-6"
          aria-label="Предишна снимка"
        >
          ‹
        </button>
      ) : null}
      <img
        src={mediaSrc(images[index])}
        alt=""
        onClick={(event) => event.stopPropagation()}
        className="max-h-[82vh] max-w-[min(100%,56rem)] object-contain shadow-[0_30px_80px_-24px_rgba(0,0,0,0.65)]"
      />
      {several ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            step(1);
          }}
          className="absolute top-1/2 right-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-ink sm:right-6"
          aria-label="Следваща снимка"
        >
          ›
        </button>
      ) : null}
      {several ? (
        <p className="absolute bottom-5 text-[11px] font-medium tracking-[0.22em] text-paper/80">
          {index + 1} / {images.length}
        </p>
      ) : null}
    </div>
  );
}

function ReviewCard({
  review,
  onOpen,
}: {
  review: PublicReview;
  onOpen: (images: string[], index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const photos = review.images.length > 0;
  const long = review.body.length > 160;

  return (
    <article id={`revyu-${review.id}`} className="grid scroll-mt-28 gap-4 border-b border-ink/10 py-8 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-12">
      <div>
        <p className="font-display text-2xl leading-none tracking-tight">{review.authorName}</p>
        {review.city ? <p className="mt-2 text-sm font-light text-ink-soft">{review.city}</p> : null}
        <p className="mt-3 text-[11px] font-light tracking-wide text-ink-soft">{formatReviewDate(review.createdAt)}</p>
      </div>
      <div>
        <Stars rating={review.rating} />
        {review.body ? (
          <p className={`mt-3 max-w-2xl text-[15px] font-light leading-relaxed ${expanded || !long ? "" : "line-clamp-3"}`}>{review.body}</p>
        ) : null}
        {long ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-accent"
          >
            {expanded ? "Скрий" : "Прочети"}
          </button>
        ) : null}
        {photos ? <ReviewPhotos images={review.images} onOpen={(index) => onOpen(review.images, index)} /> : null}
      </div>
    </article>
  );
}

function ReviewPhotos({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (index: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {images.map((src, index) => (
        <PhotoFrame
          key={`${src}-${index}`}
          src={src}
          label={images.length === 1 ? "Отвори снимката" : `Отвори снимка ${index + 1}`}
          onOpen={() => onOpen(index)}
        />
      ))}
    </div>
  );
}

function PhotoFrame({
  src,
  label,
  onOpen,
  className = "",
}: {
  src: string;
  label: string;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={`group relative block h-20 w-20 overflow-hidden bg-[#e4d9d0] ${className}`}
    >
      <img
        src={mediaSrc(src)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
    </button>
  );
}
