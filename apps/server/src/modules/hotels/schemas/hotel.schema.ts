import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import type { Coordinates } from "@travelverse/contracts";

export type HotelMongoDocument = HydratedDocument<HotelDocument>;

@Schema({
  collection: "hotels",
  timestamps: true,
})
export class HotelDocument {
  @Prop({ index: true, required: true })
  destinationSlug!: string;

  @Prop({ index: true, required: true })
  name!: string;

  @Prop({ required: true })
  address!: string;

  @Prop({
    required: true,
    type: {
      lat: Number,
      lng: Number,
    },
  })
  coordinates!: Coordinates;

  @Prop({ default: 0, max: 5, min: 0 })
  rating!: number;

  @Prop({ default: [], type: [String] })
  amenities!: string[];

  @Prop({
    default: [],
    type: [
      {
        _id: false,
        amenities: [String],
        basePriceInr: Number,
        capacity: Number,
        id: String,
        name: String,
      },
    ],
  })
  rooms!: Array<{
    amenities: string[];
    basePriceInr: number;
    capacity: number;
    id: string;
    name: string;
  }>;

  @Prop({ default: "ESTIMATED", enum: ["LIVE", "SANDBOX", "ESTIMATED"], index: true })
  pricingMode!: "LIVE" | "SANDBOX" | "ESTIMATED";
}

export const HotelSchema = SchemaFactory.createForClass(HotelDocument);

HotelSchema.index({ destinationSlug: 1, rating: -1 });
HotelSchema.index({ name: "text", address: "text", amenities: "text" });
