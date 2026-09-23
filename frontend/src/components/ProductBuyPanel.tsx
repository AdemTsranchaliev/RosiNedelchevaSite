"use client";

import { useState } from "react";
import { product } from "@/lib/content";
import { useCart } from "./CartProvider";

function formatPrice(value: number) {
  return `${value.toFixed(2).replace(".", ",")} лв.`;
}

export function ProductBuyPanel() {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  return (
    <div className="max-w-md">
      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-mute">
        Терапевтични карти
      </p>
      <h2 className="mt-3 font-display text-[2.1rem] leading-[1.1] tracking-tight text-ink md:text-4xl">
        {product.title}
      </h2>
      <p className="mt-4 text-[15px] font-light leading-relaxed text-ink-soft">
        {product.subtitle}
      </p>

      <p className="mt-8 font-display text-[2rem] tracking-tight text-ink">
        {formatPrice(product.price)}
      </p>

      <div className="mt-7 flex items-stretch gap-3">
        <div className="flex items-center border border-line">
          <button
            type="button"
            className="h-12 w-11 text-lg text-mute transition hover:text-ink"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Намали"
          >
            −
          </button>
          <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
          <button
            type="button"
            className="h-12 w-11 text-lg text-mute transition hover:text-ink"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Увеличи"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => addItem(quantity)}
          className="h-12 flex-1 bg-clay text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition duration-300 hover:bg-ink"
        >
          Добави в количката
        </button>
      </div>

      <p className="mt-4 text-xs font-light leading-relaxed text-mute">
        {product.shippingNote}
      </p>
    </div>
  );
}
