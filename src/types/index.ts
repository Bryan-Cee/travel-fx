export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export type ProviderRate = {
  base: string;
  quote: string;
  rate: number;
  sourceDate: string;
};

export type RateCache = {
  base: 'USD';
  fetchedAt: string;
  rates: Record<string, ProviderRate>;
};

export type CustomRate = {
  base: string;
  quote: string;
  rate: number;
  savedAt: string;
  enabled: boolean;
};

export type ThemePreference = 'system' | 'light' | 'dark';

export type PersistedState = {
  version: 2;
  sourceCurrency: string;
  targetCurrencies: string[];
  onboardingComplete: boolean;
  hapticsEnabled: boolean;
  themePreference: ThemePreference;
  customRates: CustomRate[];
  rateCache: RateCache | null;
};

export type ResolvedRate = {
  rate: number;
  sourceDate: string;
  isCustom: boolean;
};
