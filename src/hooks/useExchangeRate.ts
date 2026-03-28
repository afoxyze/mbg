import { useEffect, useState } from "react";

const FALLBACK_RATE = 16500;
const API_URL = "https://open.er-api.com/v6/latest/USD";
const TIMEOUT_MS = 5000;
const STORAGE_KEY = "mbg-usd-idr";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface ExchangeRateState {
  readonly rate: number;
  readonly isLive: boolean;
}

// Module-level cache — fetched once per page load, shared across all hook instances
let cached: ExchangeRateState | null = null;

interface ExchangeRateApiResponse {
  readonly result: string;
  readonly rates: Record<string, number>;
}

interface StoredRate {
  readonly rate: number;
  readonly timestamp: number;
}

function loadFromStorage(): ExchangeRateState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;

    const stored = JSON.parse(raw) as StoredRate;
    if (typeof stored.rate !== "number" || typeof stored.timestamp !== "number") return null;

    // Expired — discard
    if (Date.now() - stored.timestamp > TTL_MS) return null;

    return { rate: stored.rate, isLive: true };
  } catch {
    return null;
  }
}

function saveToStorage(rate: number): void {
  try {
    const data: StoredRate = { rate, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silent fail
  }
}

async function fetchUsdIdr(): Promise<ExchangeRateState> {
  if (cached !== null) return cached;

  // Check localStorage cache first
  const stored = loadFromStorage();
  if (stored !== null) {
    cached = stored;
    return cached;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(API_URL, { signal: controller.signal });

    if (!response.ok) {
      cached = { rate: FALLBACK_RATE, isLive: false };
      return cached;
    }

    const data = (await response.json()) as ExchangeRateApiResponse;

    const idrRate = data.rates["IDR"];
    if (data.result !== "success" || typeof idrRate !== "number") {
      cached = { rate: FALLBACK_RATE, isLive: false };
      return cached;
    }

    cached = { rate: idrRate, isLive: true };
    saveToStorage(idrRate);
    return cached;
  } catch {
    // Covers both AbortError (timeout) and network errors
    cached = { rate: FALLBACK_RATE, isLive: false };
    return cached;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function useExchangeRate(): ExchangeRateState {
  const [state, setState] = useState<ExchangeRateState>(() => {
    // If already cached from a previous hook instance, use it immediately
    if (cached !== null) return cached;
    return { rate: FALLBACK_RATE, isLive: false };
  });

  useEffect(() => {
    // If we already had a cache hit in useState initializer, skip the fetch
    if (cached !== null && state.rate === cached.rate && state.isLive === cached.isLive) {
      return;
    }

    let cancelled = false;

    fetchUsdIdr().then((result) => {
      if (!cancelled) setState(result);
    });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
