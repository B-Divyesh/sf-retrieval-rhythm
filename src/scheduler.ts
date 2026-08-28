import type { Card, ScheduleResult } from './types';

const DAY = 86_400_000;
const QUICK_INTERVALS = [1, 3, 7, 14, 30, 60];
const CAREFUL_INTERVALS = [1 / 3, 1, 3, 7, 14, 30];

export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const old = row[j] ?? 0;
      row[j] = Math.min(
        (row[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      previous = old;
    }
  }
  return row[b.length] ?? 0;
}

export function judgeAnswer(typed: string, accepted: string): { correct: boolean; matched: string; close: boolean } {
  const attempt = normalizeAnswer(typed);
  const answers = accepted.split(';').map(normalizeAnswer).filter(Boolean);
  const matched = answers.find((answer) => answer === attempt);
  if (matched) return { correct: true, matched, close: false };
  const near = answers.find((answer) => {
    if (answer.length < 6 || attempt.length < 6) return false;
    return editDistance(answer, attempt) / Math.max(answer.length, attempt.length) <= 0.12;
  });
  return { correct: Boolean(near), matched: near ?? answers[0] ?? '', close: Boolean(near) };
}

function labelInterval(milliseconds: number): string {
  const minutes = Math.round(milliseconds / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.round(milliseconds / 3_600_000);
  if (hours < 24) return `${hours} hours`;
  const days = Math.round(milliseconds / DAY);
  return `${days} day${days === 1 ? '' : 's'}`;
}

export function schedule(card: Pick<Card, 'stage' | 'retryCount'>, correct: boolean, latencyMs: number, now = Date.now()): ScheduleResult {
  if (!correct) {
    const delay = 60_000;
    return {
      stage: Math.max(0, card.stage - 1),
      retryCount: card.retryCount + 1,
      dueAt: now + delay,
      intervalLabel: labelInterval(delay),
      reason: "Your typed answer didn’t match, so this returns in 1 minute. No confidence score needed."
    };
  }

  const wasRetry = card.retryCount > 0;
  const quick = latencyMs <= 12_000;
  const nextStage = Math.min(QUICK_INTERVALS.length - 1, card.stage + 1);
  const days = wasRetry ? 1 / 3 : (quick ? QUICK_INTERVALS : CAREFUL_INTERVALS)[nextStage] ?? 30;
  const interval = Math.round(days * DAY);
  let reason = `Matched in ${Math.max(1, Math.round(latencyMs / 1000))} seconds, so the interval grows to ${labelInterval(interval)}.`;
  if (wasRetry) reason = `Matched after ${card.retryCount} ${card.retryCount === 1 ? 'retry' : 'retries'}, so it returns in 8 hours before growing again.`;
  else if (!quick) reason = `Matched after a little thought, so it returns in ${labelInterval(interval)} for a steadier step.`;
  return {
    stage: nextStage,
    retryCount: 0,
    dueAt: now + interval,
    intervalLabel: labelInterval(interval),
    reason
  };
}

export function formatDue(timestamp: number, now = Date.now()): string {
  const difference = timestamp - now;
  if (difference <= 0) return 'due now';
  if (difference < 60_000) return 'in under a minute';
  if (difference < 3_600_000) return `in ${Math.ceil(difference / 60_000)} min`;
  if (difference < DAY) return `in ${Math.ceil(difference / 3_600_000)} hr`;
  return `in ${Math.ceil(difference / DAY)} d`;
}
