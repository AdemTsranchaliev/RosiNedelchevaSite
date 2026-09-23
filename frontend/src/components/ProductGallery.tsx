"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { product, siteImages } from "@/lib/content";

const gallery = [
  {
    src: product.imageBox,
    alt: "Кутия — Справяне с тревожността",
    fit: "object-contain",
  },
  {
    src: product.imageCards,
    alt: "Картите по раздели",
    fit: "object-contain",
  },
  {
    src: siteImages.portrait,
    alt: "Росица Неделчева",
    fit: "object-cover object-[center_22%]",
  },
  {
    src: siteImages.wide,
    alt: "Росица Неделчева — портрет",
    fit: "object-cover object-center",
  },
];

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d={direction === "right" ? "M7.5 4.5 13 10l-5.5 5.5" : "M12.5 4.5 7 10l5.5 5.5"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductGallery() {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const dragRef = useRef(0);
  const draggingRef = useRef(false);
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);

  const go = (index: number) => {
    setActive((index + gallery.length) % gallery.length);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    dragRef.current = 0;
    draggingRef.current = false;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const origin = start.current;
    if (!origin || origin.id !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (!draggingRef.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        start.current = null;
        return;
      }
      draggingRef.current = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    dragRef.current = dx;
    setDrag(dx);
  };

  const finishSwipe = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current || start.current.id !== event.pointerId) return;
    const dx = dragRef.current;
    const moved = draggingRef.current;
    start.current = null;
    dragRef.current = 0;
    draggingRef.current = false;
    setDrag(0);
    setDragging(false);
    if (!moved) return;
    if (dx <= -48) go(active + 1);
    else if (dx >= 48) go(active - 1);
  };

  return (
    <div className="min-w-0">
      <div className="relative min-w-0">
        <div
          className="w-full cursor-grab overflow-hidden bg-white active:cursor-grabbing"
          style={{ touchAction: "pan-y" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishSwipe}
          onPointerCancel={finishSwipe}
        >
          <div
            className={`flex w-full ${dragging ? "" : "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"}`}
            style={{ transform: `translate3d(calc(${-active * 100}% + ${drag}px), 0, 0)` }}
          >
            {gallery.map((image, index) => (
              <div
                key={image.src}
                className="relative aspect-[3/2] w-full shrink-0"
                aria-hidden={index !== active}
              >
                <Image
                  src={image.src}
                  alt={index === active ? image.alt : ""}
                  fill
                  priority={index === 0}
                  draggable={false}
                  className={`pointer-events-none ${image.fit}`}
                  sizes="(max-width: 1024px) 92vw, 46vw"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => go(active - 1)}
          className="absolute top-1/2 left-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-paper/85 text-ink ring-1 ring-ink/10 backdrop-blur-sm transition hover:bg-paper"
          aria-label="Предишна снимка"
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          onClick={() => go(active + 1)}
          className="absolute top-1/2 right-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-ink text-paper shadow-[0_8px_20px_-12px_rgba(78,69,62,0.8)] transition hover:bg-clay"
          aria-label="Следваща снимка"
        >
          <Chevron direction="right" />
        </button>

        <p className="pointer-events-none absolute bottom-3 left-3 bg-paper/85 px-2.5 py-1 text-[10px] font-medium tracking-[0.18em] text-ink backdrop-blur-sm">
          {active + 1} / {gallery.length}
        </p>
      </div>

      <div className="mt-2.5 grid grid-cols-4 gap-2" role="tablist" aria-label="Снимки">
        {gallery.map((image, index) => (
          <button
            key={image.src}
            type="button"
            role="tab"
            onClick={() => setActive(index)}
            className={`relative aspect-[3/2] overflow-hidden bg-white transition duration-300 ${
              index === active
                ? "opacity-100 ring-1 ring-ink ring-inset"
                : "opacity-55 hover:opacity-100"
            }`}
            aria-label={`Снимка ${index + 1}`}
            aria-selected={index === active}
          >
            <Image src={image.src} alt="" fill draggable={false} className={image.fit} sizes="160px" />
          </button>
        ))}
      </div>
    </div>
  );
}
