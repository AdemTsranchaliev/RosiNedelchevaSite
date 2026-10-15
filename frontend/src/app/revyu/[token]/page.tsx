import type { Metadata } from "next";
import { ReviewInvite } from "@/components/ReviewInvite";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Ревю");

export function generateStaticParams() {
  return [{ token: "demo" }];
}

export default function ReviewPage() {
  return <ReviewInvite />;
}
