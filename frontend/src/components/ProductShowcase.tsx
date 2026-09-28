"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ProductBuyPanel } from "@/components/ProductBuyPanel";
import { formatPrice, product, sections } from "@/lib/content";
import { useCart } from "./CartProvider";

const fan = [
  { left: "1%", rotate: -14, lift: 0, z: 1 },
  { left: "15.5%", rotate: -8, lift: 16, z: 2 },
  { left: "30%", rotate: -2.5, lift: 28, z: 3 },
  { left: "44.5%", rotate: 2.5, lift: 28, z: 4 },
  { left: "59%", rotate: 8, lift: 16, z: 5 },
  { left: "73.5%", rotate: 14, lift: 0, z: 6 },
];

function sampleOf(section: (typeof sections)[number]) {
  return "sample" in section ? section.sample : undefined;
}

function cautionOf(section: (typeof sections)[number]) {
  return "caution" in section ? section.caution : undefined;
}

export function ProductShowcase() {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const shown = sections[hover ?? active];
  const current = sections[active];
  const sample = sampleOf(current);
  const caution = cautionOf(current);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const openSection = (index: number) => {
    setActive(index);
    document.getElementById("vatre")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <>
      <section id="porachai" className="scroll-mt-20 bg-paper pt-16 md:pt-[4.25rem]">
        <div className="grid lg:min-h-[calc(100svh-4.25rem)] lg:grid-cols-2">
          <div className="flex min-w-0 items-center bg-[#e0cdb4] lg:min-h-full">
            <div className="w-full min-w-0 py-8 sm:py-10">
              <div className="relative h-64 w-full sm:h-80 lg:h-[22rem]">
                <Image
                  src={product.imageBox}
                  alt="Кутия — Справяне с тревожността"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              <div className="relative z-10 mx-auto -mt-20 hidden h-[15.5rem] w-[94%] max-w-2xl md:block lg:-mt-24 lg:h-[16.5rem]">
                {sections.map((section, index) => {
                  const pose = fan[index];
                  const hot = (hover ?? active) === index;
                  const lift = reduceMotion ? pose.lift : hot ? pose.lift + 18 : pose.lift;
                  const rotate = hot && !reduceMotion ? 0 : pose.rotate;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      className="product-fan absolute bottom-1 w-[18%] origin-bottom focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                      style={{
                        left: pose.left,
                        zIndex: hot ? 30 : pose.z,
                        transform: `translateY(${-lift}px) rotate(${rotate}deg) scale(${hot && !reduceMotion ? 1.05 : 1})`,
                      }}
                      aria-label={`Раздел ${section.id}: ${section.name}`}
                      aria-pressed={active === index}
                      onMouseEnter={() => setHover(index)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(index)}
                      onBlur={() => setHover(null)}
                      onClick={() => openSection(index)}
                    >
                      <span
                        className={`relative block aspect-[2/3] overflow-hidden rounded-[0.8rem] bg-paper shadow-[0_18px_30px_-16px_rgba(42,36,32,0.75)] ${
                          active === index ? "ring-2 ring-ink" : "ring-1 ring-black/10"
                        }`}
                      >
                        <Image src={section.cover} alt="" fill className="object-cover" sizes="160px" />
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative z-10 -mt-6 flex w-full min-w-0 snap-x gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => openSection(index)}
                    aria-label={`Раздел ${section.id}: ${section.name}`}
                    aria-pressed={active === index}
                    className={`w-[6.6rem] shrink-0 snap-start overflow-hidden rounded-[0.7rem] bg-paper shadow-[0_14px_28px_-16px_rgba(42,36,32,0.7)] ${
                      active === index ? "ring-2 ring-ink" : "ring-1 ring-black/10"
                    }`}
                  >
                    <span className="relative block aspect-[2/3]">
                      <Image src={section.cover} alt="" fill className="object-cover" sizes="110px" />
                    </span>
                  </button>
                ))}
              </div>

              <p className="px-6 pt-4 text-center font-display text-2xl leading-tight tracking-tight text-ink">
                {shown.name}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center px-5 py-12 sm:px-12 lg:px-14 lg:py-16 xl:px-20">
            <ProductBuyPanel showPrice canAdd editorial titleLevel="h1" />
          </div>
        </div>
      </section>

      <section className="bg-card-gold" aria-label="Какво съдържа комплектът">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-5 py-12 sm:grid-cols-4 md:px-8 md:py-14">
          {product.specs.map((spec) => (
            <div key={spec.detail} className="border-l border-ink/15 pl-5">
              <dt className="font-display text-5xl leading-none tracking-tight md:text-6xl">{spec.lead}</dt>
              <dd className="mt-3 text-sm font-light text-ink-soft">{spec.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="vatre" className="scroll-mt-24 bg-[#2a2420] px-5 py-16 text-[#f6f1e8] md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-16">
          <div className="relative mx-auto w-full max-w-md" style={{ perspective: "1400px" }}>
            <div
              className={`pointer-events-none absolute top-10 -right-2 hidden w-[54%] rotate-[7deg] transition-opacity duration-500 sm:block ${
                sample ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden
            >
              {sections.map((section) => {
                const src = sampleOf(section);
                if (!src) return null;
                return (
                  <div
                    key={section.id}
                    className={`relative aspect-[2/3] overflow-hidden rounded-[1rem] shadow-[0_30px_50px_-28px_rgba(0,0,0,0.85)] ${
                      section.id === current.id ? "block" : "hidden"
                    }`}
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="220px" />
                  </div>
                );
              })}
            </div>

            <div
              className={`product-card-tilt relative aspect-[2/3] overflow-hidden rounded-[1.15rem] shadow-[0_40px_70px_-32px_rgba(0,0,0,0.8)] ring-1 ring-white/10 ${
                sample ? "w-[78%]" : "mx-auto w-[86%]"
              }`}
            >
              {sections.map((section, index) => (
                <Image
                  key={section.id}
                  src={section.cover}
                  alt={index === active ? section.name : ""}
                  fill
                  className={`object-cover transition-opacity duration-500 ${
                    index === active ? "opacity-100" : "opacity-0"
                  }`}
                  sizes="(max-width: 1024px) 70vw, 320px"
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#e6d9b4]">В кутията</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight md:text-6xl">Шест раздела</h2>
            <div key={current.id} className="animate-fade">
              <p className="mt-6 font-display text-[2rem] leading-tight tracking-tight md:text-4xl">{current.name}</p>
              <p className="mt-4 max-w-xl text-[15px] font-light leading-relaxed text-[#f6f1e8]/78">{current.guide}</p>
              {caution ? (
                <p className="mt-5 max-w-xl border-l border-[#e6d9b4]/70 pl-4 text-sm font-light leading-relaxed text-[#e6d9b4]">
                  {caution}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3" role="tablist" aria-label="Раздели">
          {sections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => setActive(index)}
              className={`relative aspect-[2/3] overflow-hidden rounded-[0.75rem] transition duration-300 ${
                index === active
                  ? "-translate-y-1 ring-2 ring-[#e6d9b4] ring-offset-2 ring-offset-[#2a2420]"
                  : "opacity-65 hover:-translate-y-1 hover:opacity-100"
              }`}
            >
              <Image src={section.cover} alt={section.name} fill className="object-cover" sizes="140px" />
            </button>
          ))}
        </div>
      </section>

      <StickyBuy />
    </>
  );
}

function StickyBuy() {
  const { addItem } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = document.getElementById("porachai");
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      threshold: 0.18,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-md transition duration-300 lg:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      aria-hidden={!visible}
      inert={visible ? undefined : true}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
        <div>
          <p className="font-display text-2xl leading-none tracking-tight">{formatPrice(product.price)}</p>
          <p className="mt-1 text-[11px] font-light text-ink-soft">Вкл. ДДС</p>
        </div>
        <button
          type="button"
          onClick={() => addItem(1)}
          className="h-11 bg-clay px-5 text-[11px] font-medium uppercase tracking-[0.16em] text-paper transition hover:bg-ink"
        >
          Добави
        </button>
      </div>
    </div>
  );
}
