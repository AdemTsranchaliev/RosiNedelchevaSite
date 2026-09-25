"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { api } from "@/lib/session";

export type ProductReview = {
  id: number;
  productId: number;
  orderId: number;
  orderNumber: string;
  email: string;
  authorName: string;
  city: string;
  rating: number;
  body: string;
  images: string[];
  status: string;
  createdAt: string;
};

const statusLabel: Record<string, string> = {
  pending: "Чака",
  published: "Публикувано",
  hidden: "Скрито",
};

type Filter = "all" | "pending" | "published" | "hidden";

function mediaSrc(url: string) {
  if (url.startsWith("http") || url.startsWith("/images")) return url;
  return `${API_URL}${url}`;
}

function stamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("bg-BG", { dateStyle: "medium", timeStyle: "short" });
}

function stars(rating: number) {
  const filled = Math.max(0, Math.min(5, rating));
  return `${"★".repeat(filled)}${"☆".repeat(5 - filled)}`;
}

export function ReviewsPanel({
  reviews,
  products,
  onChange,
  onOpenOrder,
}: {
  reviews: ProductReview[];
  products: { id: number; name: string }[];
  onChange: () => Promise<void>;
  onOpenOrder: (orderId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const pending = reviews.filter((item) => item.status === "pending").length;
  const published = reviews.filter((item) => item.status === "published").length;
  const needle = query.trim().toLowerCase();
  const visible = reviews.filter((item) => {
    if (filter !== "all" && item.status !== filter) return false;
    if (!needle) return true;
    return `${item.authorName} ${item.city} ${item.email} ${item.orderNumber} ${item.body}`.toLowerCase().includes(needle);
  });

  async function setStatus(id: number, status: string) {
    setBusyId(id);
    setError("");
    try {
      await api(`/api/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Статусът не се смени.");
    } finally {
      setBusyId(null);
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Всички" },
    { id: "pending", label: "Чакат" },
    { id: "published", label: "Публикувани" },
    { id: "hidden", label: "Скрити" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">Ревюта</h1>
      <p className="mt-1 text-sm text-slate-500">
        {pending} {pending === 1 ? "чака" : "чакат"} · {published} {published === 1 ? "публикувано" : "публикувани"} · {reviews.length} общо
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Търсене по име, имейл или поръчка"
          className="h-10 min-w-56 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm"
        />
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`h-10 rounded-lg px-3 text-sm ${filter === item.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-500 ring-1 ring-slate-200">Все още няма ревюта.</p>
      ) : visible.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Няма ревюта за този филтър.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          {visible.map((review) => {
            const busy = busyId === review.id;
            return (
              <li key={review.id} className="flex flex-wrap items-start gap-x-4 gap-y-3 px-4 py-3">
                <div className="min-w-56 flex-1">
                  <p className="font-medium text-slate-950">
                    {review.authorName || "Без име"}
                    {review.city ? <span className="font-normal text-slate-500"> · {review.city}</span> : null}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {products.find((product) => product.id === review.productId)?.name || "Продукт"} · {review.email} · {stamp(review.createdAt)}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="tracking-wide text-amber-500" aria-hidden>{stars(review.rating)}</span>
                    <span className="ml-2 text-slate-700">{review.rating} от 5</span>
                    <span className={`ml-2 rounded-md px-2 py-0.5 text-[11px] ${review.status === "published" ? "bg-teal-50 text-teal-800" : review.status === "pending" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-500"}`}>
                      {statusLabel[review.status] ?? review.status}
                    </span>
                  </p>
                  {review.body ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{review.body}</p> : null}
                  {review.images.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {review.images.map((image) => (
                        <a key={image} href={mediaSrc(image)} target="_blank" rel="noreferrer" className="h-14 w-14 overflow-hidden rounded-lg bg-slate-100">
                          <img src={mediaSrc(image)} alt="" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onOpenOrder(review.orderId)} className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-slate-900 ring-1 ring-slate-300">
                    Поръчка {review.orderNumber || `#${review.orderId}`}
                  </button>
                  {review.status !== "published" ? (
                    <button type="button" disabled={busy} onClick={() => setStatus(review.id, "published")} className="h-10 rounded-lg bg-[#1f6f73] px-4 text-sm font-medium text-white disabled:opacity-50">
                      Публикувай
                    </button>
                  ) : null}
                  {review.status !== "hidden" ? (
                    <button type="button" disabled={busy} onClick={() => setStatus(review.id, "hidden")} className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-slate-800 ring-1 ring-slate-300 disabled:opacity-50">
                      Скрий
                    </button>
                  ) : null}
                  {review.status === "published" ? (
                    <a href={`/karti#revyu-${review.id}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">
                      Виж в продукта
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
