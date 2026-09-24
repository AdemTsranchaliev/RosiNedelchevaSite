import type { Metadata } from "next";
import { KitAudio } from "@/components/KitAudio";
import { product } from "@/lib/content";

export const metadata: Metadata = {
  title: "Аудио",
  description: `Аудио към комплекта „${product.title}“.`,
  robots: { index: false, follow: false },
};

export default function KitAudioPage() {
  return (
    <div className="bg-paper pt-20">
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-mute">
            Към комплекта
          </p>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
            Аудио
          </h1>
          <p className="mt-6 text-[15px] font-light leading-[1.75] text-ink-soft">
            Това аудио е за хората с кутията „{product.title}“. Слушай на тихо място,
            с колкото време имаш.
          </p>
          <KitAudio />
        </div>
      </section>
    </div>
  );
}
