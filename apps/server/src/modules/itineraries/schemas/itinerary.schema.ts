import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type ItineraryMongoDocument = HydratedDocument<ItineraryDocument>;

@Schema({
  collection: "itineraries",
  timestamps: true,
})
export class ItineraryDocument {
  @Prop({ index: true, ref: "UserDocument", required: true, type: MongooseSchema.Types.ObjectId })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({ index: true, required: true })
  destinationSlug!: string;

  @Prop({
    default: [],
    type: [
      {
        _id: false,
        day: Number,
        stops: [
          {
            _id: false,
            estimatedCostInr: Number,
            notes: String,
            timeOfDay: {
              enum: ["morning", "afternoon", "evening", "night"],
              type: String,
            },
            title: String,
          },
        ],
      },
    ],
  })
  days!: Array<{
    day: number;
    stops: Array<{
      estimatedCostInr: number;
      notes: string;
      timeOfDay: "morning" | "afternoon" | "evening" | "night";
      title: string;
    }>;
  }>;

  @Prop({ default: 0, min: 0 })
  estimatedTotalInr!: number;
}

export const ItinerarySchema = SchemaFactory.createForClass(ItineraryDocument);

ItinerarySchema.index({ userId: 1, destinationSlug: 1, updatedAt: -1 });
