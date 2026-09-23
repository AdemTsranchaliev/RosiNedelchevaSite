import { LegalDocument, legalMetadata } from "@/components/LegalDocument";

export const metadata = legalMetadata(
  "Политика за поверителност",
  "Как се обработват личните данни при поръчка и контакт с Росица Неделчева.",
);

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Политика за поверителност"
      summary="Как се събират, използват и съхраняват личните данни при поръчка, запитване или посещение на сайта."
    />
  );
}
