import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type {
  CreateItineraryRequest,
  Itinerary,
  ItineraryListResponse,
} from "@travelverse/contracts";
import { Model, Types } from "mongoose";
import { ItineraryDocument } from "./schemas/itinerary.schema";

type ObjectIdLike = {
  toString(): string;
};

type ItineraryRecord = Omit<Itinerary, "id" | "userId"> & {
  _id: ObjectIdLike;
  userId: ObjectIdLike;
};

@Injectable()
export class ItinerariesService {
  constructor(
    @InjectModel(ItineraryDocument.name)
    private readonly itineraryModel: Model<ItineraryDocument>,
  ) {}

  async listForUser(userId: string): Promise<ItineraryListResponse> {
    this.ensureObjectId(userId);
    const filter: Record<string, unknown> = {
      userId,
    };
    const itineraries = await this.itineraryModel
      .find(filter)
      .sort({
        updatedAt: -1,
      })
      .lean<ItineraryRecord[]>()
      .exec();

    return {
      itineraries: itineraries.map((itinerary) => this.toContract(itinerary)),
    };
  }

  async create(userId: string, payload: CreateItineraryRequest): Promise<Itinerary> {
    this.ensureObjectId(userId);
    const itineraryPayload = {
      days: payload.days,
      destinationSlug: payload.destinationSlug,
      estimatedTotalInr: payload.days.reduce((total, day) => {
        return total + day.stops.reduce((dayTotal, stop) => dayTotal + stop.estimatedCostInr, 0);
      }, 0),
      userId: new Types.ObjectId(userId),
    };
    const itinerary = await this.itineraryModel.create(
      itineraryPayload as unknown as ItineraryDocument,
    );

    return this.toContract(itinerary.toObject() as ItineraryRecord);
  }

  private toContract(itinerary: ItineraryRecord): Itinerary {
    return {
      days: itinerary.days,
      destinationSlug: itinerary.destinationSlug,
      estimatedTotalInr: itinerary.estimatedTotalInr,
      id: itinerary._id.toString(),
      userId: itinerary.userId.toString(),
    };
  }

  private ensureObjectId(userId: string): void {
    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException("Invalid session user");
    }
  }
}
