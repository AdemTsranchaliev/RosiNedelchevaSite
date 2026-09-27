"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdmin } from "@/lib/session";
import { useAuth } from "./AuthProvider";
import { BrandMark } from "./BrandMark";
import { useCart } from "./CartProvider";

const links = [
  { href: "/", label: "Начало" },
  { href: "/karti", label: "Карти" },
  { href: "/za-men", label: "За мен" },
  { href: "/blog", label: "Блог" },
  { href: "/kontakti", label: "Контакти" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group relative whitespace-nowrap py-1 text-[11px] font-medium uppercase tracking-[0.14em] transition xl:text-[12px] xl:tracking-[0.16em] ${
        active ? "text-ink" : "text-mute hover:text-ink"
      }`}
    >
      {label}
      <span
        className={`absolute -bottom-0.5 left-0 h-px bg-accent transition-all duration-300 ${
          active ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { count, openCart } = useCart();
  const { user, ready } = useAuth();
  const accountHref = isAdmin(user) ? "/admin" : "/profil";
  const accountLabel = isAdmin(user) ? "Админ" : "Профил";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={`site-header fixed inset-x-0 top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-md transition-shadow duration-300 ${
        scrolled || open ? "shadow-[0_10px_30px_-24px_rgba(78,69,62,0.7)]" : ""
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 md:h-[4.25rem] md:px-8">
        <BrandMark />

        <nav className="ml-auto hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Основно">
          {links.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(pathname, link.href)}
            />
          ))}
        </nav>

        <div className="ml-auto flex items-center lg:ml-4 lg:border-l lg:border-line lg:pl-2">
          <Link
            href={ready && user ? accountHref : "/vhod"}
            aria-label={ready && user ? accountLabel : "Логин"}
            aria-current={isActive(pathname, ready && user ? accountHref : "/vhod") ? "page" : undefined}
            className={`grid h-11 w-11 place-items-center transition hover:text-accent ${
              isActive(pathname, ready && user ? accountHref : "/vhod") ? "text-accent" : "text-ink"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
              <circle cx="12" cy="8" r="3.15" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M5.6 19.2c.9-3.1 3.3-4.7 6.4-4.7s5.5 1.6 6.4 4.7"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </Link>

          <button
            type="button"
            onClick={openCart}
            className="relative grid h-11 w-11 place-items-center text-ink transition hover:text-accent"
            aria-label={count > 0 ? `Количка, ${count === 1 ? "1 артикул" : `${count} артикула`}` : "Количка"}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
              <path
                d="M6.5 8h11l-1 11h-9l-1-11Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M9 8V7a3 3 0 0 1 6 0v1"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            {count > 0 && (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[10px] text-paper">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Затвори менюто" : "Отвори менюто"}</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              {open ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 8h16M4 16h16"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="site-menu"
          className="animate-fade max-h-[calc(100svh-4.25rem)] overflow-y-auto border-t border-line bg-paper lg:hidden"
        >
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-2" aria-label="Мобилно">
            {links.map(
              (link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 border-b border-line py-3.5 text-[15px] last:border-b-0 ${
                      active ? "font-medium text-ink" : "font-light text-ink-soft"
                    }`}
                  >
                    <span className={`h-px w-4 shrink-0 bg-accent ${active ? "opacity-100" : "opacity-0"}`} />
                    {link.label}
                  </Link>
                );
              },
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
