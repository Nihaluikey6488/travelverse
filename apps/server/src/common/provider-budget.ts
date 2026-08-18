import { env } from "../config/env";

type ProviderCounter = {
  dayKey: string;
  used: number;
};

export class ProviderDailyLimitError extends Error {
  constructor(
    readonly provider: string,
    readonly limit: number,
    readonly resetAt: string,
  ) {
    super(
      `Daily provider quota reached for ${provider}. Limit ${limit} resets at ${resetAt}.`,
    );
  }
}

const counters = new Map<string, ProviderCounter>();

export function consumeProviderRequest(provider: string) {
  const limit = env.PROVIDER_DAILY_REQUEST_LIMIT;

  if (limit === 0) {
    return getProviderBudgetSnapshot(provider);
  }

  const normalizedProvider = normalizeProvider(provider);
  const counter = getCounter(normalizedProvider);

  if (counter.used >= limit) {
    throw new ProviderDailyLimitError(
      normalizedProvider,
      limit,
      getNextUtcMidnight().toISOString(),
    );
  }

  counter.used += 1;
  return getProviderBudgetSnapshot(normalizedProvider);
}

export function getProviderBudgetSnapshot(provider?: string) {
  const normalizedProvider = provider ? normalizeProvider(provider) : "all";
  const dayKey = getUtcDayKey();
  const used =
    normalizedProvider === "all"
      ? [...counters.values()]
          .filter((counter) => counter.dayKey === dayKey)
          .reduce((total, counter) => total + counter.used, 0)
      : getCounter(normalizedProvider).used;
  const limit = env.PROVIDER_DAILY_REQUEST_LIMIT;

  return {
    dailyLimit: limit,
    mode: limit === 0 ? "disabled" : "enforced",
    monthlyBudgetInr: env.PROVIDER_MONTHLY_BUDGET_INR,
    provider: normalizedProvider,
    remainingToday: limit === 0 ? null : Math.max(0, limit - used),
    resetAt: getNextUtcMidnight().toISOString(),
    usedToday: used,
  };
}

export function resetProviderBudgetForTests() {
  counters.clear();
}

function getCounter(provider: string): ProviderCounter {
  const dayKey = getUtcDayKey();
  const existing = counters.get(provider);

  if (existing?.dayKey === dayKey) {
    return existing;
  }

  const nextCounter = {
    dayKey,
    used: 0,
  };
  counters.set(provider, nextCounter);
  return nextCounter;
}

function normalizeProvider(provider: string) {
  return provider.trim().toLowerCase() || "unknown-provider";
}

function getUtcDayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getNextUtcMidnight() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  );
}
