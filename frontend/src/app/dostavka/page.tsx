import { LegalDocument, legalMetadata } from "@/components/LegalDocument";

export const metadata = legalMetadata(
  "Доставка и връщане",
  "Срокове за доставка и условия за връщане на терапевтичните карти.",
);

export default function ShippingPage() {
  return (
    <LegalDocument
      title="Доставка и връщане"
      summary="Срокове за доставка в България и как се процедира при връщане на поръчка."
    />
  );
}
