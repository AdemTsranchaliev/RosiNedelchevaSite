import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata(
  "Поръчка",
  "Завършете поръчката на терапевтичните карти „Справяне с тревожността“.",
);

export default function CheckoutPage() {
  return <CheckoutForm />;
}
