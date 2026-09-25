"use client";

import { useState } from "react";
import { api } from "@/lib/session";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote("");
    try {
      await api("/api/newsletter", { method: "POST", body: JSON.stringify({ email }) });
    } catch {
      setBusy(false);
      setNote("Въведете валиден имейл.");
      return;
    }
    setBusy(false);
    setEmail("");
    setDone(true);
  }

  return (
    <section className="border-t border-line bg-paper-2" aria-labelledby="newsletter-title">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:gap-16">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Бюлетин</p>
          <h2 id="newsletter-title" className="mt-3 max-w-md font-display text-[2rem] leading-[1.08] tracking-tight text-ink md:text-4xl">
            Писма за картите и практиката
          </h2>
          <p className="mt-4 max-w-sm text-sm font-light leading-relaxed text-ink-soft">
            Нови текстове и новости от студиото — рядко, спокойно, без шум.
          </p>
        </div>

        {done ? (
          <div className="border-l border-accent/50 pl-5">
            <p className="font-display text-2xl tracking-tight text-ink">Записани сте.</p>
            <p className="mt-2 text-sm font-light leading-relaxed text-ink-soft">
              Ще пишем само когато има какво да се каже.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="w-full max-w-md lg:max-w-none">
            <label htmlFor="newsletter-email" className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">
              Имейл
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
              <input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@email.com"
                className="h-12 min-w-0 flex-1 border-b border-line bg-transparent text-[15px] text-ink outline-none transition placeholder:text-mute/70 focus:border-accent"
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-12 shrink-0 items-center justify-center bg-clay px-7 text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition hover:bg-ink disabled:opacity-60"
              >
                {busy ? "Запис…" : "Запис"}
              </button>
            </div>
            {note ? (
              <p className="mt-3 text-sm font-light text-ink" role="alert">
                {note}
              </p>
            ) : (
              <p className="mt-3 text-[12px] font-light text-mute">Само за хората, които сами се запишат.</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
