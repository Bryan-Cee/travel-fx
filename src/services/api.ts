import { Currency, RateCache } from '@/types';

const API = 'https://api.frankfurter.dev/v2';

type ApiCurrency = { iso_code: string; name: string; symbol: string };
type ApiRate = { date: string; base: string; quote: string; rate: number };

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API}${path}`, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body: unknown = await response.json();
      if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') {
        detail = body.message;
      }
    } catch {
      // The status code remains actionable when the error body is not JSON.
    }
    throw new Error(`Frankfurter request failed (${response.status}): ${detail}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchCurrencies(signal?: AbortSignal): Promise<Currency[]> {
  const rows = await requestJson<ApiCurrency[]>('/currencies', signal);
  return rows
    .filter((row) => /^[A-Z]{3}$/.test(row.iso_code))
    .map((row) => ({ code: row.iso_code, name: row.name, symbol: row.symbol }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export async function fetchLatestRates(signal?: AbortSignal): Promise<RateCache> {
  const rows = await requestJson<ApiRate[]>('/rates?base=USD', signal);
  const rates: RateCache['rates'] = {};
  for (const row of rows) {
    if (row.base === 'USD' && /^[A-Z]{3}$/.test(row.quote) && Number.isFinite(row.rate) && row.rate > 0) {
      rates[row.quote] = { base: 'USD', quote: row.quote, rate: row.rate, sourceDate: row.date };
    }
  }
  if (Object.keys(rates).length === 0) throw new Error('Frankfurter returned no usable current rates');
  return { base: 'USD', fetchedAt: new Date().toISOString(), rates };
}
