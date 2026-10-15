import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Админ");

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="rn-admin min-h-screen" />}>
      <AdminShell />
      {children}
    </Suspense>
  );
}
