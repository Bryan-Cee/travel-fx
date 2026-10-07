import { CustomRate, RateCache, ResolvedRate } from '@/types';

export const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function isCacheFresh(cache: RateCache | null, now = Date.now()): boolean {
  if (!cache) return false;
  const fetchedAt = Date.parse(cache.fetchedAt);
  return Number.isFinite(fetchedAt) && now - fetchedAt < CACHE_MAX_AGE_MS;
}

function customForPair(base: string, quote: string, customRates: CustomRate[]): ResolvedRate | null {
  const direct = customRates.find(
    (custom) => custom.enabled && custom.base === base && custom.quote === quote,
  );
  if (direct) return { rate: direct.rate, sourceDate: direct.savedAt, isCustom: true };
  const inverse = customRates.find(
    (custom) => custom.enabled && custom.base === quote && custom.quote === base,
  );
  if (inverse) return { rate: 1 / inverse.rate, sourceDate: inverse.savedAt, isCustom: true };
  return null;
}

export function resolveRate(
  base: string,
  quote: string,
  cache: RateCache | null,
  customRates: CustomRate[],
): ResolvedRate | null {
  if (base === quote) {
    return { rate: 1, sourceDate: cache?.fetchedAt ?? new Date().toISOString(), isCustom: false };
  }
  const custom = customForPair(base, quote, customRates);
  if (custom) return custom;
  if (!cache) return null;
  const basePerUsd = base === cache.base ? 1 : cache.rates[base]?.rate;
  const quotePerUsd = quote === cache.base ? 1 : cache.rates[quote]?.rate;
  if (!basePerUsd || !quotePerUsd) return null;
  const dates = [
    base === cache.base ? null : cache.rates[base]?.sourceDate,
    quote === cache.base ? null : cache.rates[quote]?.sourceDate,
  ].filter((date): date is string => Boolean(date));
  return {
    rate: quotePerUsd / basePerUsd,
    sourceDate: dates.sort()[0] ?? cache.fetchedAt,
    isCustom: false,
  };
}

export function upsertCustomRate(customRates: CustomRate[], next: CustomRate): CustomRate[] {
  return [
    ...customRates.filter(
      (custom) =>
        !(
          (custom.base === next.base && custom.quote === next.quote) ||
          (custom.base === next.quote && custom.quote === next.base)
        ),
    ),
    next,
  ];
}
