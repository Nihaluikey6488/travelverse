import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { FavouriteListResponse, FavouriteMutationResponse } from "@travelverse/contracts";
import { Model, Types } from "mongoose";
import { DestinationDocument } from "../destinations/schemas/destination.schema";
import { FavouriteDocument } from "./schemas/favourite.schema";

type FavouriteRecord = {
  destinationSlug: string;
};

@Injectable()
export class FavouritesService {
  constructor(
    @InjectModel(FavouriteDocument.name)
    private readonly favouriteModel: Model<FavouriteDocument>,
    @InjectModel(DestinationDocument.name)
    private readonly destinationModel: Model<DestinationDocument>,
  ) {}

  async listForUser(userId: string): Promise<FavouriteListResponse> {
    const userObjectId = this.toObjectId(userId);
    const favourites = await this.favouriteModel
      .find({
        userId: userObjectId,
      })
      .sort({
        createdAt: -1,
      })
      .lean<FavouriteRecord[]>()
      .exec();

    return {
      destinationSlugs: favourites.map((favourite) => favourite.destinationSlug),
    };
  }

  async add(userId: string, destinationSlug: string): Promise<FavouriteMutationResponse> {
    const userObjectId = this.toObjectId(userId);
    await this.ensurePublishedDestination(destinationSlug);

    await this.favouriteModel
      .updateOne(
        {
          destinationSlug,
          userId: userObjectId,
        },
        {
          $setOnInsert: {
            destinationSlug,
            userId: userObjectId,
          },
        },
        {
          upsert: true,
        },
      )
      .exec();

    return {
      ...(await this.listForUser(userId)),
      destinationSlug,
      isFavourite: true,
    };
  }

  async remove(userId: string, destinationSlug: string): Promise<FavouriteMutationResponse> {
    const userObjectId = this.toObjectId(userId);

    await this.favouriteModel
      .deleteOne({
        destinationSlug,
        userId: userObjectId,
      })
      .exec();

    return {
      ...(await this.listForUser(userId)),
      destinationSlug,
      isFavourite: false,
    };
  }

  private async ensurePublishedDestination(destinationSlug: string): Promise<void> {
    const destination = await this.destinationModel.exists({
      slug: destinationSlug,
      status: "PUBLISHED",
    });

    if (!destination) {
      throw new NotFoundException(`Published destination "${destinationSlug}" was not found`);
    }
  }

  private toObjectId(userId: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException("Invalid session user");
    }

    return new Types.ObjectId(userId);
  }
}
