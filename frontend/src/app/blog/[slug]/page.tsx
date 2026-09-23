import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) return { title: "Статия" };
  return { title: post.title, description: post.excerpt };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) notFound();

  return (
    <div className="bg-paper pt-20">
      <article className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/blog"
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-mute hover:text-ink"
          >
            ← Блог
          </Link>
          <p className="mt-10 text-[11px] uppercase tracking-[0.16em] text-mute">
            {formatDate(post.date)} · {post.readMinutes} мин
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <div className="mt-10 space-y-5 text-[15px] font-light leading-[1.8] text-ink-soft md:text-base">
            {post.content.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
