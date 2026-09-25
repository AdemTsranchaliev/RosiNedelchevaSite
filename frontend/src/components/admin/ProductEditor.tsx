"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "@/lib/api";
import { demoMode } from "@/lib/demo";
import { mediaSrc } from "@/lib/public-path";
import { api, readToken } from "@/lib/session";

export { mediaSrc };

export type ProductSpec = { lead: string; detail: string };

export type ShopProduct = {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  details: string;
  price: number;
  imageUrl: string | null;
  images: string[];
  videoUrl: string | null;
  highlights: string[];
  specs: ProductSpec[];
  stock: number;
  isActive: boolean;
};

const field = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400";

export function emptyProduct(): ShopProduct {
  return {
    id: 0,
    name: "",
    subtitle: "",
    description: "",
    details: "",
    price: 0,
    imageUrl: null,
    images: [],
    videoUrl: null,
    highlights: [],
    specs: [{ lead: "", detail: "" }],
    stock: 0,
    isActive: true,
  };
}

export function normalizeProduct(product: Partial<ShopProduct> & { id: number; name: string; price: number; stock: number; isActive: boolean }): ShopProduct {
  const images = product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [];
  return {
    ...emptyProduct(),
    ...product,
    subtitle: product.subtitle ?? "",
    description: product.description ?? "",
    details: product.details ?? "",
    images,
    imageUrl: images[0] ?? null,
    videoUrl: product.videoUrl ?? null,
    highlights: product.highlights ?? [],
    specs: product.specs?.length ? product.specs : [{ lead: "", detail: "" }],
  };
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Файлът не се прочете."));
    reader.readAsDataURL(file);
  });
}

