"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const fieldClass =
  "mt-2 w-full border border-line bg-paper px-3 py-3 text-[15px] text-ink outline-none transition placeholder:text-mute/70 focus:border-accent";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (password.length < 8) {
      setError("Паролата трябва да е поне 8 знака.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await register(name, email, password);
      router.push("/profil");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Регистрацията не успя.");
      setSending(false);
    }
  }

  return (
    <div className="bg-paper px-5 pb-20 pt-28 md:px-8">
      <div className="mx-auto max-w-md">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Акаунт</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">Регистрация</h1>
        <p className="mt-4 text-[15px] font-light leading-relaxed text-ink-soft">
          С акаунт виждате своите поръчки. Администраторският достъп е отделен и се отваря от същия вход.
        </p>
        <form onSubmit={onSubmit} className="mt-8" noValidate>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Име</span>
            <input name="name" autoComplete="name" required className={fieldClass} />
          </label>
          <label className="mt-5 block">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Имейл</span>
            <input name="email" type="email" autoComplete="email" required className={fieldClass} />
          </label>
          <label className="mt-5 block">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Парола</span>
            <input name="password" type="password" autoComplete="new-password" required minLength={8} className={fieldClass} />
          </label>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-accent">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={sending}
            className="mt-8 inline-flex h-12 items-center bg-clay px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper disabled:opacity-60"
          >
            {sending ? "Създаване..." : "Създай акаунт"}
          </button>
        </form>
        <p className="mt-8 text-sm font-light text-ink-soft">
          Вече имате акаунт?{" "}
          <Link href="/vhod" className="text-ink underline decoration-line underline-offset-4">
            Логин
          </Link>
        </p>
      </div>
    </div>
  );
}
