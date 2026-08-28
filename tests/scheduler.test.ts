import { describe, expect, it } from 'vitest';
import { formatDue, judgeAnswer, normalizeAnswer, schedule } from '../src/scheduler';

describe('typed answer judgment', () => {
  it('ignores case, accents, and punctuation', () => {
    expect(normalizeAnswer('  São-Paulo! ')).toBe('sao paulo');
    expect(judgeAnswer('SAO PAULO', 'São Paulo').correct).toBe(true);
  });

  it('accepts explicit alternatives separated by semicolons', () => {
    expect(judgeAnswer('H2O', 'water; H2O').correct).toBe(true);
  });

  it('accepts one small typo in a long answer but not a different short answer', () => {
    expect(judgeAnswer('photosythesis', 'photosynthesis')).toMatchObject({ correct: true, close: true });
    expect(judgeAnswer('Paris', 'Lima').correct).toBe(false);
  });
});

describe('transparent schedule', () => {
  const fresh = { stage: -1, retryCount: 0 };

  it('returns an unmatched answer in one minute with an explanation', () => {
    const result = schedule(fresh, false, 5_000, 1_000);
    expect(result.dueAt).toBe(61_000);
    expect(result.reason).toContain('didn’t match');
  });

  it('schedules a quick first match for one day', () => {
    const result = schedule(fresh, true, 5_000, 1_000);
    expect(result.intervalLabel).toBe('1 day');
    expect(result.reason).toContain('5 seconds');
  });

  it('uses a cautious eight-hour step after a retry', () => {
    const result = schedule({ stage: 0, retryCount: 1 }, true, 4_000, 1_000);
    expect(result.intervalLabel).toBe('8 hours');
    expect(result.reason).toContain('after 1 retry');
  });

  it('formats near and later due times plainly', () => {
    expect(formatDue(1_030, 1_000)).toBe('in under a minute');
    expect(formatDue(1_000 + 2 * 86_400_000, 1_000)).toBe('in 2 d');
  });
});
