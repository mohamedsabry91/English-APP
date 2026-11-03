// Spaced review (Leitner boxes). Pure functions: the current date is always passed in.
import { addDays } from './dates';
import type { LocalDate, ReviewCard, TagId } from './types';

/** Gap in days after reaching each box (box 1 to 5). */
export const BOX_GAPS = [1, 3, 7, 14, 30] as const;
export const MAX_BOX = BOX_GAPS.length;
export const DAILY_REVIEW_LIMIT = 5;

function gap(box: number): number {
  return BOX_GAPS[Math.min(Math.max(box, 1), MAX_BOX) - 1] as number;
}

/** A wrong answer: create the card, or send it back to box 1. */
export function recordWrong(card: ReviewCard | undefined, id: string, tags: TagId[], today: LocalDate): ReviewCard {
  return {
    id,
    tags: card ? Array.from(new Set([...card.tags, ...tags])) : [...tags],
    box: 1,
    due: addDays(today, gap(1)),
    lastAnswered: today,
    mistakes: (card?.mistakes ?? 0) + 1,
    learned: false,
    created: card?.created ?? today,
  };
}

/** A right answer on a review: move up one box, or mark learned after the last box. */
export function recordRight(card: ReviewCard, today: LocalDate): ReviewCard {
  if (card.box >= MAX_BOX) return { ...card, learned: true, lastAnswered: today };
  const box = card.box + 1;
  return { ...card, box, due: addDays(today, gap(box)), lastAnswered: today };
}

/**
 * Cards to review today: not learned, due on or before today, not already answered today.
 * Oldest due first, at most `limit`. Cards not shown simply wait; nothing piles up.
 */
export function dueCards(cards: Record<string, ReviewCard> | ReviewCard[], today: LocalDate, limit = DAILY_REVIEW_LIMIT): ReviewCard[] {
  const list = Array.isArray(cards) ? cards : Object.values(cards);
  return list
    .filter((c) => !c.learned && c.due <= today && c.lastAnswered !== today)
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.created < b.created ? -1 : a.created > b.created ? 1 : a.id < b.id ? -1 : 1))
    .slice(0, limit);
}

export function countDue(cards: Record<string, ReviewCard>, today: LocalDate): number {
  return dueCards(cards, today, Infinity).length;
}

/**
 * A learn-card for something new, such as a work phrase: it starts in box 1 and is due tomorrow.
 * It is not a mistake, so the mistake count stays 0. An existing card is left as it is.
 */
export function recordLearn(card: ReviewCard | undefined, id: string, tags: TagId[], today: LocalDate): ReviewCard {
  if (card) return card;
  return { id, tags: [...tags], box: 1, due: addDays(today, gap(1)), lastAnswered: today, mistakes: 0, learned: false, created: today };
}

/** Whether a card can be answered today with a real effect on its box (due, and not already answered today). */
export function isDue(card: ReviewCard, today: LocalDate): boolean {
  return !card.learned && card.due <= today && card.lastAnswered !== today;
}
