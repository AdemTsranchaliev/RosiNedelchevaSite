import type { Metadata } from "next";
import { BlogCard } from "@/components/BlogCard";
import { blogPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Блог",
  description:
    "Статии за тревожност, самопомощ и психотерапия от Росица Неделчева.",
};

export default function BlogPage() {
  const [featured, ...rest] = blogPosts;

  return (
    <div className="bg-paper pt-20">
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Блог</p>
          <h1 className="mt-5 max-w-xl font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
            Прозрения и грижа за себе си
          </h1>
          <p className="mt-5 max-w-md text-[15px] font-light leading-relaxed text-ink-soft">
            Кратки текстове за тревожността, самопомощта и момента, в който е добре да се потърси подкрепа.
          </p>

          {featured && (
            <div className="mt-14 border-t border-line pt-10">
              <BlogCard post={featured} featured />
            </div>
          )}

          {rest.length > 0 && (
            <div className="mt-14 grid gap-12 border-t border-line pt-10 md:grid-cols-2 md:gap-x-10 md:gap-y-14">
              {rest.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
