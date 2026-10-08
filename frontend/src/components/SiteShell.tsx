"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SiteBanner } from "./SiteBanner";

function isTextField(node: EventTarget | null): node is HTMLInputElement | HTMLTextAreaElement {
  if (node instanceof HTMLTextAreaElement) return !node.disabled;
  if (!(node instanceof HTMLInputElement) || node.disabled) return false;
  return ["text", "email", "tel", "password", "search", "url", "number", ""].includes(node.type);
}

function textFieldFrom(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  if (isTextField(target)) return target;
  const label = target.closest("label");
  if (label instanceof HTMLLabelElement && isTextField(label.control)) return label.control;
  return null;
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const checkout = pathname.startsWith("/porachka");
  const admin = pathname.startsWith("/admin");
  const login = pathname.startsWith("/vhod");

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const field = textFieldFrom(event.target);
      if (!field || document.activeElement === field) return;

      const rect = field.getBoundingClientRect();
      const fullyVisible = rect.top >= 8 && rect.bottom <= window.innerHeight - 8;
      if (!fullyVisible) {
        const root = document.documentElement;
        root.style.scrollBehavior = "auto";
        window.setTimeout(() => root.style.removeProperty("scroll-behavior"), 0);
        return;
      }

      event.preventDefault();
      field.focus({ preventScroll: true });
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return (
    <>
      {admin || checkout ? null : <SiteBanner />}
      {admin || checkout ? null : <Header />}
      <main className="flex-1">{children}</main>
      {checkout || admin || login ? null : <Footer />}
    </>
  );
}
