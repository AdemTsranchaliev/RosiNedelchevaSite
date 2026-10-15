import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Регистрация");

export default function RegisterPage() {
  redirect("/vhod");
}
