import { describe, expect, it } from 'vitest';
import { validateImportPayload } from '../src/import';

const validBackup = {
  version: 1,
  collections: [{ id: 'science', name: 'Science', createdAt: 1 }],
  cards: [{
    id: 'water', collectionId: 'science', prompt: 'Formula for water?', answer: 'H2O',
    createdAt: 1, updatedAt: 1, dueAt: 1, stage: -1, retryCount: 0,
    totalCorrect: 0, totalReviews: 0, dueReason: 'New fact—ready for its first recall.'
  }],
  reviews: [{
    id: 'review-1', cardId: 'water', collectionId: 'science', timestamp: 2, typed: 'H2O',
    correct: true, latencyMs: 900, retry: 0, previousStage: -1, nextDue: 3
  }]
};

describe('backup import validation', () => {
  it('accepts a complete v1 backup with connected facts and review history', () => {
    expect(validateImportPayload(validBackup)).toEqual(validBackup);
  });

  it('rejects an orphan fact before any destructive import can be confirmed', () => {
    const orphan = structuredClone(validBackup);
    orphan.cards[0]!.collectionId = 'missing';
    expect(() => validateImportPayload(orphan)).toThrow('A fact refers to a collection that is not in this backup.');
  });

  it('rejects a review that does not match its fact collection', () => {
    const invalidReview = structuredClone(validBackup);
    invalidReview.collections.push({ id: 'elsewhere', name: 'Elsewhere', createdAt: 1 });
    invalidReview.reviews[0]!.collectionId = 'elsewhere';
    expect(() => validateImportPayload(invalidReview)).toThrow('A review does not belong to its fact’s collection.');
  });
});
