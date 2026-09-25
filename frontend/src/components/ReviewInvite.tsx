"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/session";

type Invite = {
  productName: string;
  authorName: string;
  city: string;
  used: boolean;
};

export function ReviewInvite() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [invite, setInvite] = useState<Invite | null>(null);
  const [missing, setMissing] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    api<Invite>(`/api/reviews/invite/${token}`)
      .then((next) => {
        setInvite(next);
        setAuthorName(next.authorName);
        if (next.used) setDone(true);
      })
      .catch(() => setMissing(true));
  }, [token]);

  function addPhotos(list: FileList | null) {
    if (!list) return;
    const next = [...photos, ...Array.from(list)].slice(0, 4);
    setPhotos(next);
    setPreviews(next.map((file) => URL.createObjectURL(file)));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("token", token);
    form.append("rating", String(rating));
    form.append("body", body);
    form.append("authorName", authorName);
    photos.forEach((photo) => form.append("photos", photo));
    try {
      await api("/api/reviews", { method: "POST", body: form });
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ревюто не се изпрати.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-paper px-5 pb-20 pt-28 text-ink md:px-8">
      <div className="mx-auto max-w-xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Ревю</p>
        {missing ? (
          <>
            <h1 className="mt-3 font-display text-4xl tracking-tight">Линкът не е валиден</h1>
            <p className="mt-4 text-[15px] font-light text-ink-soft">Поканата е за хора, които вече са получили комплекта.</p>
          </>
        ) : !invite ? (
          <div className="mt-8 h-40" />
        ) : done ? (
          <>
            <h1 className="mt-3 font-display text-4xl tracking-tight">Благодаря</h1>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-ink-soft">
              Ревюто е прието и ще се появи на страницата на продукта, след като бъде прегледано.
            </p>
            <Link href="/karti" className="mt-8 inline-flex text-[11px] font-medium uppercase tracking-[0.2em] underline decoration-accent/60 underline-offset-[6px]">
              Към картите
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-3 font-display text-4xl tracking-tight">Как ти хареса?</h1>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-ink-soft">{invite.productName}</p>
            <form onSubmit={submit} className="mt-8 space-y-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-mute">Оценка</p>
                <div className="mt-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} от 5`} className={`p-1 ${value <= rating ? "text-accent" : "text-ink/20"}`}>
                      <svg viewBox="0 0 20 20" className="h-7 w-7">
                        <path fill="currentColor" d="M10 1.8 12.4 7l5.6.5-4.2 3.7 1.3 5.5L10 14.2 4.9 16.7 6.2 11.2 2 7.5 7.6 7 10 1.8Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-mute">Име</span>
                <input
                  value={authorName}
                  onChange={(event) => setAuthorName(event.target.value)}
                  maxLength={40}
                  className="mt-2 w-full border border-line bg-paper px-3 py-3 text-[15px] outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-mute">Текст</span>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  maxLength={1200}
                  rows={5}
                  placeholder="Какво ти помогна, за кого би ги препоръчал…"
                  className="mt-2 w-full border border-line bg-paper px-3 py-3 text-[15px] font-light outline-none focus:border-accent"
                />
              </label>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-mute">Снимки</p>
                <label className="mt-2 flex min-h-28 cursor-pointer items-center justify-center border border-dashed border-ink/25 px-4 py-6 text-sm font-light text-ink-soft">
                  До 4 снимки, jpg или png
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => addPhotos(event.target.files)} />
                </label>
                {previews.length > 0 ? (
                  <div className="mt-3 flex gap-2">
                    {previews.map((src) => (
                      <img key={src} src={src} alt="" className="h-20 w-20 object-cover" />
                    ))}
                  </div>
                ) : null}
              </div>
              {error ? <p className="text-sm text-accent">{error}</p> : null}
              <button type="submit" disabled={busy} className="h-12 bg-clay px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper disabled:opacity-60">
                {busy ? "Изпраща се…" : "Изпрати ревю"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
