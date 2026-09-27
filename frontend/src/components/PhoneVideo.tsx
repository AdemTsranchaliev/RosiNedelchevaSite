"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { publicPath } from "@/lib/public-path";

export function PhoneVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  async function play() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    try {
      await video.play();
      setPlaying(true);
    } catch {
      video.muted = true;
      await video.play();
      setPlaying(true);
    }
  }

  function pause() {
    videoRef.current?.pause();
    setPlaying(false);
  }

  return (
    <section className="overflow-hidden bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] md:gap-16 md:py-20 lg:gap-24">
        <div className="order-2 max-w-xl md:order-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent-soft">От картите</p>
          <h2 className="mt-4 font-display text-[2.6rem] leading-[1.02] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Един въпрос.
            <span className="mt-1 block">Малко тишина.</span>
          </h2>
          <p className="mt-6 max-w-md text-[15px] font-light leading-relaxed text-paper/75">
            Сто карти в шест раздела. На всяка има въпрос, насока и покана да забележиш
            какво се случва — в мисълта, в тялото, в навика. Няма грешен отговор.
          </p>
          <blockquote className="mt-8 max-w-sm border-l border-accent-soft/70 pl-5 font-display text-[1.65rem] leading-[1.2] tracking-tight sm:text-[1.85rem]">
            Ако тревожността можеше да говори, какво би искала да ти каже?
          </blockquote>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.2em] text-paper/55">
            Карта · Раздел 1
          </p>
        </div>

        <div className="relative order-1 mx-auto w-full max-w-[20rem] md:order-2">
          <div className="relative aspect-[9/16] overflow-hidden bg-ink/40">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              src={publicPath("/videos/kak-se-polzvat.mp4")}
              poster={publicPath("/videos/kak-se-polzvat.jpg")}
              playsInline
              preload="metadata"
              aria-label="Росица Неделчева"
              onEnded={() => setPlaying(false)}
              onPause={() => setPlaying(false)}
              onPlay={() => setPlaying(true)}
            />
            {playing ? (
              <button type="button" onClick={pause} className="absolute inset-0" aria-label="Пауза" />
            ) : (
              <button
                type="button"
                onClick={() => void play()}
                className="absolute inset-0 grid place-items-center"
                aria-label="Пусни видеото"
              >
                <span className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full border border-paper/40 bg-paper/15 text-paper backdrop-blur-sm transition hover:bg-paper hover:text-ink">
                  <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" aria-hidden>
                    <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
                  </svg>
                </span>
              </button>
            )}
          </div>
          <figure className="absolute -bottom-8 -left-4 w-[8.5rem] -rotate-6 shadow-[0_22px_36px_-22px_rgba(12,8,6,0.9)] ring-[5px] ring-paper sm:-left-8 sm:w-40">
            <div className="relative aspect-[2/3] bg-paper">
              <Image
                src={publicPath("/images/cards/section-1-card-1.jpg")}
                alt="Карта: Ако тревожността можеше да говори, какво би искала да ти каже?"
                fill
                className="object-cover"
                sizes="180px"
              />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
