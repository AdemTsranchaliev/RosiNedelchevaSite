import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/content";
import { publicPath } from "@/lib/public-path";

const logo = publicPath("/images/site/logo-rn.png");

export function Monogram({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} aria-hidden>
      <Image src={logo} alt="" fill className="object-contain" sizes="96px" />
    </span>
  );
}

export function BrandMark() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3"
      aria-label="Росица Неделчева — начало"
    >
      <Monogram className="h-11 w-11 shrink-0" />
      <span className="hidden min-w-0 flex-col leading-tight sm:flex">
        <span className="whitespace-nowrap font-display text-[13px] tracking-[0.14em] uppercase text-ink xl:text-sm xl:tracking-[0.16em]">
          {site.name}
        </span>
        <span className="mt-0.5 whitespace-nowrap text-[11px] font-light text-mute lg:hidden xl:block">
          {site.tagline}
        </span>
      </span>
    </Link>
  );
}
