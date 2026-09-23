import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Поръчка",
  description: "Завършете поръчката на терапевтичните карти „Справяне с тревожността“.",
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
