import type { MetadataRoute } from "next";
import { absoluteFile } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/vhod", "/profil", "/porachka", "/registracia", "/revyu", "/r4n"],
    },
    sitemap: absoluteFile("/sitemap.xml"),
  };
}
