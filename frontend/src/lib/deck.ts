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

/**
 * Само качените от клиента примери.
 * Раздели 1, 2 и 4 — по корица + 1 карта.
 */
export const sectionCovers: SectionCover[] = [
  { sectionId: 1, frontImage: "/images/cards/section-1-front.jpg" },
  { sectionId: 2, frontImage: "/images/cards/section-2-front.jpg" },
  { sectionId: 4, frontImage: "/images/cards/section-4-front.jpg" },
];

export const deckCards: DeckCard[] = [
  {
    id: "1-1",
    sectionId: 1,
    prompt:
      "Ако тревожността можеше да говори, какво би искала да ти каже?",
    insight:
      "Вместо да бъде само източник на дискомфорт, тревожността понякога може да носи важна информация за нашите нужди, страхове или вътрешни конфликти.",
    invitation:
      "Покана за наблюдение: Каква нужда, страх или послание е възможно да се опитва да ти покаже?",
    backImage: "/images/cards/section-1-card-1.jpg",
  },
  {
    id: "2-1",
    sectionId: 2,
    prompt: "Колко често се сравняваш с другите?",
    insight:
      "Сравненията могат да засилят чувството за недостатъчност и напрежение.",
    invitation:
      "Покана за наблюдение: Какво се случва с теб след подобни сравнения?",
    backImage: "/images/cards/section-2-card-1.jpg",
  },
  {
    id: "4-1",
    sectionId: 4,
    prompt:
      "Какво би избрал/а, ако тревожността не взимаше решенията вместо теб?",
    insight: "Понякога тревожността започва да определя поведението ни.",
    invitation: "Покана за наблюдение: Какво всъщност искаш ти?",
    backImage: "/images/cards/section-4-card-1.jpg",
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
