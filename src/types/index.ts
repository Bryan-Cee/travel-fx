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
export type NumberFormatPreference = 'system' | 'comma-period' | 'period-comma' | 'space-comma';

export type PersistedState = {
  version: 3;
  sourceCurrency: string;
  defaultCurrency: string;
  targetCurrencies: string[];
  onboardingComplete: boolean;
  hapticsEnabled: boolean;
  themePreference: ThemePreference;
  numberFormat: NumberFormatPreference;
  customRates: CustomRate[];
  rateCache: RateCache | null;
};

export type ResolvedRate = {
  rate: number;
  sourceDate: string;
  isCustom: boolean;
};
