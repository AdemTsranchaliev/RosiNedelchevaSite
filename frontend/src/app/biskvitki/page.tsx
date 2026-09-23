import { LegalDocument, legalMetadata } from "@/components/LegalDocument";

export const metadata = legalMetadata(
  "Политика за бисквитки",
  "Какви бисквитки използва сайтът на Росица Неделчева и за какво.",
);

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Политика за бисквитки"
      summary="Какви бисквитки се използват на сайта, за какво служат и как можеш да ги управляваш."
    />
  );
}
