"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getSectionCover,
  getSectionMeta,
  pickRandomCardInSection,
  pickRandomSectionId,
  sectionCovers,
  type DeckCard,
} from "@/lib/deck";

type Phase = "idle" | "lifting" | "section" | "flipping" | "content";

export function CardDraw() {
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [card, setCard] = useState<DeckCard | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [usedSections, setUsedSections] = useState<number[]>([]);
  const [usedCards, setUsedCards] = useState<string[]>([]);
  const timers = useRef<number[]>([]);
  const reduceMotion = usePrefersReducedMotion();

  const busy = phase === "lifting" || phase === "flipping";

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const wait = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(resolve, reduceMotion ? 0 : ms);
        timers.current.push(id);
      }),
    [reduceMotion],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  /** Стъпка 1: случаен раздел → корица */
  async function drawSection() {
    if (busy) return;

    const nextSection = pickRandomSectionId(usedSections);

    clearTimers();
    setPhase("lifting");
    setCard(null);
    setSectionId(null);

    await wait(400);

    setSectionId(nextSection);
    setUsedSections((prev) => {
      const next = prev.includes(nextSection) ? prev : [...prev, nextSection];
      return next.length >= sectionCovers.length ? [] : next;
    });
    setPhase("section");
  }

  /** Стъпка 2: случайна карта от раздела → гръб */
  async function openCardFromSection() {
    if (busy || sectionId == null || phase !== "section") return;

    const nextCard = pickRandomCardInSection(sectionId, usedCards);
    clearTimers();
    setCard(nextCard);
    setUsedCards((prev) => [...prev, nextCard.id]);
    setPhase("flipping");
    await wait(720);
    setPhase("content");
  }

  function resetToIdle() {
    clearTimers();
    setSectionId(null);
    setCard(null);
    setPhase("idle");
  }

  function onCardClick() {
    if (busy) return;
    if (phase === "idle") void drawSection();
    else if (phase === "section") void openCardFromSection();
  }

  async function onPrimaryClick() {
    if (phase === "idle" || phase === "content") await drawSection();
    else if (phase === "section") await openCardFromSection();
  }

  const meta = sectionId != null ? getSectionMeta(sectionId) : null;
  const cover =
    sectionId != null ? getSectionCover(sectionId).frontImage : null;
  const showBack = phase === "flipping" || phase === "content";

  const primaryLabel =
    phase === "idle"
      ? "Отвори карта"
      : phase === "lifting"
        ? "Изтегляне…"
        : phase === "section"
          ? "Отвори"
          : phase === "flipping"
            ? "Отваряне…"
            : "Нова карта";

  const hint =
    phase === "idle"
      ? "Ще се изтегли случаен раздел"
      : phase === "lifting"
        ? "Изтегляне…"
        : phase === "section"
          ? "Това е разделът. Натисни Отвори за карта от него."
          : phase === "flipping"
            ? "Обръщане…"
            : "Карта от раздела";

  return (
    <section
      id="otvori-karta"
      className="scroll-mt-20 bg-paper-2 px-5 py-20 text-ink md:px-8 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">
            Опитай
          </p>
          <h2 className="mt-4 font-display text-3xl tracking-tight md:text-5xl">
            Отвори карта
          </h2>
          <p className="mt-4 text-[15px] font-light leading-relaxed text-ink-soft">
            Първо виждаш раздела. После отваряш случайна карта от него.
          </p>
        </div>

        <div className="mt-14 flex flex-col items-center">
          <div className="perspective-card relative aspect-[2/3] w-full max-w-[300px] sm:max-w-[320px]">
            <div
              className={`deck-layer deck-layer-2 ${busy ? "is-busy" : ""}`}
              aria-hidden
            />
            <div
              className={`deck-layer deck-layer-1 ${busy ? "is-busy" : ""}`}
              aria-hidden
            />

            <button
              type="button"
              onClick={onCardClick}
              disabled={busy || phase === "content"}
              aria-label={primaryLabel}
              className={`card-stage relative h-full w-full text-left ${
                phase === "lifting" ? "is-lifting" : ""
              } ${phase === "content" ? "cursor-default" : ""}`}
            >
              <div
                className={`card-flip h-full w-full ${showBack ? "is-flipped" : ""}`}
              >
                <div className="card-face card-front">
                  {cover && (phase === "section" || showBack) ? (
                    <PhotoFace
                      src={cover}
                      alt={
                        meta
                          ? `Раздел ${meta.id} — ${meta.name}`
                          : "Корица на раздел"
                      }
                      priority
                    />
                  ) : (
                    <IdleFace />
                  )}
                </div>
                <div className="card-face card-back">
                  {card ? (
                    <PhotoFace src={card.backImage} alt="Карта от раздела" />
                  ) : (
                    <div className="h-full bg-paper-2" />
                  )}
                </div>
              </div>
            </button>
          </div>

          {meta && phase !== "idle" && phase !== "lifting" && (
            <p className="mt-5 text-center text-sm font-light text-ink-soft">
              <span className="text-accent">Раздел {meta.id}</span>
              {" · "}
              {meta.name}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void onPrimaryClick()}
              disabled={busy}
              className="inline-flex h-12 min-w-[180px] items-center justify-center bg-clay px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition hover:bg-ink disabled:cursor-wait disabled:opacity-55"
            >
              {primaryLabel}
            </button>
            {phase === "content" && (
              <button
                type="button"
                onClick={resetToIdle}
                className="inline-flex h-12 items-center justify-center border border-ink/20 px-5 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft transition hover:border-ink/45 hover:text-ink"
              >
                В начало
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-[11px] font-light text-mute">
            {hint}
          </p>

          <a
            href="#porachai"
            className="mt-10 inline-flex h-11 items-center border border-ink/20 px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft transition hover:border-ink/45 hover:text-ink"
          >
            Към поръчката
          </a>
        </div>
      </div>
    </section>
  );
}

function PhotoFace({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative h-full w-full bg-paper-2">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="(max-width: 640px) 300px, 320px"
      />
    </div>
  );
}

function IdleFace() {
  return (
    <div className="card-shell relative flex h-full flex-col items-center justify-center overflow-hidden bg-card-gold text-center">
      <div className="card-inner-border" />
      <p className="relative font-display text-5xl text-accent">RN</p>
      <p className="relative mt-5 px-6 font-display text-xl leading-snug tracking-tight text-ink">
        Справяне с тревожността
      </p>
      <p className="relative mt-4 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
        Отвори карта
      </p>
    </div>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
