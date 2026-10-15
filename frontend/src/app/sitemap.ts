import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/karti"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/za-men"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/kontakti"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  for (const post of blogPosts) {
    pages.push({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.date),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return pages;
}
