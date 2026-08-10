import { Injectable } from "@nestjs/common";
import type { DestinationImportCandidate } from "@travelverse/contracts";
import { env } from "../../../config/env";
import { ExternalHttpService } from "./external-http.service";
import { ProviderCacheService } from "./provider-cache.service";

type WikimediaSearchResponse = {
  pages?: Array<{
    description?: string | null;
    key?: string;
    title: string;
  }>;
};

type WikimediaSummaryResponse = {
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
  description?: string;
  extract?: string;
  originalimage?: {
    source?: string;
  };
  thumbnail?: {
    source?: string;
  };
  title: string;
};

export type WikimediaKnowledge = {
  description?: string;
  imageUrl?: string;
  sourceUrl: string;
  summary?: string;
  title: string;
};

@Injectable()
export class WikimediaKnowledgeProvider {
  constructor(
    private readonly cache: ProviderCacheService,
    private readonly http: ExternalHttpService,
  ) {}

  async enrich(candidate: DestinationImportCandidate): Promise<WikimediaKnowledge | null> {
    const title = candidate.wikipediaTitle ?? (await this.searchTitle(candidate.name));

    if (!title) {
      return null;
    }

    return this.fetchSummary(title);
  }

  private async searchTitle(query: string) {
    const cacheKey = `wikimedia:search:${query.toLowerCase()}`;

    return this.cache.getOrSet(cacheKey, env.INGESTION_CACHE_TTL_SECONDS * 1000, async () => {
      const url = new URL("/w/rest.php/v1/search/page", env.WIKIPEDIA_API_BASE_URL);
      url.searchParams.set("q", query);
      url.searchParams.set("limit", "1");

      const response = await this.http.getJson<WikimediaSearchResponse>(url);
      const page = response.pages?.[0];
      return page?.key ?? page?.title;
    });
  }

  private async fetchSummary(title: string) {
    const cacheKey = `wikimedia:summary:${title.toLowerCase()}`;

    return this.cache.getOrSet<WikimediaKnowledge | null>(
      cacheKey,
      env.INGESTION_CACHE_TTL_SECONDS * 1000,
      async () => {
        const encodedTitle = encodeURIComponent(title.replaceAll(" ", "_"));
        const url = new URL(
          `/api/rest_v1/page/summary/${encodedTitle}`,
          env.WIKIPEDIA_API_BASE_URL,
        );

        const response = await this.http.getJson<WikimediaSummaryResponse>(url);
        const sourceUrl =
          response.content_urls?.desktop?.page ??
          new URL(`/wiki/${encodedTitle}`, env.WIKIPEDIA_API_BASE_URL).toString();

        return {
          description: response.description,
          imageUrl: response.originalimage?.source ?? response.thumbnail?.source,
          sourceUrl,
          summary: response.extract,
          title: response.title,
        };
      },
    );
  }
}
