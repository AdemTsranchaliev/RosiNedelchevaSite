import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Блог",
  description:
    "Статии за тревожност, самопомощ и психотерапия от Росица Неделчева.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function BlogPage() {
  return (
    <div className="bg-paper pt-20">
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-mute">
            Блог
          </p>
          <h1 className="mt-5 max-w-xl font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
            Прозрения и грижа за себе си
          </h1>

          <div className="mt-16 divide-y divide-line border-y border-line">
            {blogPosts.map((post) => (
              <article key={post.slug} className="py-9">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-mute">
                      {formatDate(post.date)} · {post.readMinutes} мин
                    </p>
                    <h2 className="mt-3 font-display text-2xl tracking-tight md:text-3xl">
                      <Link href={`/blog/${post.slug}`} className="hover:text-accent">
                        {post.title}
                      </Link>
                    </h2>
                    <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">
                      {post.excerpt}
                    </p>
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink"
                  >
                    Прочети →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
