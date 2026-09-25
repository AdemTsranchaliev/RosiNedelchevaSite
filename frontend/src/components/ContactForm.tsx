"use client";

import { useState } from "react";
import { site } from "@/lib/content";
import { api } from "@/lib/session";

const topics = ["Картите", "Сесия", "Събитие", "Друго"] as const;

export function ContactForm() {
  const [topic, setTopic] = useState<(typeof topics)[number]>("Картите");
  const [error, setError] = useState("");
  const [opened, setOpened] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name || !email || !message) {
      setOpened(false);
      setError("Попълнете име, имейл и съобщение.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setOpened(false);
      setError("Въведете валиден имейл.");
      return;
    }

    const form = event.currentTarget;
    api("/api/messages", {
      method: "POST",
      body: JSON.stringify({ name, email, topic, message }),
    })
      .then(() => {
        setError("");
        setOpened(true);
        form.reset();
      })
      .catch(() => {
        const body = [`Име: ${name}`, `Имейл: ${email}`, `Тема: ${topic}`, "", message].join("\n");
        const href = `${site.emailHref}?subject=${encodeURIComponent(`Запитване — ${topic}`)}&body=${encodeURIComponent(body)}`;
        window.location.href = href;
        setError("");
        setOpened(true);
      });
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Пишете ми</p>
      <h2 className="mt-3 font-display text-3xl tracking-tight md:text-4xl">Запитване</h2>
      <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-ink-soft">
        Изберете тема и оставете съобщение. Писмото се отваря във вашата поща, готово за изпращане.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Име</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            className="mt-2 w-full border-b border-line bg-transparent py-3 text-[15px] text-ink outline-none transition placeholder:text-mute/70 focus:border-accent"
            placeholder="Вашето име"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Имейл</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            className="mt-2 w-full border-b border-line bg-transparent py-3 text-[15px] text-ink outline-none transition placeholder:text-mute/70 focus:border-accent"
            placeholder="name@email.com"
          />
        </label>
      </div>

      <fieldset className="mt-7">
        <legend className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Тема</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.map((item) => {
            const active = item === topic;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                onClick={() => setTopic(item)}
                className={`h-10 border px-4 text-[11px] font-medium uppercase tracking-[0.16em] transition ${
                  active
                    ? "border-clay bg-clay text-paper"
                    : "border-line bg-paper text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-7 block">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Съобщение</span>
        <textarea
          name="message"
          rows={5}
          required
          className="mt-2 w-full resize-y border-b border-line bg-transparent py-3 text-[15px] leading-relaxed text-ink outline-none transition placeholder:text-mute/70 focus:border-accent"
          placeholder="Интересувам се от картите..."
        />
      </label>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center bg-clay px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition hover:bg-ink"
        >
          Изпрати
        </button>
        <p className="text-[12px] font-light leading-relaxed text-mute sm:max-w-[16rem] sm:text-right">
          Или директно на{" "}
          <a href={site.emailHref} className="text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
            {site.email}
          </a>
        </p>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-accent">
          {error}
        </p>
      ) : null}
      {opened ? (
        <p role="status" className="mt-4 text-sm font-light leading-relaxed text-ink-soft">
          Съобщението е получено. Ако нещо не мине, пишете на {site.email}.
        </p>
      ) : null}
    </form>
  );
}
