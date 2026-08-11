import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type {
  Destination,
  DestinationFacetResponse,
  DestinationListQuery,
  DestinationListResponse,
  UpdateDestinationRequest,
  UpsertDestinationRequest,
} from "@travelverse/contracts";
import type { Model } from "mongoose";
import { DestinationDocument } from "./schemas/destination.schema";

type DestinationRecord = Omit<Destination, "id" | "sources"> & {
  _id: unknown;
  sources?: Array<Omit<Destination["sources"][number], "fetchedAt"> & { fetchedAt: Date | string }>;
};

type DestinationPersistence = Partial<Omit<Destination, "id" | "sources">> & {
  sources?: Array<Omit<Destination["sources"][number], "fetchedAt"> & { fetchedAt: Date }>;
};

type DestinationFilter = Record<string, unknown>;

@Injectable()
export class DestinationsService {
  constructor(
    @InjectModel(DestinationDocument.name)
    private readonly destinationModel: Model<DestinationDocument>,
  ) {}

  async findPublished(query: DestinationListQuery): Promise<DestinationListResponse> {
    return this.findMany({
      ...query,
      status: "PUBLISHED",
    });
  }

  async findPublishedFacets(): Promise<DestinationFacetResponse> {
    const publishedFilter = {
      status: "PUBLISHED" as const,
    };

    const [regions, countries, tags, sectionKinds, attractionTags] = await Promise.all([
      this.destinationModel.distinct("region", publishedFilter).exec(),
      this.destinationModel.distinct("country", publishedFilter).exec(),
      this.destinationModel.distinct("tags", publishedFilter).exec(),
      this.destinationModel.distinct("sections.kind", publishedFilter).exec(),
      this.destinationModel.distinct("attractions.tags", publishedFilter).exec(),
    ]);

    return {
      activities: this.toSortedStrings([...attractionTags, ...tags]),
      categories: this.toSortedStrings([...sectionKinds, ...tags]),
      countries: this.toSortedStrings(countries),
      regions: this.toSortedStrings(regions),
      tags: this.toSortedStrings(tags),
    };
  }

  async findForAdmin(query: DestinationListQuery): Promise<DestinationListResponse> {
    return this.findMany(query);
  }

  async findBySlug(slug: string): Promise<Destination> {
    return this.findOneBySlug(slug, {
      status: "PUBLISHED",
    });
  }

  async findBySlugForAdmin(slug: string): Promise<Destination> {
    return this.findOneBySlug(slug);
  }

  async create(payload: UpsertDestinationRequest): Promise<Destination> {
    const destination = await this.destinationModel.create({
      ...this.toPersistence(payload),
      status: payload.status ?? "DRAFT",
    });

    return this.toContract(destination.toObject() as DestinationRecord);
  }

