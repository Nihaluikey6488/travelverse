import { Injectable } from "@nestjs/common";
import type { RouteEstimateResponse } from "@travelverse/contracts";
import { env } from "../../config/env";

type CacheEntry = {
  expiresAt: number;
  value: RouteEstimateResponse;
};

@Injectable()
export class RoutingCacheService {
  private readonly cache = new Map<string, CacheEntry>();

  get(key: string): RouteEstimateResponse | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return {
      ...entry.value,
      cacheHit: true,
    };
  }

  set(key: string, value: RouteEstimateResponse): void {
    this.cache.set(key, {
      expiresAt: Date.now() + env.ROUTING_CACHE_TTL_SECONDS * 1000,
      value: {
        ...value,
        cacheHit: false,
      },
    });
  }
}
