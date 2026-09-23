import type { Metadata } from "next";
import { OrderSuccess } from "@/components/OrderSuccess";

export const metadata: Metadata = {
  title: "Поръчката е приета",
  description: "Поръчката на терапевтичните карти е приета.",
};

export default function OrderSuccessPage() {
  return <OrderSuccess />;
}