  async update(slug: string, payload: UpdateDestinationRequest): Promise<Destination> {
    const destination = await this.destinationModel
      .findOneAndUpdate(
        {
          slug,
        },
        {
          $set: this.toPersistence(payload),
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .lean<DestinationRecord>()
      .exec();

    if (!destination) {
      throw new NotFoundException(`Destination "${slug}" was not found`);
    }

    return this.toContract(destination);
  }

  async publish(slug: string): Promise<Destination> {
    return this.setStatus(slug, "PUBLISHED");
  }

  async archive(slug: string): Promise<Destination> {
    return this.setStatus(slug, "ARCHIVED");
  }

  private async findMany(query: DestinationListQuery): Promise<DestinationListResponse> {
    const page = query.page;
    const limit = query.limit;
    const filter = this.buildFilter(query);
    const projection = query.search
      ? {
          score: {
            $meta: "textScore",
          },
        }
      : undefined;

    const [destinations, total] = await Promise.all([
      this.applySort(this.destinationModel.find(filter, projection), Boolean(query.search))
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<DestinationRecord[]>()
        .exec(),
      this.destinationModel.countDocuments(filter).exec(),
    ]);

    return {
      data: destinations.map((destination) => this.toContract(destination)),
      meta: {
        limit,
        page,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async findOneBySlug(
    slug: string,
    extraFilter: DestinationFilter = {},
  ): Promise<Destination> {
    const destination = await this.destinationModel
      .findOne({
        ...extraFilter,
        slug,
      })
      .lean<DestinationRecord>()
      .exec();

    if (!destination) {
      throw new NotFoundException(`Destination "${slug}" was not found`);
    }

    return this.toContract(destination);
  }

  private async setStatus(slug: string, status: Destination["status"]): Promise<Destination> {
    const destination = await this.destinationModel
      .findOneAndUpdate(
        {
          slug,
        },
        {
          $set: {
            status,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .lean<DestinationRecord>()
      .exec();

    if (!destination) {
      throw new NotFoundException(`Destination "${slug}" was not found`);
    }

    return this.toContract(destination);
  }

  private buildFilter(query: DestinationListQuery): DestinationFilter {
    const filter: DestinationFilter = {};
    const andFilters: DestinationFilter[] = [];

    if (query.status) {
      filter.status = query.status;
    }

    if (query.country) {
      filter.country = query.country;
    }

    if (query.region) {
      filter.region = query.region;
    }

    if (query.tag) {
      filter.tags = query.tag;
    }

    const categoryFilters = this.buildKeywordFilters(query.category);

    if (categoryFilters.length > 0) {
      andFilters.push({
        $or: categoryFilters,
      });
    }

    const activityFilters = this.buildKeywordFilters(query.activity);

    if (activityFilters.length > 0) {
      andFilters.push({
        $or: activityFilters,
      });
    }

    if (query.search) {
      filter.$text = {
        $search: query.search,
      };
    }

    if (andFilters.length > 0) {
      filter.$and = andFilters;
    }

    return filter;
  }

  private buildKeywordFilters(value?: string): DestinationFilter[] {
    if (!value) {
      return [];
    }

    return [
      {
        tags: value,
      },
      {
        "sections.kind": value,
      },
      {
        "attractions.tags": value,
      },
      {
        culturalHighlights: value,
      },
      {
        foodHighlights: value,
      },
      {
        danceAndArts: value,
      },
      {
        festivals: value,
      },
    ];
  }

  private applySort(
    query: ReturnType<Model<DestinationDocument>["find"]>,
    hasSearch: boolean,
  ): ReturnType<Model<DestinationDocument>["find"]> {
    if (hasSearch) {
      return query.sort({
        score: {
          $meta: "textScore",
        },
      });
    }

    return query.sort({
      name: 1,
    });
  }

  private toPersistence(payload: UpdateDestinationRequest): DestinationPersistence {
    const { sources, ...destination } = payload;

    return {
      ...destination,
      ...(sources
        ? {
            sources: sources.map((source) => ({
              ...source,
              fetchedAt: new Date(source.fetchedAt),
            })),
          }
        : {}),
    };
  }

  private toContract(destination: DestinationRecord): Destination {
    return {
      attractions: destination.attractions ?? [],
      bestSeason: destination.bestSeason,
      coordinates: destination.coordinates,
      country: destination.country,
      culturalHighlights: destination.culturalHighlights ?? [],
      danceAndArts: destination.danceAndArts ?? [],
      estimatedDailyBudgetInr: destination.estimatedDailyBudgetInr,
      festivals: destination.festivals ?? [],
      foodHighlights: destination.foodHighlights ?? [],
      heroImageUrl: destination.heroImageUrl,
      id: String(destination._id),
      media: destination.media ?? [],
      name: destination.name,
      region: destination.region,
      sections: destination.sections ?? [],
      slug: destination.slug,
      sources: (destination.sources ?? []).map((source) => ({
        ...source,
        fetchedAt:
          source.fetchedAt instanceof Date ? source.fetchedAt.toISOString() : source.fetchedAt,
      })),
      status: destination.status,
      summary: destination.summary,
      tagline: destination.tagline,
      tags: destination.tags ?? [],
    };
  }

  private toSortedStrings(values: unknown[]): string[] {
    return [...new Set(values.filter((value): value is string => typeof value === "string"))].sort(
      (first, second) => first.localeCompare(second),
    );
  }
}
