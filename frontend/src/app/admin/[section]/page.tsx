const sections = [
  "porachki",
  "kurieri",
  "produkti",
  "revyuta",
  "otcheti",
  "promocii",
  "promokodove",
  "byuletin",
  "imeyli",
  "baner",
  "blog",
  "potrebiteli",
];

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

export default function AdminSectionPage() {
  return null;
}
