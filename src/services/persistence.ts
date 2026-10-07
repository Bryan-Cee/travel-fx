import AsyncStorage from '@react-native-async-storage/async-storage';

import { CustomRate, PersistedState, RateCache, ThemePreference } from '@/types';

export const STORAGE_KEY = '@travel-fx/state';
export const defaultPersistedState: PersistedState = {
  version: 2,
  sourceCurrency: 'USD',
  targetCurrencies: [],
  onboardingComplete: false,
  hapticsEnabled: true,
  themePreference: 'system',
  customRates: [],
  rateCache: null,
};

export type LoadResult = { state: PersistedState; issue: string | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isCurrencyCode(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z]{3}$/.test(value);
}
function isTheme(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}
function parseCustomRates(value: unknown): CustomRate[] | null {
  if (!Array.isArray(value)) return null;
  const parsed: CustomRate[] = [];
  for (const item of value) {
    if (
      !isRecord(item) || !isCurrencyCode(item.base) || !isCurrencyCode(item.quote) ||
      typeof item.rate !== 'number' || !Number.isFinite(item.rate) || item.rate <= 0 ||
      typeof item.savedAt !== 'string' || !Number.isFinite(Date.parse(item.savedAt)) ||
      typeof item.enabled !== 'boolean'
    ) return null;
    parsed.push({ base: item.base, quote: item.quote, rate: item.rate, savedAt: item.savedAt, enabled: item.enabled });
  }
  return parsed;
}
function parseRateCache(value: unknown): RateCache | null | undefined {
  if (value === null) return null;
  if (
    !isRecord(value) || value.base !== 'USD' || typeof value.fetchedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.fetchedAt)) || !isRecord(value.rates)
  ) {
    return undefined;
  }
  const rates: RateCache['rates'] = {};
  for (const [code, item] of Object.entries(value.rates)) {
    if (
      !isCurrencyCode(code) || !isRecord(item) || item.base !== 'USD' || item.quote !== code ||
      typeof item.rate !== 'number' || !Number.isFinite(item.rate) || item.rate <= 0 ||
      typeof item.sourceDate !== 'string' || !Number.isFinite(Date.parse(item.sourceDate))
    ) return undefined;
    rates[code] = { base: 'USD', quote: code, rate: item.rate, sourceDate: item.sourceDate };
  }
  return { base: 'USD', fetchedAt: value.fetchedAt, rates };
}

export function migrateAndValidate(value: unknown): LoadResult {
  if (!isRecord(value)) return { state: defaultPersistedState, issue: 'Saved data was unreadable and has been reset.' };
  const version = value.version;
  const migrated = version === 1
    ? { ...value, version: 2, themePreference: 'system', customRates: value.customRates ?? [] }
    : value;
  const customRates = parseCustomRates(migrated.customRates);
  const rateCache = parseRateCache(migrated.rateCache);
  if (
    migrated.version !== 2 || !isCurrencyCode(migrated.sourceCurrency) ||
    !Array.isArray(migrated.targetCurrencies) || !migrated.targetCurrencies.every(isCurrencyCode) ||
    typeof migrated.onboardingComplete !== 'boolean' || typeof migrated.hapticsEnabled !== 'boolean' ||
    !isTheme(migrated.themePreference) || customRates === null || rateCache === undefined
  ) return { state: defaultPersistedState, issue: 'Saved data failed validation and has been reset.' };
  return {
    state: {
      version: 2,
      sourceCurrency: migrated.sourceCurrency,
      targetCurrencies: [...new Set(migrated.targetCurrencies)].filter((code) => code !== migrated.sourceCurrency),
      onboardingComplete: migrated.onboardingComplete,
      hapticsEnabled: migrated.hapticsEnabled,
      themePreference: migrated.themePreference,
      customRates,
      rateCache,
    },
    issue: version === 1 ? 'Saved data was upgraded to the latest format.' : null,
  };
}

export async function loadPersistedState(): Promise<LoadResult> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return { state: defaultPersistedState, issue: null };
  try {
    return migrateAndValidate(JSON.parse(raw) as unknown);
  } catch {
    return { state: defaultPersistedState, issue: 'Saved data was corrupted and has been reset.' };
  }
}
export async function savePersistedState(state: PersistedState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
export async function resetPersistedState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
