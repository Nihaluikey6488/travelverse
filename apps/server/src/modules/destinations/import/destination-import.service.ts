import { Injectable } from "@nestjs/common";
import {
  upsertDestinationRequestSchema,
  type DestinationImportCandidate,
  type DestinationImportPreview,
  type DestinationImportRequest,
  type DestinationImportResult,
  type DestinationImportSearchQuery,
  type DestinationImportSearchResponse,
  type DestinationSection,
  type MediaAsset,
  type SourceAttribution,
  type UpsertDestinationRequest,
} from "@travelverse/contracts";
import { DestinationsService } from "../destinations.service";
import { NominatimGeocodingProvider } from "./nominatim-geocoding.provider";
import { WikimediaKnowledgeProvider, type WikimediaKnowledge } from "./wikimedia-knowledge.provider";

const fallbackHeroImageUrl =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";

@Injectable()
export class DestinationImportService {
  constructor(
    private readonly geocodingProvider: NominatimGeocodingProvider,
    private readonly knowledgeProvider: WikimediaKnowledgeProvider,
    private readonly destinationsService: DestinationsService,
  ) {}

  async search(query: DestinationImportSearchQuery): Promise<DestinationImportSearchResponse> {
    try {
      const data = await this.geocodingProvider.search(query.query, query.limit);
      return {
        data,
        warnings: [],
      };
    } catch (error) {
      return {
        data: [],
        warnings: [this.toProviderWarning("Geocoding provider", error)],
      };
    }
  }

  async preview(request: DestinationImportRequest): Promise<DestinationImportPreview> {
    const warnings = ["Imported content is saved as a draft and must be verified before publishing."];
    let knowledge: WikimediaKnowledge | null = null;

    try {
      knowledge = await this.knowledgeProvider.enrich(request.candidate);
    } catch (error) {
      warnings.push(this.toProviderWarning("Wikimedia provider", error));
    }

    if (!knowledge) {
      warnings.push("No Wikimedia summary was found; admin should add verified story content.");
    }

    const sources = this.buildSources(request.candidate, knowledge);
    const draft = this.buildDraft(request.candidate, knowledge, sources);
    const validatedDraft = upsertDestinationRequestSchema.parse(draft);

    return {
      candidate: request.candidate,
      draft: validatedDraft,
      importedFields: this.getImportedFields(knowledge),
      sources,
      warnings,
    };
  }

  async importDraft(request: DestinationImportRequest): Promise<DestinationImportResult> {
    const preview = await this.preview(request);
    const destination = await this.destinationsService.create(preview.draft);

    return {
      ...preview,
      destination,
    };
  }

  private buildDraft(
    candidate: DestinationImportCandidate,
    knowledge: WikimediaKnowledge | null,
    sources: SourceAttribution[],
  ): UpsertDestinationRequest {
    const region = candidate.region ?? candidate.country ?? "Region to verify";
    const country = candidate.country ?? "Country to verify";
    const summary =
      knowledge?.summary ??
      `${candidate.name} was imported from provider data. Review history, culture, food, routes and source attribution before publishing.`;

    return {
      attractions: [],
      bestSeason: "Best season to verify",
      coordinates: candidate.coordinates,
      country,
      culturalHighlights: knowledge?.description ? [knowledge.description] : [],
      danceAndArts: [],
      estimatedDailyBudgetInr: 2500,
      festivals: [],
      foodHighlights: [],
      heroImageUrl: knowledge?.imageUrl ?? fallbackHeroImageUrl,
      media: this.buildMedia(knowledge),
      name: candidate.name,
      region,
      sections: this.buildSections(candidate, knowledge),
      slug: this.toSlug([candidate.name, region, country].join(" ")),
      sources,
      status: "DRAFT",
      summary,
      tagline:
        knowledge?.description ??
        `${candidate.name} imported from geocoding and knowledge providers for admin review.`,
      tags: [
        "imported",
        candidate.category?.split("/")[0]?.trim(),
        region,
        country,
      ].filter(Boolean) as string[],
    };
  }

  private buildSections(
    candidate: DestinationImportCandidate,
    knowledge: WikimediaKnowledge | null,
  ): DestinationSection[] {
    const sections: DestinationSection[] = [];

    if (knowledge?.summary) {
      sections.push({
        body: knowledge.summary,
        kind: "history",
        sourceUrl: knowledge.sourceUrl,
        title: `About ${candidate.name}`,
      });
    }

    sections.push({
      body: `Imported source says this place is listed as "${candidate.displayName}". Verify local culture, route details, costing and travel advice before publishing.`,
      kind: "travelTip",
      sourceUrl: candidate.sourceUrl,
      title: "Admin review checklist",
    });

    return sections;
  }

  private buildMedia(knowledge: WikimediaKnowledge | null): MediaAsset[] {
    if (!knowledge?.imageUrl) {
      return [];
    }

    return [
      {
        alt: `${knowledge.title} lead image from Wikimedia`,
        credit: "Wikimedia contributors",
        license: "Wikimedia source license; verify before publishing",
        type: "image",
        url: knowledge.imageUrl,
      },
    ];
  }

  private buildSources(
    candidate: DestinationImportCandidate,
    knowledge: WikimediaKnowledge | null,
  ): SourceAttribution[] {
    const fetchedAt = new Date().toISOString();
    const sources: SourceAttribution[] = [
      {
        fetchedAt,
        license: "OpenStreetMap data © OpenStreetMap contributors, ODbL 1.0",
        provider: "nominatim",
        sourceUrl: candidate.sourceUrl,
        verificationStatus: "UNVERIFIED",
      },
    ];

    if (knowledge) {
      sources.push({
        fetchedAt,
        license: "Wikipedia/Wikimedia content; verify article license before publishing",
        provider: "wikimedia",
        sourceUrl: knowledge.sourceUrl,
        verificationStatus: "UNVERIFIED",
      });
    }

    return sources;
  }

  private getImportedFields(knowledge: WikimediaKnowledge | null) {
    return [
      "name",
      "coordinates",
      "country",
      "region",
      "source attribution",
      ...(knowledge?.summary ? ["summary", "history section"] : []),
      ...(knowledge?.imageUrl ? ["hero image", "media"] : []),
    ];
  }

  private toProviderWarning(provider: string, error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown provider error";
    return `${provider} could not complete the request: ${message}`;
  }

  private toSlug(value: string) {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-")
      .slice(0, 120);

    return slug || `imported-${Date.now()}`;
  }
}
