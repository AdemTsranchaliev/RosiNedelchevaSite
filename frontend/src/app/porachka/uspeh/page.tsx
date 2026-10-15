import type { Metadata } from "next";
import { OrderSuccess } from "@/components/OrderSuccess";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata(
  "Поръчката е приета",
  "Поръчката на терапевтичните карти е приета.",
);

export default function OrderSuccessPage() {
  return <OrderSuccess />;
}
