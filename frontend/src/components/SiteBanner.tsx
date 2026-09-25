"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/session";

export function SiteBanner() {
  const [banner, setBanner] = useState<{ text: string; href: string; isActive: boolean } | null>(null);

  useEffect(() => {
    return () => {
      document.documentElement.dataset.banner = "off";
    };
  }, []);

  useEffect(() => {
    api<{ banner?: { text: string; href: string; isActive: boolean } }>("/api/offers")
      .then((data) => {
        const visible = Boolean(data?.banner?.isActive && data.banner.text);
        document.documentElement.dataset.banner = visible ? "on" : "off";
        if (visible && data?.banner) setBanner(data.banner);
      })
      .catch(() => setBanner(null));
  }, []);

  if (!banner) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-[#1c2830] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-2.5 text-center text-sm">
        <Link href={banner.href || "/karti"} className="hover:underline">
          {banner.text}
        </Link>
      </div>
    </div>
  );
}
