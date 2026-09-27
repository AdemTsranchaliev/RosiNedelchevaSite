"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { site, siteImages } from "@/lib/content";
import { isAdmin } from "@/lib/session";

const fieldClass =
  "h-[3.25rem] w-full bg-paper-2 px-4 text-[15px] text-ink outline-none ring-1 ring-transparent transition placeholder:text-mute/60 focus:bg-paper focus:ring-accent";

export default function LoginPage() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="bg-paper pt-[4.25rem] md:grid md:min-h-[calc(100svh-4.25rem)] md:grid-cols-2 md:pt-[4.25rem]">
      <aside className="relative h-64 md:h-auto md:min-h-[calc(100svh-4.25rem)]">
        <Image
          src={siteImages.portrait}
          alt=""
          fill
          priority
          className="object-cover object-[center_18%]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#241e1a] via-[#241e1a]/15 to-[#241e1a]/10" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-6 text-paper md:px-10 md:pb-12 lg:px-14">
          <p className="font-display text-3xl tracking-tight md:text-5xl">{site.name}</p>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.22em] text-paper/75">{site.tagline}</p>
        </div>
      </aside>

      <div className="flex items-center px-5 py-10 sm:px-8 md:px-10 lg:px-16">
        <div className="w-full max-w-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Акаунт</p>
          <h1 className="mt-3 font-display text-4xl tracking-tight md:text-5xl">Влезте</h1>
          <p className="mt-3 text-[15px] font-light leading-relaxed text-ink-soft">
            Поръчките и профилът се отварят оттук.
          </p>

          <form onSubmit={onSubmit} className="mt-8" noValidate>
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Имейл</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@email.com"
                className={`mt-2 ${fieldClass}`}
              />
            </label>
            <div className="mt-5">
              <label htmlFor="login-password" className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">
                Парола
              </label>
              <span className="relative mt-2 block">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className={`${fieldClass} pr-20`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 text-[11px] font-medium uppercase tracking-[0.14em] text-mute transition hover:text-ink"
                >
                  {showPassword ? "Скрий" : "Покажи"}
                </button>
              </span>
            </div>
            {error ? (
              <p role="alert" className="mt-4 text-sm font-light text-ink">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={sending}
              className="mt-6 inline-flex h-[3.25rem] w-full items-center justify-center bg-clay text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition hover:bg-ink disabled:opacity-60"
            >
              {sending ? "Влизане…" : "Влез"}
            </button>
          </form>

          <p className="mt-6 text-sm font-light text-ink-soft">
            Нямате акаунт?{" "}
            <Link
              href="/registracia"
              className="text-ink underline decoration-accent/60 underline-offset-[6px] transition hover:decoration-ink"
            >
              Регистрация
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
