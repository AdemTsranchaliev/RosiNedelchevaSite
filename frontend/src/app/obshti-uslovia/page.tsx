import { LegalDocument, legalMetadata } from "@/components/LegalDocument";

export const metadata = legalMetadata(
  "Общи условия",
  "Общи условия за ползване на сайта и за покупка на терапевтичните карти.",
);

export default function TermsPage() {
  return (
    <LegalDocument
      title="Общи условия"
      summary="Условията за ползване на сайта и за покупка на терапевтичните карти."
    />
  );
}
