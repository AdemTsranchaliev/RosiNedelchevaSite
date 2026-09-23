"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { formatPrice, product } from "@/lib/content";
import { useCart } from "./CartProvider";

export function CartDrawer() {
  const { items, count, isOpen, closeCart, total, setQuantity, removeItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-ink/35"
        aria-label="Затвори количката"
        onClick={closeCart}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-paper shadow-[-24px_0_60px_-36px_rgba(78,69,62,0.45)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-display text-[1.7rem] leading-none tracking-tight">Количка</h2>
            <p className="mt-1 text-[12px] font-light text-mute">
              {count === 0 ? "Няма артикули" : count === 1 ? "1 артикул" : `${count} артикула`}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="grid h-11 w-11 place-items-center text-ink"
            aria-label="Затвори"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-start justify-center">
              <p className="font-display text-3xl tracking-tight">Количката е празна</p>
              <p className="mt-3 max-w-xs text-sm font-light leading-relaxed text-ink-soft">
                Комплектът е една кутия със 100 карти.
              </p>
              <Link
                href="/karti"
                onClick={closeCart}
                className="mt-6 inline-flex h-12 items-center bg-clay px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition hover:bg-ink"
              >
                Към картите
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5 first:pt-0">
                  <div className="relative h-[92px] w-[76px] shrink-0 bg-paper-2">
                    <Image src={item.image} alt="" fill className="object-contain" sizes="76px" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-display text-xl leading-tight tracking-tight">{item.title}</p>
                      <p className="shrink-0 text-sm tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <p className="mt-1 text-[12px] font-light text-mute">{formatPrice(item.price)}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="inline-flex h-10 items-center border border-ink/15">
                        <button
                          type="button"
                          className="grid h-10 w-10 place-items-center text-ink/70"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          aria-label="Намали"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          className="grid h-10 w-10 place-items-center text-ink/70"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          aria-label="Увеличи"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-[11px] uppercase tracking-[0.14em] text-mute underline decoration-ink/20 underline-offset-4"
                        onClick={() => removeItem(item.id)}
                      >
                        Премахни
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line px-5 py-5 sm:px-6">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-[0.18em] text-mute">Междинна сума</span>
              <span className="font-display text-[1.7rem] leading-none">{formatPrice(total)}</span>
            </div>
            <p className="mt-2 text-[12px] font-light leading-relaxed text-ink-soft">{product.priceNote}</p>
            <p className="mt-1 text-[12px] font-light leading-relaxed text-mute">{product.shippingNote}</p>
            <button
              type="button"
              onClick={() => {
                closeCart();
                router.push("/porachka");
              }}
              className="mt-5 flex h-12 w-full items-center justify-center bg-clay text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition hover:bg-ink"
            >
              Към поръчка
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
