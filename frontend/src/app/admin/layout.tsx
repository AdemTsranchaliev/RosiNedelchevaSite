"use client";

import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="rn-admin min-h-screen" />}>
      <AdminShell />
      {children}
    </Suspense>
  );
}
