import Image from "next/image";
import Link from "next/link";
import { site, siteImages } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 md:flex-row md:items-start md:justify-between md:px-8">
        <div>
          <div className="relative h-10 w-28">
            <Image
              src={siteImages.logoFooter}
              alt={site.name}
              fill
              className="object-contain object-left"
              sizes="112px"
            />
          </div>
          <p className="mt-3 text-sm font-light text-mute">{site.name}</p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-[12px] font-medium uppercase tracking-[0.16em] text-ink-soft">
          <Link href="/" className="hover:text-ink">
            Карти
          </Link>
          <Link href="/za-men" className="hover:text-ink">
            За мен
          </Link>
          <Link href="/blog" className="hover:text-ink">
            Блог
          </Link>
          <Link href="/kontakti" className="hover:text-ink">
            Контакти
          </Link>
        </nav>

        <div className="text-sm font-light text-mute">
          <a href={site.phoneHref} className="block hover:text-ink">
            {site.phone}
          </a>
          <a href={site.emailHref} className="mt-1 block hover:text-ink">
            {site.email}
          </a>
        </div>
      </div>
      <div className="border-t border-line px-5 py-4 text-center text-[11px] text-mute md:px-8">
        © {new Date().getFullYear()} {site.name}
      </div>
    </footer>
  );
}
