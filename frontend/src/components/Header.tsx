"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";
import { useCart } from "./CartProvider";

const links = [
  { href: "/", label: "Карти" },
  { href: "/za-men", label: "За мен" },
  { href: "/blog", label: "Блог" },
  { href: "/kontakti", label: "Контакти" },
];

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { count, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const overHero = isHome && !scrolled && !open;
  const light = overHero;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        overHero
          ? "bg-transparent"
          : "border-b border-line bg-paper/90 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-[4.25rem] md:px-8">
        <BrandMark light={light} />

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[12px] font-medium uppercase tracking-[0.18em] transition ${
                  light
                    ? active
                      ? "text-paper"
                      : "text-paper/65 hover:text-paper"
                    : active
                      ? "text-ink"
                      : "text-mute hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={openCart}
            className={`relative text-[12px] font-medium uppercase tracking-[0.18em] transition ${
              light ? "text-paper/80 hover:text-paper" : "text-mute hover:text-ink"
            }`}
          >
            Количка
            {count > 0 && (
              <span
                className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] ${
                  light ? "bg-paper text-ink" : "bg-ink text-paper"
                }`}
              >
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`md:hidden text-[12px] font-medium uppercase tracking-[0.18em] ${
              light ? "text-paper" : "text-ink"
            }`}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Затвори" : "Меню"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-paper px-5 py-8 md:hidden">
          <nav className="flex flex-col gap-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium uppercase tracking-[0.18em] text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
