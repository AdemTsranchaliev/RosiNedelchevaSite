import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatBlogDate } from "@/components/BlogCard";
import { blogPosts, type BlogPost } from "@/lib/content";

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
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { images: [{ url: post.image, alt: post.imageAlt }] },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) notFound();

  const index = blogPosts.findIndex((item) => item.slug === post.slug);
  const previous = index > 0 ? blogPosts[index - 1] : null;
  const next = index < blogPosts.length - 1 ? blogPosts[index + 1] : null;

  return (
    <div className="bg-paper pt-20">
      <article className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/blog"
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-mute transition hover:text-ink"
          >
            ← Блог
          </Link>

          <header className="mt-10 max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.16em] text-mute">
              {formatBlogDate(post.date)} · {post.readMinutes} мин четене
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
              {post.title}
            </h1>
            <p className="mt-5 text-[15px] font-light leading-relaxed text-ink-soft md:text-base">
              {post.excerpt}
            </p>
          </header>

          <figure className="mt-10">
            <div className="relative aspect-[3/2] overflow-hidden bg-paper-2 sm:aspect-[16/9]">
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                priority
                className="object-cover"
                style={{ objectPosition: post.imagePosition ?? "center" }}
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          </figure>

          <div className="mt-12 max-w-2xl space-y-6 text-[15px] font-light leading-[1.8] text-ink-soft md:text-base">
            {post.content.map((block, index) => {
              if (block.type === "image") {
                return (
                  <figure key={`${block.src}-${index}`} className="my-10">
                    <div
                      className={`relative overflow-hidden bg-paper-2 ${
                        block.fit === "contain" ? "aspect-[2/1]" : "aspect-[3/2] sm:aspect-[16/10]"
                      }`}
                    >
                      <Image
                        src={block.src}
                        alt={block.alt}
                        fill
                        className={block.fit === "contain" ? "object-contain" : "object-cover"}
                        sizes="(max-width: 768px) 100vw, 672px"
                      />
                    </div>
                    {block.caption && (
                      <figcaption className="mt-3 text-[12px] leading-relaxed text-mute">
                        {block.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              }

              return <p key={block.text.slice(0, 48)}>{block.text}</p>;
            })}
          </div>

          {(previous || next) && (
            <nav
              aria-label="Други статии"
              className="mt-16 grid border-t border-line sm:grid-cols-2"
            >
              {previous ? (
                <PostStep post={previous} label="Предишна" />
              ) : (
                <span className="hidden sm:block" />
              )}
              {next ? (
                <PostStep post={next} label="Следваща" align="end" divided={!!previous} />
              ) : null}
            </nav>
          )}
        </div>
      </article>
    </div>
  );
}

function PostStep({
  post,
  label,
  align = "start",
  divided = false,
}: {
  post: BlogPost;
  label: string;
  align?: "start" | "end";
  divided?: boolean;
}) {
  const end = align === "end";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex items-center gap-4 border-line py-8 ${
        end ? "sm:flex-row-reverse sm:border-l sm:pl-8 sm:text-right" : "sm:pr-8"
      } ${divided ? "border-t sm:border-t-0" : ""}`}
    >
      <span className="relative h-16 w-16 shrink-0 overflow-hidden bg-paper-2 sm:h-[4.5rem] sm:w-[4.5rem]">
        <Image
          src={post.image}
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: post.imagePosition ?? "center" }}
          sizes="72px"
        />
      </span>
      <span>
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-mute">
          {label}
        </span>
        <span className="mt-2 block font-display text-xl leading-snug tracking-tight text-ink transition group-hover:text-accent">
          {post.title}
        </span>
      </span>
    </Link>
  );
}