export async function uploadMedia(file: File) {
  if (demoMode) {
    return { url: await readFile(file), kind: file.type.startsWith("video/") ? ("video" as const) : ("image" as const) };
  }
  const headers = new Headers();
  const token = readToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_URL}/api/uploads`, { method: "POST", body, headers });
  if (!response.ok) {
    let message = "Файлът не се качи.";
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) message = payload.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await response.json()) as { url: string; kind: "image" | "video" };
}

function snapshot(product: ShopProduct, highlights: string[]) {
  return JSON.stringify({
    name: product.name.trim(),
    subtitle: product.subtitle.trim(),
    description: product.description.trim(),
    details: product.details.trim(),
    price: product.price,
    stock: product.stock,
    isActive: product.isActive,
    images: product.images,
    videoUrl: product.videoUrl,
    highlights: highlights.map((line) => line.trim()).filter(Boolean),
    specs: product.specs.filter((spec) => spec.lead.trim() || spec.detail.trim()),
  });
}

function moveItem<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function ProductEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: ShopProduct;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  const [highlights, setHighlights] = useState(initial.highlights.length ? initial.highlights : [""]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [error, setError] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragFrom = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const baseline = useRef(snapshot(initial, initial.highlights));

  const dirty = useMemo(() => snapshot(draft, highlights) !== baseline.current, [draft, highlights]);
  const cover = draft.images[0];
  const lowStock = draft.stock > 0 && draft.stock < 15;
  const previewHighlights = highlights.map((line) => line.trim()).filter(Boolean).slice(0, 4);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function close() {
    if (dirty && !window.confirm("Има незаписани промени. Да излезете ли?")) return;
    onClose();
  }

  async function addFiles(files: FileList | File[] | null) {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of list) {
        const uploaded = await uploadMedia(file);
        if (uploaded.kind === "video" || file.type.startsWith("video/")) {
          setDraft((current) => ({ ...current, videoUrl: uploaded.url }));
        } else {
          setDraft((current) => ({ ...current, images: [...current.images, uploaded.url] }));
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Качването не успя.");
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    const payload = {
      ...draft,
      highlights: highlights.map((line) => line.trim()).filter(Boolean),
      specs: draft.specs.filter((spec) => spec.lead.trim() || spec.detail.trim()),
      imageUrl: draft.images[0] ?? null,
    };
    try {
      const path = payload.id ? `/api/products/${payload.id}` : "/api/products";
      await api(path, { method: payload.id ? "PUT" : "POST", body: JSON.stringify(payload) });
      baseline.current = snapshot(payload, payload.highlights);
      await onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Продуктът не се записа.");
      setSaving(false);
    }
  }

  function reorder(to: number) {
    const from = dragFrom.current;
    dragFrom.current = null;
    setDragIndex(null);
    setOverIndex(null);
    if (from === null || from === to) return;
    setDraft((current) => ({ ...current, images: moveItem(current.images, from, to) }));
  }

  return (
    <form ref={formRef} onSubmit={save} className="mx-auto max-w-6xl pb-16">
      <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-[#4e453e]/10 bg-[#f6f1e8]/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <button type="button" onClick={close} className="text-sm text-[#1f6f73]">
              ← Всички продукти
            </button>
            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight">
              {draft.id ? draft.name || "Редакция на продукта" : "Нов продукт"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500">{dirty ? "Има незаписани промени" : "Записано"}</p>
            <button type="submit" disabled={saving || !dirty} className="h-10 rounded-lg bg-slate-900 px-4 text-sm text-white disabled:opacity-50">
              {saving ? "Записва се…" : "Запази"}
            </button>
          </div>
        </div>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section
          className={`rounded-xl bg-white p-4 ring-1 transition ${dropping ? "ring-[#1f6f73]" : "ring-slate-200"}`}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes("Files")) return;
            event.preventDefault();
            setDropping(true);
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={(event) => {
            if (!event.dataTransfer.files?.length) return;
            event.preventDefault();
            setDropping(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">Снимки</h2>
              <p className="mt-1 text-xs text-slate-500">
                {draft.images.length === 0 ? "Първата снимка става корица." : `${draft.images.length} ${draft.images.length === 1 ? "снимка" : "снимки"} · първата е корицата`}
                {uploading ? " · качва се…" : ""}
              </p>
            </div>
            <label className="cursor-pointer rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
              Качи снимки
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="sr-only"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          {draft.images.length === 0 ? (
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
              <span className="text-sm text-slate-600">Пуснете снимки тук или изберете файлове</span>
              <span className="mt-1 text-xs text-slate-400">JPG, PNG, WebP</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="sr-only"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {draft.images.map((url, index) => (
                <li
                  key={`${url}-${index}`}
                  draggable
                  onDragStart={() => {
                    dragFrom.current = index;
                    setDragIndex(index);
                  }}
                  onDragOver={(event) => {
                    if (event.dataTransfer.types.includes("Files")) return;
                    event.preventDefault();
                    setOverIndex(index);
                  }}
                  onDrop={(event) => {
                    if (event.dataTransfer.files?.length) return;
                    event.preventDefault();
                    reorder(index);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={`overflow-hidden rounded-xl bg-slate-100 ring-2 transition ${
                    overIndex === index && dragIndex !== index ? "ring-[#1f6f73]" : "ring-transparent"
                  } ${dragIndex === index ? "opacity-50" : ""}`}
                >
                  <div className="relative">
                    <img src={mediaSrc(url)} alt="" draggable={false} className="pointer-events-none aspect-[4/3] w-full object-cover" />
                    {index === 0 ? (
                      <span className="absolute left-2 top-2 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] text-white">Корица</span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-1 bg-white px-2 py-1.5 text-[11px]">
                    <span className="flex gap-2">
                      <button type="button" className="text-slate-500 disabled:opacity-30" disabled={index === 0} onClick={() => setDraft((current) => ({ ...current, images: moveItem(current.images, index, index - 1) }))}>
                        Нагоре
                      </button>
                      <button type="button" className="text-slate-500 disabled:opacity-30" disabled={index === draft.images.length - 1} onClick={() => setDraft((current) => ({ ...current, images: moveItem(current.images, index, index + 1) }))}>
                        Надолу
                      </button>
                    </span>
                    <span className="flex gap-2">
                      {index > 0 ? (
                        <button type="button" className="text-[#1f6f73]" onClick={() => setDraft((current) => ({ ...current, images: moveItem(current.images, index, 0) }))}>
                          Корица
                        </button>
                      ) : null}
                      <button type="button" className="text-rose-700" onClick={() => setDraft((current) => ({ ...current, images: current.images.filter((_, item) => item !== index) }))}>
                        Махни
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium">Видео</h2>
              <label className="cursor-pointer text-sm text-[#1f6f73]">
                {draft.videoUrl ? "Смени видеото" : "Качи видео"}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="sr-only"
                  onChange={(event) => {
                    addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            {draft.videoUrl ? (
              <div className="mt-3">
                <video src={mediaSrc(draft.videoUrl)} controls className="max-h-56 w-full rounded-lg bg-black" />
                <button type="button" className="mt-2 text-xs text-rose-700" onClick={() => setDraft({ ...draft, videoUrl: null })}>
                  Махни видеото
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">По избор. Подходящи са mp4 и webm. Може и да го пуснете върху снимките.</p>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <h2 className="text-sm font-medium">В магазина</h2>
            <label className="mt-4 block text-xs text-slate-500">
              Име
              <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={field} />
            </label>
            <label className="mt-3 block text-xs text-slate-500">
              Подзаглавие
              <input value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} className={field} />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-xs text-slate-500">
                Цена €
                <input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} className={field} />
              </label>
              <label className="block text-xs text-slate-500">
                Наличност
                <input type="number" min="0" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} className={field} />
              </label>
            </div>
            {draft.stock === 0 ? (
              <p className="mt-2 text-xs text-rose-700">Няма наличност. Продуктът пак може да е активен, но бройката е 0.</p>
            ) : lowStock ? (
              <p className="mt-2 text-xs text-amber-700">Малка наличност — под 15 броя.</p>
            ) : null}
            <label className="mt-3 block text-xs text-slate-500">
              Кратко описание
              <textarea rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className={field} />
              <span className="mt-1 block text-right tabular-nums">{draft.description.length} знака</span>
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />
              Активен в магазина
            </label>
          </section>

          <section className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <div className="grid grid-cols-[112px_minmax(0,1fr)]">
              <div className="bg-slate-100">
                {cover ? (
                  <img src={mediaSrc(cover)} alt="" className="h-full min-h-28 w-full object-cover" />
                ) : (
                  <span className="flex h-full min-h-28 items-center justify-center px-2 text-center text-[11px] text-slate-400">Няма корица</span>
                )}
              </div>
              <div className="p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Преглед</p>
                <p className="mt-1 font-medium text-slate-950">{draft.name || "Име на продукта"}</p>
                {draft.subtitle ? <p className="mt-0.5 text-sm text-slate-500">{draft.subtitle}</p> : null}
                <p className="mt-2 text-sm font-medium tabular-nums">{draft.price.toFixed(2).replace(".", ",")} €</p>
                {previewHighlights.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {previewHighlights.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="mt-4 rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="text-sm font-medium">Текст и характеристики</h2>
        <label className="mt-4 block text-xs text-slate-500">
          Текст под снимките
          <textarea rows={5} value={draft.details} onChange={(event) => setDraft({ ...draft, details: event.target.value })} className={`${field} leading-relaxed`} />
        </label>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-medium text-slate-500">Характеристики</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">Едрото число и краткият надпис под него.</p>
          </div>
          <button type="button" className="text-xs text-[#1f6f73]" onClick={() => setDraft({ ...draft, specs: [...draft.specs, { lead: "", detail: "" }] })}>
            Добави
          </button>
        </div>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {draft.specs.map((spec, index) => (
            <li key={index} className="rounded-xl bg-slate-50 px-4 py-3">
              <input
                value={spec.lead}
                placeholder="100"
                aria-label="Число или кратък надпис"
                onChange={(event) => {
                  const specs = draft.specs.map((item, itemIndex) => (itemIndex === index ? { ...item, lead: event.target.value } : item));
                  setDraft({ ...draft, specs });
                }}
                className="w-full bg-transparent text-3xl font-semibold tracking-tight text-slate-950 outline-none"
              />
              <input
                value={spec.detail}
                placeholder="карти"
                aria-label="Пояснение"
                onChange={(event) => {
                  const specs = draft.specs.map((item, itemIndex) => (itemIndex === index ? { ...item, detail: event.target.value } : item));
                  setDraft({ ...draft, specs });
                }}
                className="mt-1 w-full bg-transparent text-sm text-slate-600 outline-none"
              />
              <div className="mt-3 flex gap-3 text-[11px] text-slate-400">
                <button type="button" className="disabled:opacity-30" disabled={index === 0} onClick={() => setDraft({ ...draft, specs: moveItem(draft.specs, index, index - 1) })}>
                  Наляво
                </button>
                <button type="button" className="disabled:opacity-30" disabled={index === draft.specs.length - 1} onClick={() => setDraft({ ...draft, specs: moveItem(draft.specs, index, index + 1) })}>
                  Надясно
                </button>
                <button type="button" className="ml-auto hover:text-rose-700" onClick={() => setDraft({ ...draft, specs: draft.specs.filter((_, itemIndex) => itemIndex !== index) })}>
                  Махни
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between">
          <h3 className="text-xs font-medium text-slate-500">Акценти</h3>
          <button type="button" className="text-xs text-[#1f6f73]" onClick={() => setHighlights((current) => [...current, ""])}>
            Добави акцент
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {highlights.map((line, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-xs tabular-nums text-slate-400">{index + 1}</span>
              <input
                value={line}
                placeholder="Нов акцент"
                onChange={(event) => setHighlights((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
                className="min-w-0 flex-1 rounded-lg border border-transparent bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
              />
              <button type="button" className="text-[11px] text-slate-400 disabled:opacity-30" disabled={index === 0} onClick={() => setHighlights((current) => moveItem(current, index, index - 1))}>
                Горе
              </button>
              <button type="button" className="text-[11px] text-slate-400 hover:text-rose-700" onClick={() => setHighlights((current) => (current.length === 1 ? [""] : current.filter((_, itemIndex) => itemIndex !== index)))}>
                Махни
              </button>
            </li>
          ))}
        </ul>
      </section>
    </form>
  );
}
