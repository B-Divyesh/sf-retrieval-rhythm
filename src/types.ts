export interface Collection {
  id: string;
  name: string;
  createdAt: number;
}

export interface Card {
  id: string;
  collectionId: string;
  prompt: string;
  answer: string;
  createdAt: number;
  updatedAt: number;
  dueAt: number;
  stage: number;
  retryCount: number;
  totalCorrect: number;
  totalReviews: number;
  lastResult?: 'correct' | 'retry';
  lastLatencyMs?: number;
  lastReviewedAt?: number;
  dueReason: string;
}

export interface Review {
  id: string;
  cardId: string;
  collectionId: string;
  timestamp: number;
  typed: string;
  correct: boolean;
  latencyMs: number;
  retry: number;
  previousStage: number;
  nextDue: number;
}

export interface ScheduleResult {
  stage: number;
  retryCount: number;
  dueAt: number;
  reason: string;
  intervalLabel: string;
}
