import { CookiePreferences } from "@/components/CookiePreferences";
import {
  LegalDocument,
  LegalLink,
  LegalList,
  LegalSection,
  legalMetadata,
} from "@/components/LegalDocument";
import { cookieCategories } from "@/lib/cookies";

export const metadata = legalMetadata(
  "Политика за бисквитки",
  "Какви бисквитки и записи използва сайтът на „ЕР ТЕРАПИ“ ЕООД и как се управляват.",
);

const toc = [
  { href: "#kakvo", label: "Какво използваме" },
  { href: "#saglasie", label: "Съгласие" },
  { href: "#neobhodimi", label: "Необходими" },
  { href: "#analitichni", label: "Аналитични" },
  { href: "#reklamni", label: "Рекламни" },
  { href: "#brauzar", label: "Браузър" },
  { href: "#nastroiki", label: "Настройки" },
];

export default function CookiesPage() {
  const necessary = cookieCategories.find((item) => item.id === "necessary");
  const analytics = cookieCategories.find((item) => item.id === "analytics");
  const marketing = cookieCategories.find((item) => item.id === "marketing");

  return (
    <LegalDocument
      title="Политика за бисквитки"
      summary="Какви записи използва сайтът, за какво служат и как да ги включите или изключите. Част от необходимите записи са в паметта на браузъра, не в бисквитка — служат за същото: сайтът да помни количката, входа и вашия избор."
      toc={toc}
    >
      <LegalSection id="kakvo" title="Какво използваме">
        <p>
          Сайтът използва бисквитки и локална памет, за да пази количката и входа, и — само със съгласие — за статистика и измерване на реклами. Данните от тези инструменти не се продават.
        </p>
        <p>
          Обработването на лични данни през тях е описано и в{" "}
          <LegalLink href="/poveritelnost">политиката за поверителност</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection id="saglasie" title="Съгласие">
        <p>
          При първо посещение може да приемете всички, да оставите само необходимите или да изберете поотделно. Докато няма избор, аналитичните и рекламните инструменти са изключени.
        </p>
        <p>
          Изборът се пази в браузъра и може да се промени от{" "}
          <LegalLink href="#nastroiki">настройките по-долу</LegalLink> или от бутона „Настройки за бисквитки“ в долната част на сайта.
        </p>
      </LegalSection>

      {necessary ? <CategorySection id="neobhodimi" category={necessary} /> : null}
      {analytics ? <CategorySection id="analitichni" category={analytics} /> : null}
      {marketing ? <CategorySection id="reklamni" category={marketing} /> : null}

      <LegalSection id="brauzar" title="Настройки на браузъра">
        <p>
          От настройките на браузъра можете да изтриете бисквитки и записани данни за този сайт. Ако ги изчистите, количката, входът и изборът за бисквитки се нулират и запитването за съгласие се показва отново.
        </p>
        <LegalList
          items={[
            "Блокирането на необходимите записи спира количката или входа.",
            "Отказът на аналитични и рекламни инструменти не спира поръчката.",
          ]}
        />
      </LegalSection>

      <LegalSection id="nastroiki" title="Настройки за бисквитки">
        <CookiePreferences />
      </LegalSection>
    </LegalDocument>
  );
}

function CategorySection({
  id,
  category,
}: {
  id: string;
  category: (typeof cookieCategories)[number];
}) {
  return (
    <LegalSection id={id} title={category.label}>
      <p>{category.summary}</p>
      <div className="divide-y divide-line border border-line">
        {category.items.map((item) => (
          <div key={item.name} className="px-4 py-4">
            <p className="text-ink">{item.name}</p>
            <p className="mt-1">{item.purpose}</p>
            <p className="mt-2 text-[13px] text-mute">
              {item.who} · {item.duration}
            </p>
          </div>
        ))}
      </div>
    </LegalSection>
  );
}
