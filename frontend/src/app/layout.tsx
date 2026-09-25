import type { Metadata } from "next";
import { Cormorant_Garamond, Great_Vibes, Manrope } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { CartDrawer } from "@/components/CartDrawer";
import { CartProvider } from "@/components/CartProvider";
import { SiteShell } from "@/components/SiteShell";
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

export const metadata: Metadata = {
  title: {
    default: "Справяне с тревожността | Росица Неделчева",
    template: "%s | Росица Неделчева",
  },
  description:
    "Терапевтични карти „Справяне с тревожността“ — инструмент за самопомощ, самоосъзнаване и вътрешна устойчивост.",
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
        <AuthProvider>
          <CartProvider>
            <SiteShell>{children}</SiteShell>
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
