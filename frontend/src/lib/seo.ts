import type { Metadata } from "next";
import { blogPosts, faqs, product, seller, site, socials, type BlogPost } from "@/lib/content";

const DEFAULT_ORIGIN = "https://rosinedelcheva.com";

export function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || DEFAULT_ORIGIN).replace(/\/+$/, "");
}

function basePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

/** Path without the GitHub Pages prefix. Next metadata adds that prefix itself. */
export function seoPath(src: string) {
  const base = basePath();
  const clean = src.split("?")[0];
  const stripped = base && clean.startsWith(base) ? clean.slice(base.length) : clean;
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

export function canonicalPath(path: string) {
  const normalized = seoPath(path);
  if (normalized === "/") return "/";
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

export function absoluteUrl(path: string) {
  const canonical = canonicalPath(path);
  if (canonical === "/") return `${siteOrigin()}${basePath()}/`;
  return `${siteOrigin()}${basePath()}${canonical}`;
}

export function absoluteFile(path: string) {
  const clean = seoPath(path);
  return `${siteOrigin()}${basePath()}${clean}`;
}

/** metadataBase includes the project prefix so Open Graph and canonical URLs stay absolute. */
export function metadataBaseUrl() {
  const base = basePath();
  return new URL(base ? `${siteOrigin()}${base}/` : `${siteOrigin()}/`);
}

export function siteId(fragment: string) {
  return `${absoluteUrl("/")}#${fragment}`;
}

const shareImage = "/images/site/rosi-hero.webp";
const shareAlt = "Росица Неделчева с терапевтичните карти";

export const privateRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export function privateMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    robots: privateRobots,
  };
}

export function pageMetadata({
  title,
  description,
  path,
  image = shareImage,
  imageAlt = shareAlt,
  absoluteTitle = false,
  type = "website",
  publishedTime,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  absoluteTitle?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  noIndex?: boolean;
}): Metadata {
  const canonical = canonicalPath(path);
  const socialTitle = title.includes("|") ? title : `${title} | ${site.name}`;
  const imagePath = seoPath(image);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical },
    ...(noIndex ? { robots: privateRobots } : {}),
    openGraph: {
      type,
      locale: "bg_BG",
      url: canonical,
      siteName: site.name,
      title: socialTitle,
      description,
      images: [{ url: imagePath, alt: imageAlt }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [imagePath],
    },
  };
}

export function organizationGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": siteId("organization"),
        name: seller.legalName,
        url: absoluteUrl("/"),
        logo: absoluteFile("/images/site/logo-rn.webp"),
        email: site.email,
        telephone: "+359895563333",
        address: {
          "@type": "PostalAddress",
          streetAddress: "ул. „Хаджи Поптилев“ № 1, ет. 5, ап. 10",
          addressLocality: "Пазарджик",
          addressCountry: "BG",
        },
        sameAs: [...socials.map((item) => item.href), site.existingSite],
      },
      {
        "@type": "Person",
        "@id": siteId("person"),
        name: site.name,
        jobTitle: site.tagline,
        url: absoluteUrl("/za-men/"),
        image: absoluteFile("/images/site/rosi-about.webp"),
        email: site.email,
        telephone: "+359895563333",
        worksFor: { "@id": siteId("organization") },
        sameAs: socials.map((item) => item.href),
      },
      {
        "@type": "WebSite",
        "@id": siteId("website"),
        url: absoluteUrl("/"),
        name: site.name,
        inLanguage: "bg",
        publisher: { "@id": siteId("organization") },
      },
    ],
  };
}

export function productSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": siteId("product"),
    name: product.title,
    description: product.short,
    sku: product.id,
    image: [
      absoluteFile("/images/product-box.webp"),
      absoluteFile("/images/cards-sections.webp"),
      absoluteFile("/images/site/rosi-cards-desk.webp"),
      absoluteFile("/images/cards-fan.webp"),
    ],
    brand: { "@type": "Brand", name: site.name },
    category: "Терапевтични карти",
  };
}

export function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: [item.a, ...(item.points ?? [])].join(" "),
      },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    image: absoluteFile(post.image),
    inLanguage: "bg",
    author: { "@id": siteId("person") },
    publisher: { "@id": siteId("organization") },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}/`),
  };
}

export function blogSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Блог",
    description: "Статии за тревожност, самопомощ и психотерапия от Росица Неделчева.",
    url: absoluteUrl("/blog/"),
    inLanguage: "bg",
    publisher: { "@id": siteId("organization") },
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}/`),
      datePublished: post.date,
    })),
  };
}

export function aboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "За мен",
    url: absoluteUrl("/za-men/"),
    inLanguage: "bg",
    mainEntity: { "@id": siteId("person") },
    isPartOf: { "@id": siteId("website") },
  };
}

export function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Контакти",
    url: absoluteUrl("/kontakti/"),
    inLanguage: "bg",
    mainEntity: { "@id": siteId("person") },
    isPartOf: { "@id": siteId("website") },
  };
}
