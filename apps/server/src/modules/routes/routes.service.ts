import { Injectable } from "@nestjs/common";
import type {
  Coordinates,
  RouteEstimateRequest,
  RouteEstimateResponse,
  RouteTravelMode,
} from "@travelverse/contracts";
import { OsrmRoutingProvider } from "./osrm-routing.provider";
import { RoutingCacheService } from "./routing-cache.service";

const fallbackSpeedKmph: Record<RouteTravelMode, number> = {
  bike: 16,
  car: 48,
  walk: 4.8,
};

@Injectable()
export class RoutesService {
  constructor(
    private readonly osrmRoutingProvider: OsrmRoutingProvider,
    private readonly routingCacheService: RoutingCacheService,
  ) {}

  async estimate(request: RouteEstimateRequest): Promise<RouteEstimateResponse> {
    const cacheKey = this.toCacheKey(request);
    const cachedRoute = this.routingCacheService.get(cacheKey);

    if (cachedRoute) {
      return cachedRoute;
    }

    try {
      const liveRoute = await this.osrmRoutingProvider.estimate(request);
      this.routingCacheService.set(cacheKey, liveRoute);
      return liveRoute;
    } catch (error: unknown) {
      const fallbackRoute = this.createFallbackEstimate(request, error);
      this.routingCacheService.set(cacheKey, fallbackRoute);
      return fallbackRoute;
    }
  }

  private createFallbackEstimate(
    request: RouteEstimateRequest,
    error: unknown,
  ): RouteEstimateResponse {
    const directDistanceKm = getDistanceKm(request.origin, request.destination);
    const routeDistanceKm = roundTo(directDistanceKm * 1.25, 1);
    const durationMinutes = Math.max(
      1,
      Math.round((routeDistanceKm / fallbackSpeedKmph[request.mode]) * 60),
    );
    const reason = error instanceof Error ? error.message : "Routing provider unavailable";

    return {
      cacheHit: false,
      destination: request.destination,
      distanceKm: routeDistanceKm,
      durationMinutes,
      fetchedAt: new Date().toISOString(),
      geometry: [request.origin, request.destination],
      mode: request.mode,
      origin: request.origin,
      provider: "fallback-haversine",
      source: "ESTIMATED_FALLBACK",
      warnings: [`Live routing unavailable, showing estimated direct route. ${reason}`],
    };
  }

  private toCacheKey(request: RouteEstimateRequest): string {
    return [
      request.mode,
      request.origin.lat.toFixed(5),
      request.origin.lng.toFixed(5),
      request.destination.lat.toFixed(5),
      request.destination.lng.toFixed(5),
    ].join(":");
  }
}

function getDistanceKm(from: Coordinates, to: Coordinates): number {
  const earthRadiusKm = 6371;
  const latDistance = toRadians(to.lat - from.lat);
  const lngDistance = toRadians(to.lng - from.lng);
  const startLat = toRadians(from.lat);
  const endLat = toRadians(to.lat);
  const haversine =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDistance / 2) ** 2;
  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusKm * angularDistance;
}

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

function roundTo(value: number, digits: number): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}
