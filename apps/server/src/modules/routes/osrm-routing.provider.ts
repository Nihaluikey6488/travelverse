import { Injectable } from "@nestjs/common";
import type {
  Coordinates,
  RouteEstimateRequest,
  RouteEstimateResponse,
  RouteTravelMode,
} from "@travelverse/contracts";
import { env } from "../../config/env";
import type { RoutingProvider } from "./routing-provider.interface";

type OsrmRouteResponse = {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: {
      coordinates: Array<[number, number]>;
      type: "LineString";
    };
  }>;
};

const osrmProfiles: Record<RouteTravelMode, string> = {
  bike: "cycling",
  car: "driving",
  walk: "walking",
};

@Injectable()
export class OsrmRoutingProvider implements RoutingProvider {
  async estimate(request: RouteEstimateRequest): Promise<RouteEstimateResponse> {
    const url = this.buildUrl(request);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.ROUTING_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": env.INGESTION_USER_AGENT,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OSRM returned HTTP ${response.status}`);
      }

      const payload = (await response.json()) as OsrmRouteResponse;
      const route = payload.routes?.[0];

      if (payload.code !== "Ok" || !route) {
        throw new Error(payload.message ?? `OSRM route failed with code ${payload.code}`);
      }

      return {
        cacheHit: false,
        destination: request.destination,
        distanceKm: roundTo(route.distance / 1000, 1),
        durationMinutes: Math.max(1, Math.round(route.duration / 60)),
        fetchedAt: new Date().toISOString(),
        geometry: this.toGeometry(route.geometry?.coordinates, request),
        mode: request.mode,
        origin: request.origin,
        provider: "osrm",
        source: "LIVE_PROVIDER",
        warnings: [],
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(request: RouteEstimateRequest): URL {
    const baseUrl = env.OSRM_BASE_URL.replace(/\/$/, "");
    const profile = osrmProfiles[request.mode];
    const coordinates = [
      this.toOsrmCoordinate(request.origin),
      this.toOsrmCoordinate(request.destination),
    ].join(";");
    const url = new URL(`${baseUrl}/route/v1/${profile}/${coordinates}`);

    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");
    url.searchParams.set("steps", "false");

    return url;
  }

  private toOsrmCoordinate(coordinates: Coordinates): string {
    return `${coordinates.lng},${coordinates.lat}`;
  }

  private toGeometry(
    coordinates: Array<[number, number]> | undefined,
    request: RouteEstimateRequest,
  ): Coordinates[] {
    if (!coordinates || coordinates.length < 2) {
      return [request.origin, request.destination];
    }

    return coordinates.map(([lng, lat]) => ({
      lat,
      lng,
    }));
  }
}

function roundTo(value: number, digits: number): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}
