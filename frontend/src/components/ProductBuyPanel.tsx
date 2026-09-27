"use client";

import Link from "next/link";
import { useState } from "react";
import { IconFlower, IconHandsHeart, IconLeaf, IconSun, IconTruck } from "@/components/Icons";
import { ReviewSummaryLine } from "@/components/ProductReviews";
import { formatPrice, product } from "@/lib/content";
import { useCart } from "./CartProvider";

const points = [
  { icon: IconSun, text: product.highlights[0] },
  { icon: IconLeaf, text: product.highlights[1] },
  { icon: IconFlower, text: product.highlights[2] },
  { icon: IconHandsHeart, text: product.highlights[3] },
];

export function ProductBuyPanel({
  showPrice = false,
  titleLevel = "h2",
  canAdd = false,
}: {
  showPrice?: boolean;
  titleLevel?: "h1" | "h2";
  canAdd?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const Title = titleLevel;

  return (
    <div className={canAdd ? "max-w-md" : "w-full"}>
      <p className={`text-[11px] font-medium uppercase tracking-[0.24em] ${canAdd ? "text-mute" : "text-accent"}`}>
        {canAdd ? "Поръчка" : "Комплектът"}
      </p>
      <Title
        className={`mt-3 font-display leading-[1.05] tracking-tight text-ink ${
          canAdd ? "text-3xl sm:text-4xl" : "text-[2rem] sm:text-[2.35rem]"
        }`}
      >
        {product.title}
      </Title>
      {canAdd ? null : (
        <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">{product.subtitle}</p>
      )}
      {showPrice ? (
        <div className={canAdd ? "mt-5" : "mt-6"}>
          <p className="font-display text-[2.75rem] leading-none tracking-tight">{formatPrice(product.price)}</p>
          <p className="mt-2 text-[11px] font-light tracking-wide text-ink-soft">{product.priceNote}</p>
          {canAdd ? <ReviewSummaryLine /> : null}
        </div>
      ) : null}
      {canAdd ? (
        <ul className="mt-7 space-y-4">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <Icon className="h-11 w-11 shrink-0 text-ink" />
              <span className="text-sm font-light leading-snug text-ink">{text}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {canAdd ? (
        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 min-[420px]:flex-row min-[420px]:items-stretch">
          <div className="flex w-fit items-center border border-ink/20 bg-paper/40">
            <button
              type="button"
              className="h-12 w-11 text-lg text-ink/70 transition hover:text-ink"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Намали"
            >
              −
            </button>
            <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
            <button
              type="button"
              className="h-12 w-11 text-lg text-ink/70 transition hover:text-ink"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Увеличи"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => addItem(quantity)}
            className="h-12 w-full bg-clay text-[11px] font-medium uppercase tracking-[0.14em] text-paper transition duration-300 hover:bg-ink min-[420px]:flex-1 min-[420px]:tracking-[0.16em] sm:tracking-[0.2em]"
          >
            Добави в количката
          </button>
        </div>
      ) : (
        <Link
          href="/karti"
          className="mt-8 flex h-12 w-full items-center justify-center bg-clay px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition duration-300 hover:bg-ink"
        >
          Поръчай
        </Link>
      )}

      <p className="mt-4 flex items-start gap-3 text-xs font-light leading-relaxed text-ink-soft">
        <IconTruck className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
        <span>{product.shippingNote}</span>
      </p>
    </div>
  );
}
