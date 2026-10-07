import { CACHE_MAX_AGE_MS, isCacheFresh, resolveRate, upsertCustomRate } from '../rates';
import { CustomRate, RateCache } from '@/types';

const now = Date.parse('2026-10-07T12:00:00.000Z');
const cache: RateCache = {
  base: 'USD',
  fetchedAt: new Date(now - 1_000).toISOString(),
  rates: {
    EUR: { base: 'USD', quote: 'EUR', rate: 0.8, sourceDate: '2026-10-07' },
    JPY: { base: 'USD', quote: 'JPY', rate: 160, sourceDate: '2026-10-06' },
  },
};

describe('rate resolution', () => {
  it('derives cross rates and uses the oldest contributing source date', () => {
    expect(resolveRate('EUR', 'JPY', cache, [])).toEqual({
      rate: 200,
      sourceDate: '2026-10-06',
      isCustom: false,
    });
  });

  it('applies pair custom rates in both directions', () => {
    const custom: CustomRate = {
      base: 'EUR',
      quote: 'JPY',
      rate: 175,
      savedAt: '2026-10-07T10:00:00.000Z',
      enabled: true,
    };
    expect(resolveRate('EUR', 'JPY', cache, [custom])?.rate).toBe(175);
    expect(resolveRate('JPY', 'EUR', cache, [custom])?.rate).toBeCloseTo(1 / 175);
  });

  it('replaces either orientation of an existing pair override', () => {
    const old: CustomRate = { base: 'JPY', quote: 'EUR', rate: 0.01, savedAt: 'old', enabled: false };
    const next: CustomRate = { base: 'EUR', quote: 'JPY', rate: 175, savedAt: 'new', enabled: true };
    expect(upsertCustomRate([old], next)).toEqual([next]);
  });
});

describe('cache freshness', () => {
  it('is fresh before twelve hours and stale at the boundary', () => {
    expect(isCacheFresh(cache, now)).toBe(true);
    expect(isCacheFresh({ ...cache, fetchedAt: new Date(now - CACHE_MAX_AGE_MS).toISOString() }, now)).toBe(false);
  });

  it('treats invalid timestamps as stale', () => {
    expect(isCacheFresh({ ...cache, fetchedAt: 'invalid' }, now)).toBe(false);
  });
});
