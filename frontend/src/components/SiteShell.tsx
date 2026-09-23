"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const checkout = pathname.startsWith("/porachka");

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      {checkout ? null : <Footer />}
    </>
  );
}
