import { publicPath } from "@/lib/public-path";
import { sections } from "./content";

/** Корица на раздел (лице при първо теглене) */
export type SectionCover = {
  sectionId: number;
  frontImage: string;
};

/** Карта от раздел (гръб при „Отвори“) */
export type DeckCard = {
  id: string;
  sectionId: number;
  prompt: string;
  insight: string;
  invitation: string;
  backImage: string;
};

const card = (file: string) => publicPath(`/images/cards/${file}`);

/** Кориците и 20-те карти от файла за печат. */
export const sectionCovers: SectionCover[] = [
  { sectionId: 1, frontImage: card("section-1-front.jpg") },
  { sectionId: 2, frontImage: card("section-2-front.jpg") },
  { sectionId: 3, frontImage: card("section-3-front.jpg") },
  { sectionId: 4, frontImage: card("section-4-front.jpg") },
  { sectionId: 5, frontImage: card("section-5-front.jpg") },
  { sectionId: 6, frontImage: card("section-6-front.jpg") },
];

export const deckCards: DeckCard[] = [
  {
    id: "1-1",
    sectionId: 1,
    prompt: "Ако тревожността можеше да говори, какво би искала да ти каже?",
    insight:
      "Вместо да бъде само източник на дискомфорт, тревожността понякога може да носи важна информация за нашите нужди, страхове или вътрешни конфликти.",
    invitation:
      "Каква нужда, страх или послание е възможно да се опитва да ти покаже?",
    backImage: card("section-1-card-1.jpg"),
  },
  {
    id: "1-2",
    sectionId: 1,
    prompt: "Какво очакваш да се случи, което все още не се е случило?",
    insight:
      "Умът често се опитва да предвиди бъдещето, за да ни предпази. Понякога това увеличава напрежението.",
    invitation: "Каква е вероятността този сценарий действително да се случи?",
    backImage: card("section-1-card-2.jpg"),
  },
  {
    id: "2-1",
    sectionId: 2,
    prompt: "Колко често се сравняваш с другите?",
    insight:
      "Сравненията могат да засилят чувството за недостатъчност и напрежение.",
    invitation: "Какво се случва с теб след подобни сравнения?",
    backImage: card("section-2-card-1.jpg"),
  },
  {
    id: "2-2",
    sectionId: 2,
    prompt: "Стремиш ли се да бъдеш перфектен/перфектна?",
    insight:
      "Перфекционизмът може да създаде усещане, че никога не е достатъчно добре.",
    invitation:
      "Какво би се променило, ако си позволиш да бъдеш достатъчно добър/добра?",
    backImage: card("section-2-card-2.jpg"),
  },
  {
    id: "2-3",
    sectionId: 2,
    prompt: "Колко време прекарваш в анализиране на един проблем?",
    insight:
      "Размишлението може да бъде полезно, но понякога се превръща в безкраен кръг от тревожни мисли.",
    invitation: "Как би разбрал/а, че вече имаш достатъчно информация?",
    backImage: card("section-2-card-3.jpg"),
  },
  {
    id: "2-4",
    sectionId: 2,
    prompt: "Колко често си представяш най-лошия възможен сценарий?",
    insight:
      "Когато сме тревожни, умът естествено търси потенциални опасности.",
    invitation: "Колко често този сценарий действително се е случвал в миналото?",
    backImage: card("section-2-card-4.jpg"),
  },
  {
    id: "2-5",
    sectionId: 2,
    prompt: "Какво отлагаш заради тревожността?",
    insight:
      "Понякога отлагането намалява напрежението за кратко, но може да го увеличи по-късно.",
    invitation:
      "Коя е най-малката възможна стъпка, която можеш да направиш още днес?",
    backImage: card("section-2-card-5.jpg"),
  },
  {
    id: "2-6",
    sectionId: 2,
    prompt: "Колко трудно ти е да допуснеш грешка?",
    insight:
      "Страхът от грешки често увеличава напрежението и самокритиката.",
    invitation:
      "Какво би казал/а на близък човек, ако той направи същата грешка?",
    backImage: card("section-2-card-6.jpg"),
  },
  {
    id: "2-7",
    sectionId: 2,
    prompt: "Поемаш ли повече отговорност, отколкото реално ти принадлежи?",
    insight:
      "Свръхотговорността може да създаде усещане, че всичко зависи от теб.",
    invitation: "За какво носиш отговорност и за какво не?",
    backImage: card("section-2-card-7.jpg"),
  },
  {
    id: "2-8",
    sectionId: 2,
    prompt: "Какво се опитваш да контролираш в момента?",
    insight: "Контролът често е опит да намалим несигурността.",
    invitation: "Кое е в твоя контрол и кое не е?",
    backImage: card("section-2-card-8.jpg"),
  },
  {
    id: "3-1",
    sectionId: 3,
    prompt: "Страхуваш ли се повече от провал или от неодобрение?",
    insight:
      "Понякога тревожността е свързана не толкова със събитието, колкото с това как ще бъдем възприети.",
    invitation: "Кое от двете ти изглежда по-трудно за понасяне?",
    backImage: card("section-3-card-1.jpg"),
  },
  {
    id: "3-2",
    sectionId: 3,
    prompt: "Чий глас чуваш в себе си, когато се критикуваш?",
    insight:
      "Вътрешният критик често е свързан с послания, които сме чували многократно през живота си.",
    invitation: "На кого ти напомня този глас?",
    backImage: card("section-3-card-2.jpg"),
  },
  {
    id: "4-1",
    sectionId: 4,
    prompt:
      "Какво би избрал/а, ако тревожността не взимаше решенията вместо теб?",
    insight: "Понякога тревожността започва да определя поведението ни.",
    invitation: "Какво всъщност искаш ти?",
    backImage: card("section-4-card-1.jpg"),
  },
  {
    id: "4-2",
    sectionId: 4,
    prompt: "Коя е една малка крачка към живота, който искаш да живееш?",
    insight:
      "Промяната рядко се случва наведнъж. Тя често започва с малки и последователни действия.",
    invitation: "Коя е твоята следваща стъпка?",
    backImage: card("section-4-card-2.jpg"),
  },
  {
    id: "4-3",
    sectionId: 4,
    prompt: "Това факт ли е или предположение?",
    insight:
      "Когато сме тревожни, понякога е трудно да различим фактите от интерпретациите си.",
    invitation:
      "Кои части от ситуацията са сигурни факти и кои са твои предположения?",
    backImage: card("section-4-card-3.jpg"),
  },
  {
    id: "4-4",
    sectionId: 4,
    prompt: "Ако твой близък човек беше на твое място, какво би му казал/а?",
    insight:
      "Понякога сме много по-състрадателни към другите, отколкото към себе си.",
    invitation: "Какво би искал/а да чуеш от себе си точно сега?",
    backImage: card("section-4-card-4.jpg"),
  },
  {
    id: "4-5",
    sectionId: 4,
    prompt: "Какво е в твоя контрол точно сега?",
    insight: "Не всичко зависи от нас.",
    invitation: "Коя е следващата реалистична стъпка, която зависи от теб?",
    backImage: card("section-4-card-5.jpg"),
  },
  {
    id: "5-1",
    sectionId: 5,
    prompt: "Как си почиваш?",
    insight:
      "Почивката е важна част от възстановяването, а не награда, която трябва да заслужим.",
    invitation: "Какво ти помага истински да се възстановиш?",
    backImage: card("section-5-card-1.jpg"),
  },
  {
    id: "5-2",
    sectionId: 5,
    prompt: "Как поставяш граници?",
    insight: "Границите могат да бъдат форма на грижа към себе си.",
    invitation: "Къде в живота си имаш нужда от по-ясни граници?",
    backImage: card("section-5-card-2.jpg"),
  },
  {
    id: "6-1",
    sectionId: 6,
    prompt: "Направи едно малко действие",
    insight:
      "Когато сме тревожни, понякога дори малкото действие помага да възстановим усещането за посока.",
    invitation: "Коя е най-малката полезна стъпка, която можеш да направиш сега?",
    backImage: card("section-6-card-1.jpg"),
  },
];

export function getSectionMeta(sectionId: number) {
  return sections.find((s) => s.id === sectionId)!;
}

export function getSectionCover(sectionId: number) {
  return sectionCovers.find((c) => c.sectionId === sectionId)!;
}

export function cardsInSection(sectionId: number) {
  return deckCards.filter((c) => c.sectionId === sectionId);
}

export function pickRandomSectionId(exclude: number[] = []) {
  const ids = sectionCovers
    .map((c) => c.sectionId)
    .filter((id) => !exclude.includes(id));
  const pool = ids.length > 0 ? ids : sectionCovers.map((c) => c.sectionId);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickRandomCardInSection(
  sectionId: number,
  excludeIds: string[] = [],
) {
  const all = cardsInSection(sectionId);
  const available = all.filter((c) => !excludeIds.includes(c.id));
  const pool = available.length > 0 ? available : all;
  return pool[Math.floor(Math.random() * pool.length)];
}
