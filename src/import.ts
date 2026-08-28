import type { Card, Collection, Review } from './types';

export interface ImportPayload {
  version: 1;
  collections: Collection[];
  cards: Card[];
  reviews: Review[];
}

const isNonEmptyString = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  return value.trim().length > 0;
};
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
};

function uniqueIds(items: { id: unknown }[], label: string): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    if (!isNonEmptyString(item.id)) throw new Error(`Every ${label} needs an ID.`);
    if (ids.has(item.id)) throw new Error(`This backup contains duplicate ${label} IDs.`);
    ids.add(item.id);
  }
  return ids;
}

function validCollection(value: unknown): value is Collection {
  if (!value || typeof value !== 'object') return false;
  const collection = value as Partial<Collection>;
  return isNonEmptyString(collection.id) && isNonEmptyString(collection.name) && isFiniteNumber(collection.createdAt);
}

function validCard(value: unknown): value is Card {
  if (!value || typeof value !== 'object') return false;
  const card = value as Partial<Card>;
  return isNonEmptyString(card.id)
    && isNonEmptyString(card.collectionId)
    && isNonEmptyString(card.prompt)
    && isNonEmptyString(card.answer)
    && isFiniteNumber(card.createdAt)
    && isFiniteNumber(card.updatedAt)
    && isFiniteNumber(card.dueAt)
    && Number.isInteger(card.stage)
    && isNonNegativeInteger(card.retryCount)
    && isNonNegativeInteger(card.totalCorrect)
    && isNonNegativeInteger(card.totalReviews)
    && isNonEmptyString(card.dueReason)
    && (card.lastResult === undefined || card.lastResult === 'correct' || card.lastResult === 'retry')
    && (card.lastLatencyMs === undefined || isNonNegativeInteger(card.lastLatencyMs))
    && (card.lastReviewedAt === undefined || isFiniteNumber(card.lastReviewedAt));
}

function validReview(value: unknown): value is Review {
  if (!value || typeof value !== 'object') return false;
  const review = value as Partial<Review>;
  return isNonEmptyString(review.id)
    && isNonEmptyString(review.cardId)
    && isNonEmptyString(review.collectionId)
    && isFiniteNumber(review.timestamp)
    && typeof review.typed === 'string'
    && typeof review.correct === 'boolean'
    && isNonNegativeInteger(review.latencyMs)
    && isNonNegativeInteger(review.retry)
    && Number.isInteger(review.previousStage)
    && isFiniteNumber(review.nextDue);
}

/**
 * Accept only complete v1 backups. This intentionally runs before the import
 * confirmation and any IndexedDB writes so a malformed file cannot replace
 * usable local facts.
 */
export function validateImportPayload(value: unknown): ImportPayload {
  if (!value || typeof value !== 'object') throw new Error('That file is not a Retrieval Rhythm backup.');
  const payload = value as Partial<ImportPayload>;
  if (payload.version !== 1 || !Array.isArray(payload.collections) || !payload.collections.length || !Array.isArray(payload.cards)) {
    throw new Error('That file is not a compatible Retrieval Rhythm backup.');
  }
  if (payload.reviews !== undefined && !Array.isArray(payload.reviews)) throw new Error('The review history is not valid.');
  const reviews = payload.reviews ?? [];
  if (!payload.collections.every(validCollection)) throw new Error('Some collections are missing required fields.');
  if (!payload.cards.every(validCard)) throw new Error('Some facts are missing required fields.');
  if (!reviews.every(validReview)) throw new Error('Some review events are missing required fields.');

  const collectionIds = uniqueIds(payload.collections, 'collection');
  const cardIds = uniqueIds(payload.cards, 'fact');
  uniqueIds(reviews, 'review');

  for (const card of payload.cards) {
    if (!collectionIds.has(card.collectionId)) throw new Error('A fact refers to a collection that is not in this backup.');
  }
  for (const review of reviews) {
    if (!collectionIds.has(review.collectionId)) throw new Error('A review refers to a collection that is not in this backup.');
    if (!cardIds.has(review.cardId)) throw new Error('A review refers to a fact that is not in this backup.');
    const card = payload.cards.find((item) => item.id === review.cardId);
    if (card?.collectionId !== review.collectionId) throw new Error('A review does not belong to its fact’s collection.');
  }

  return { version: 1, collections: payload.collections, cards: payload.cards, reviews };
}
