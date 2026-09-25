"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/session";

const fieldClass =
  "mt-2 w-full border border-line bg-paper px-3 py-3 text-[15px] text-ink outline-none transition placeholder:text-mute/70 focus:border-accent";

export default function LoginPage() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(isAdmin(user) ? "/admin" : "/profil");
  }, [ready, user, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    setSending(true);
    setError("");
    try {
      const next = await login(email, password);
      router.push(isAdmin(next) ? "/admin" : "/profil");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Входът не успя.");
      setSending(false);
    }
  }

  return (
    <div className="bg-paper px-5 pb-20 pt-28 md:px-8">
      <div className="mx-auto max-w-md">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Акаунт</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">Логин</h1>
        <p className="mt-4 text-[15px] font-light leading-relaxed text-ink-soft">
          Същият вход е за клиенти и за администратора. След него се отваря съответният раздел.
        </p>
        <form onSubmit={onSubmit} className="mt-8" noValidate>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Имейл</span>
            <input name="email" type="email" autoComplete="email" required className={fieldClass} />
          </label>
          <label className="mt-5 block">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Парола</span>
            <input name="password" type="password" autoComplete="current-password" required className={fieldClass} />
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
            {sending ? "Влизане..." : "Влез"}
          </button>
        </form>
        <p className="mt-8 text-sm font-light text-ink-soft">
          Нямате акаунт?{" "}
          <Link href="/registracia" className="text-ink underline decoration-line underline-offset-4">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  );
}
