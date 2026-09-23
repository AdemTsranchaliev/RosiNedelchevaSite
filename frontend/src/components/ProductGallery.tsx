"use client";

import Image from "next/image";
import { useState } from "react";
import { product, siteImages } from "@/lib/content";

const gallery = [
  { src: product.imageBox, alt: "Кутия — Справяне с тревожността" },
  { src: product.imageCards, alt: "Картите по раздели" },
  { src: siteImages.portrait, alt: "Росица Неделчева" },
  { src: siteImages.wide, alt: "Росица Неделчева — портрет" },
];

export function ProductGallery() {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-2 md:aspect-[5/6]">
        <Image
          src={gallery[active].src}
          alt={gallery[active].alt}
          fill
          priority
          className="object-cover transition-opacity duration-500"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {gallery.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActive(index)}
            className={`relative aspect-square overflow-hidden bg-paper-2 transition duration-300 ${
              active === index
                ? "opacity-100 ring-1 ring-ink/30"
                : "opacity-45 hover:opacity-80"
            }`}
            aria-label={`Снимка ${index + 1}`}
          >
            <Image src={image.src} alt="" fill className="object-cover" sizes="120px" />
          </button>
        ))}
      </div>
    </div>
  );
}
