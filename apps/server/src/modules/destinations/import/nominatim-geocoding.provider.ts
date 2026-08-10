import { Injectable } from "@nestjs/common";
import type { DestinationImportCandidate } from "@travelverse/contracts";
import { env } from "../../../config/env";
import { ExternalHttpService } from "./external-http.service";
import { ProviderCacheService } from "./provider-cache.service";

type NominatimAddress = {
  city?: string;
  country?: string;
  county?: string;
  state?: string;
  town?: string;
  village?: string;
};

type NominatimResult = {
  address?: NominatimAddress;
  category?: string;
  display_name: string;
  extratags?: {
    wikidata?: string;
    wikipedia?: string;
  };
  importance?: number;
  lat: string;
  lon: string;
  name?: string;
  namedetails?: Record<string, string | undefined>;
  osm_id?: number;
  osm_type?: string;
  place_id: number;
  type?: string;
};

@Injectable()
export class NominatimGeocodingProvider {
  private lastRequestAt = 0;

  constructor(
    private readonly cache: ProviderCacheService,
    private readonly http: ExternalHttpService,
  ) {}

  async search(query: string, limit: number): Promise<DestinationImportCandidate[]> {
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `nominatim:search:${normalizedQuery}:${limit}`;

    return this.cache.getOrSet(cacheKey, env.INGESTION_CACHE_TTL_SECONDS * 1000, async () => {
      await this.respectUsagePolicy();

      const url = new URL("/search", env.NOMINATIM_BASE_URL);
      url.searchParams.set("q", query);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("extratags", "1");
      url.searchParams.set("namedetails", "1");
      url.searchParams.set("limit", String(limit));

      const results = await this.http.getJson<NominatimResult[]>(url);
      return results.map((result) => this.toCandidate(result));
    });
  }

  private async respectUsagePolicy() {
    const elapsed = Date.now() - this.lastRequestAt;
    const waitMs = Math.max(0, 1100 - elapsed);

    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    this.lastRequestAt = Date.now();
  }

  private toCandidate(result: NominatimResult): DestinationImportCandidate {
    const address = result.address ?? {};
    const name =
      result.namedetails?.["name:en"] ??
      result.namedetails?.name ??
      result.name ??
      result.display_name.split(",")[0]?.trim() ??
      "Imported destination";
    const category = [result.category, result.type].filter(Boolean).join(" / ") || undefined;

    return {
      category,
      coordinates: {
        lat: Number(result.lat),
        lng: Number(result.lon),
      },
      country: address.country,
      displayName: result.display_name,
      externalId: `nominatim:${result.place_id}`,
      importance: result.importance,
      name,
      provider: "nominatim",
      region: address.state ?? address.county ?? address.city ?? address.town ?? address.village,
      sourceUrl: this.getOsmSourceUrl(result),
      wikidataId: result.extratags?.wikidata,
      wikipediaTitle: this.getWikipediaTitle(result.extratags?.wikipedia),
    };
  }

  private getOsmSourceUrl(result: NominatimResult) {
    const osmType = this.normalizeOsmType(result.osm_type);

    if (osmType && result.osm_id) {
      return `https://www.openstreetmap.org/${osmType}/${result.osm_id}`;
    }

    const url = new URL("/search", env.NOMINATIM_BASE_URL);
    url.searchParams.set("q", result.display_name);
    return url.toString();
  }

  private normalizeOsmType(osmType?: string) {
    if (!osmType) {
      return undefined;
    }

    const normalized = osmType.toLowerCase();

    if (normalized === "r") {
      return "relation";
    }

    if (normalized === "w") {
      return "way";
    }

    if (normalized === "n") {
      return "node";
    }

    return normalized;
  }

  private getWikipediaTitle(wikipediaTag?: string) {
    if (!wikipediaTag) {
      return undefined;
    }

    const [, title] = wikipediaTag.split(":");
    return title?.replaceAll("_", " ");
  }
}
