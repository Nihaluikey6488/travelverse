import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type DestinationMongoDocument = HydratedDocument<DestinationDocument>;

@Schema({
  collection: "destinations",
  timestamps: true,
})
export class DestinationDocument {
  @Prop({ required: true, unique: true, index: true })
  slug!: string;

  @Prop({ required: true, index: true })
  name!: string;

  @Prop({ required: true, index: true })
  country!: string;

  @Prop({ required: true, index: true })
  region!: string;

  @Prop({ required: true })
  tagline!: string;

  @Prop({ required: true })
  summary!: string;

  @Prop({
    required: true,
    type: {
      lat: Number,
      lng: Number,
    },
  })
  coordinates!: {
    lat: number;
    lng: number;
  };

  @Prop({ required: true })
  heroImageUrl!: string;

  @Prop({ default: [], type: [String] })
  culturalHighlights!: string[];

  @Prop({ required: true })
  estimatedDailyBudgetInr!: number;

  @Prop({ required: true })
  bestSeason!: string;

  @Prop({ default: [], index: true, type: [String] })
  tags!: string[];

  @Prop({ default: "DRAFT", enum: ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"], index: true })
  status!: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
}

export const DestinationSchema = SchemaFactory.createForClass(DestinationDocument);

DestinationSchema.index({
  name: "text",
  region: "text",
  country: "text",
  tags: "text",
  culturalHighlights: "text",
});
