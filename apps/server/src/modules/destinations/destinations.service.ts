import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Destination } from "@travelverse/contracts";
import type { Model } from "mongoose";
import { DestinationDocument } from "./schemas/destination.schema";

type DestinationRecord = Omit<Destination, "id" | "sources"> & {
  _id: unknown;
  sources?: Array<Omit<Destination["sources"][number], "fetchedAt"> & { fetchedAt: Date | string }>;
};

@Injectable()
export class DestinationsService {
  constructor(
    @InjectModel(DestinationDocument.name)
    private readonly destinationModel: Model<DestinationDocument>,
  ) {}

  async findAll(): Promise<Destination[]> {
    const destinations = await this.destinationModel
      .find({
        status: "PUBLISHED",
      })
      .sort({
        name: 1,
      })
      .lean<DestinationRecord[]>()
      .exec();

    return destinations.map((destination) => this.toContract(destination));
  }

  async findBySlug(slug: string): Promise<Destination> {
    const destination = await this.destinationModel
      .findOne({
        slug,
        status: "PUBLISHED",
      })
      .lean<DestinationRecord>()
      .exec();

    if (!destination) {
      throw new NotFoundException(`Destination "${slug}" was not found`);
    }

    return this.toContract(destination);
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
}
