import type { Metadata } from "next";
import { Cormorant_Garamond, Great_Vibes, Manrope } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@/components/Analytics";
import { AuthProvider } from "@/components/AuthProvider";
import { CartDrawer } from "@/components/CartDrawer";
import { CartProvider } from "@/components/CartProvider";
import { CookieConsent } from "@/components/CookieConsent";
import { SiteShell } from "@/components/SiteShell";
import { JsonLd } from "@/components/JsonLd";
import { seller, site } from "@/lib/content";
import { metadataBaseUrl, organizationGraph } from "@/lib/seo";
import { consentBootstrap, trackingConfig } from "@/lib/tracking";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display-face",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
});

const script = Great_Vibes({
  variable: "--font-script-face",
  subsets: ["latin"],
  weight: "400",
});

const description =
  "Терапевтични карти „Справяне с тревожността“ — инструмент за самопомощ, самоосъзнаване и вътрешна устойчивост.";

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: {
    default: "Справяне с тревожността | Росица Неделчева",
    template: "%s | Росица Неделчева",
  },
  description,
  applicationName: site.name,
  authors: [{ name: site.name, url: "/za-men/" }],
  creator: site.name,
  publisher: seller.legalName,
  openGraph: {
    type: "website",
    locale: "bg_BG",
    siteName: site.name,
    title: "Справяне с тревожността | Росица Неделчева",
    description,
    images: [{ url: "/images/site/rosi-hero.webp", alt: "Росица Неделчева с терапевтичните карти" }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  ...(trackingConfig.gsc ? { verification: { google: trackingConfig.gsc } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bg"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${script.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans text-ink">
        <JsonLd data={organizationGraph()} />
        {trackingConfig.gtmId || trackingConfig.gaId || trackingConfig.pixelId || trackingConfig.clarityId ? (
          <Script id="consent-defaults" strategy="beforeInteractive">
            {consentBootstrap}
          </Script>
        ) : null}
        <Analytics />
        <AuthProvider>
          <CartProvider>
            <SiteShell>{children}</SiteShell>
            <CookieConsent />
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
