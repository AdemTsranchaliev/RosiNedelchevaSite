"use client";

import { useEffect, useState } from "react";
import { publicPath } from "@/lib/public-path";

const src = publicPath("/audio/r4n.mp3");

export function KitAudio() {
  const [ready, setReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(src, { method: "HEAD" })
      .then((response) => {
        if (!cancelled) setReady(response.ok);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-10 bg-paper-2 px-5 py-6 sm:px-7">
      {ready ? (
        <audio controls preload="metadata" src={src} className="w-full accent-accent">
          Браузърът не поддържа аудио.
        </audio>
      ) : (
        <p className="text-sm font-light leading-relaxed text-ink-soft">
          {ready === null
            ? "Зареждане…"
            : "Аудиозаписът още не е качен. Щом файлът е на сайта, оттук ще може да се слуша."}
        </p>
      )}
    </div>
  );
}
