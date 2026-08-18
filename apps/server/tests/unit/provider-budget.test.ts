import { afterEach, describe, expect, it } from "vitest";
import {
  ProviderDailyLimitError,
  consumeProviderRequest,
  getProviderBudgetSnapshot,
  resetProviderBudgetForTests,
} from "../../src/common/provider-budget";
import { env } from "../../src/config/env";

describe("provider budget guardrails", () => {
  const previousLimit = env.PROVIDER_DAILY_REQUEST_LIMIT;

  afterEach(() => {
    env.PROVIDER_DAILY_REQUEST_LIMIT = previousLimit;
    resetProviderBudgetForTests();
  });

  it("tracks provider usage and blocks calls after the daily limit", () => {
    env.PROVIDER_DAILY_REQUEST_LIMIT = 2;
    resetProviderBudgetForTests();

    consumeProviderRequest("nominatim.openstreetmap.org");
    const secondSnapshot = consumeProviderRequest("nominatim.openstreetmap.org");

    expect(secondSnapshot).toEqual(
      expect.objectContaining({
        dailyLimit: 2,
        provider: "nominatim.openstreetmap.org",
        remainingToday: 0,
        usedToday: 2,
      }),
    );
    expect(() => consumeProviderRequest("nominatim.openstreetmap.org")).toThrow(
      ProviderDailyLimitError,
    );
  });

  it("can report aggregate provider budget status for health checks", () => {
    env.PROVIDER_DAILY_REQUEST_LIMIT = 5;
    resetProviderBudgetForTests();

    consumeProviderRequest("router.project-osrm.org");
    consumeProviderRequest("en.wikipedia.org");

    expect(getProviderBudgetSnapshot()).toEqual(
      expect.objectContaining({
        dailyLimit: 5,
        provider: "all",
        remainingToday: 3,
        usedToday: 2,
      }),
    );
  });
});
