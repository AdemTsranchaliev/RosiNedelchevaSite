import type { Metadata } from "next";
import { KitAudio } from "@/components/KitAudio";
import { product, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Аудио",
  description: `Аудио към комплекта „${product.title}“.`,
  robots: { index: false, follow: false },
};

const notes = [
  { lead: "01", text: "Намери тихо място и слушай записа докрай." },
  { lead: "02", text: "Можеш да спреш и да продължиш, когато поискаш." },
  { lead: "03", text: "След него си дай малко време, преди да избереш карта." },
];

export default function KitAudioPage() {
  return (
    <div className="bg-paper pt-16 md:pt-[4.25rem]">
      <section className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">
              Към комплекта
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight md:text-6xl">
              Слушай
            </h1>
            <p className="mt-6 max-w-md text-[15px] font-light leading-[1.75] text-ink-soft">
              Това аудио е за хората с кутията „{product.title}“. Пусни го, когато имаш
              няколко спокойни минути.
            </p>
            <p className="mt-4 text-sm tracking-wide">
              {site.name}
              <span className="font-light text-ink-soft"> · {site.tagline}</span>
            </p>
          </div>
          <KitAudio />
        </div>

        <ul className="mx-auto mt-14 grid max-w-5xl gap-3 sm:grid-cols-3">
          {notes.map((note) => (
            <li key={note.lead} className="bg-paper-2 px-5 py-6">
              <p className="font-display text-2xl leading-none tracking-tight">{note.lead}</p>
              <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">{note.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
