"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";

function formatPrice(value: number) {
  return `${value.toFixed(2).replace(".", ",")} лв.`;
}

export function CartDrawer() {
  const { items, isOpen, closeCart, total, setQuantity, removeItem, clear } =
    useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Затвори"
        onClick={closeCart}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-display text-2xl tracking-tight">Количка</h2>
          <button
            type="button"
            onClick={closeCart}
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-mute"
          >
            Затвори
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <p className="text-sm font-light text-mute">Количката е празна.</p>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-paper-2">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-lg leading-snug">{item.title}</p>
                    <p className="mt-1 text-sm text-mute">{formatPrice(item.price)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="inline-flex items-center border border-line">
                        <button
                          type="button"
                          className="px-3 py-1.5 text-sm"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          className="px-3 py-1.5 text-sm"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-[11px] uppercase tracking-[0.14em] text-mute"
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

        <div className="border-t border-line px-6 py-6">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-[0.18em] text-mute">
              Общо
            </span>
            <span className="font-display text-2xl">{formatPrice(total)}</span>
          </div>
          <Link
            href="/kontakti"
            onClick={closeCart}
            className="mt-5 flex h-12 w-full items-center justify-center bg-ink text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition hover:bg-ink-soft"
          >
            Към поръчка
          </Link>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="mt-3 w-full text-center text-[11px] uppercase tracking-[0.14em] text-mute"
            >
              Изчисти
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
