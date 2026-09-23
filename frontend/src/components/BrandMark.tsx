import Image from "next/image";
import Link from "next/link";
import { siteImages } from "@/lib/content";

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3"
      aria-label="Росица Неделчева — начало"
    >
      <span className="relative h-10 w-8 overflow-hidden sm:h-11 sm:w-9">
        <Image
          src={siteImages.logo}
          alt=""
          fill
          className={`object-contain object-left transition ${
            light ? "brightness-0 invert" : ""
          }`}
          sizes="40px"
          priority
        />
      </span>
      <span className="hidden flex-col leading-tight sm:flex">
        <span
          className={`font-display text-sm tracking-[0.16em] uppercase ${
            light ? "text-paper" : "text-ink"
          }`}
        >
          Росица Неделчева
        </span>
        <span className={light ? "text-[11px] text-paper/55" : "text-[11px] text-mute"}>
          психолог и психотерапевт
        </span>
      </span>
    </Link>
  );
}
