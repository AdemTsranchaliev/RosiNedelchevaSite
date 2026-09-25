"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SiteBanner } from "./SiteBanner";

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const checkout = pathname.startsWith("/porachka");
  const admin = pathname.startsWith("/admin");

  return (
    <>
      {admin ? null : <SiteBanner />}
      {admin ? null : <Header />}
      <main className="flex-1">{children}</main>
      {checkout || admin ? null : <Footer />}
    </>
  );
}
