import { Injectable } from "@nestjs/common";

type CacheEntry<TValue> = {
  expiresAt: number;
  value: TValue;
};

@Injectable()
export class ProviderCacheService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  async getOrSet<TValue>(
    key: string,
    ttlMs: number,
    factory: () => Promise<TValue>,
  ): Promise<TValue> {
    const cached = this.cache.get(key) as CacheEntry<TValue> | undefined;

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const value = await factory();
    this.cache.set(key, {
      expiresAt: Date.now() + ttlMs,
      value,
    });

    return value;
  }
}
