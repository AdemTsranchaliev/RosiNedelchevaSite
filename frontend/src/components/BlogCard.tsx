import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/lib/content";

export function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function BlogCard({
  post,
  featured = false,
}: {
  post: BlogPost;
  featured?: boolean;
}) {
  return (
    <article className={featured ? "lg:col-span-2" : undefined}>
      <Link
        href={`/blog/${post.slug}`}
        className={`group grid gap-5 ${
          featured ? "sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] sm:items-center sm:gap-10" : ""
        }`}
      >
        <div
          className={`relative overflow-hidden bg-paper-2 ${
            featured ? "aspect-[4/3] sm:aspect-[5/4]" : "aspect-[3/2]"
          }`}
        >
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            priority={featured}
            className="object-cover transition duration-700 motion-safe:group-hover:scale-[1.03]"
            style={{ objectPosition: post.imagePosition ?? "center" }}
            sizes={featured ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 640px) 100vw, 40vw"}
          />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-mute">
            {formatBlogDate(post.date)} · {post.readMinutes} мин
          </p>
          <h2
            className={`mt-3 font-display tracking-tight text-ink transition group-hover:text-accent ${
              featured ? "text-3xl leading-[1.08] md:text-4xl" : "text-2xl leading-snug md:text-[1.7rem]"
            }`}
          >
            {post.title}
          </h2>
          <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-ink-soft">
            {post.excerpt}
          </p>
          <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink">
            Прочети
          </p>
        </div>
      </Link>
    </article>
  );
}
