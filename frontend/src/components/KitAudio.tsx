"use client";

import { useEffect, useRef, useState } from "react";
import { product, site } from "@/lib/content";
import { publicPath } from "@/lib/public-path";

const src = publicPath("/audio/r4n.mp3");

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function KitAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(src, { method: "HEAD" })
      .then((response) => {
        if (!cancelled) setMissing(!response.ok);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio || missing) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || !ready) return;
    audio.currentTime = value;
    setCurrent(value);
  }

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <article className="relative bg-card-gold px-6 py-8 sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute inset-3 rounded-[1rem] border border-ink/20" />
      <div className="relative">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Запис</p>
        <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          {product.title}
        </h2>
        <p className="mt-2 text-sm font-light text-ink-soft">
          {site.name} · аудио към картите
        </p>

        <div className="mt-8 flex items-center gap-4">
          <button
            type="button"
            onClick={toggle}
            disabled={missing}
            aria-label={playing ? "Пауза" : "Пусни записа"}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-clay text-paper transition hover:bg-ink disabled:cursor-default disabled:opacity-50"
          >
            {playing ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                <path d="M7 5h3.2v14H7V5Zm6.8 0H17v14h-3.2V5Z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" aria-hidden>
                <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="kit-audio-progress">
              Място в записа
            </label>
            <input
              id="kit-audio-progress"
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(current, duration || 0)}
              disabled={!ready}
              onChange={(event) => seek(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink/15 accent-clay disabled:cursor-default"
              style={{
                background: `linear-gradient(to right, var(--clay) ${progress}%, rgba(78,69,62,0.15) ${progress}%)`,
              }}
            />
            <div className="mt-2 flex justify-between text-[11px] tabular-nums tracking-wide text-ink-soft">
              <span>{formatTime(current)}</span>
              <span>{ready ? formatTime(duration) : "–:––"}</span>
            </div>
          </div>
        </div>

        {missing ? (
          <p className="mt-5 text-sm font-light leading-relaxed text-ink-soft">
            Записът още не е качен. Когато файлът е тук, бутонът го пуска.
          </p>
        ) : null}

        <audio
          ref={audioRef}
          src={missing ? undefined : src}
          preload="metadata"
          className="hidden"
          onLoadedMetadata={(event) => {
            setDuration(event.currentTarget.duration);
            setReady(true);
          }}
          onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setCurrent(0);
          }}
          onError={() => setMissing(true)}
        />
      </div>
    </article>
  );
}
