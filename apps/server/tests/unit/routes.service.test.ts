import type { RouteEstimateRequest } from "@travelverse/contracts";
import { describe, expect, it, vi } from "vitest";
import type { OsrmRoutingProvider } from "../../src/modules/routes/osrm-routing.provider";
import { RoutesService } from "../../src/modules/routes/routes.service";
import type { RoutingCacheService } from "../../src/modules/routes/routing-cache.service";

const request: RouteEstimateRequest = {
  destination: {
    lat: 26.9124,
    lng: 75.7873,
  },
  mode: "car",
  origin: {
    lat: 28.6139,
    lng: 77.209,
  },
};

function makeCache() {
  const storage = new Map<string, unknown>();

  return {
    get: vi.fn((key: string) => storage.get(key)),
    set: vi.fn((key: string, value: unknown) => storage.set(key, value)),
  } as unknown as RoutingCacheService;
}

describe("RoutesService", () => {
  it("normalizes and caches live routing provider responses", async () => {
    const provider = {
      estimate: vi.fn().mockResolvedValue({
        cacheHit: false,
        destination: request.destination,
        distanceKm: 280.2,
        durationMinutes: 310,
        fetchedAt: "2026-08-12T00:00:00.000Z",
        geometry: [request.origin, request.destination],
        mode: "car",
        origin: request.origin,
        provider: "osrm",
        source: "LIVE_PROVIDER",
        warnings: [],
      }),
    } as unknown as OsrmRoutingProvider;
    const cache = makeCache();
    const service = new RoutesService(provider, cache);

    const response = await service.estimate(request);

    expect(response.provider).toBe("osrm");
    expect(response.distanceKm).toBe(280.2);
    expect(cache.set).toHaveBeenCalledOnce();
  });

  it("returns an estimated fallback when the provider fails", async () => {
    const provider = {
      estimate: vi.fn().mockRejectedValue(new Error("network down")),
    } as unknown as OsrmRoutingProvider;
    const service = new RoutesService(provider, makeCache());

    const response = await service.estimate(request);

    expect(response.source).toBe("ESTIMATED_FALLBACK");
    expect(response.distanceKm).toBeGreaterThan(0);
    expect(response.durationMinutes).toBeGreaterThan(0);
    expect(response.warnings[0]).toContain("network down");
  });
});
