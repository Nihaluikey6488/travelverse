import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import type {
  Attraction,
  DestinationSection,
  MediaAsset,
  PublishStatus,
} from "@travelverse/contracts";
import type { SourceAttribution } from "@travelverse/contracts";

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

  @Prop({ default: [], type: [String] })
  foodHighlights!: string[];

  @Prop({ default: [], type: [String] })
  danceAndArts!: string[];

  @Prop({ default: [], type: [String] })
  festivals!: string[];

  @Prop({
    default: [],
    type: [
      {
        _id: false,
        averageVisitMinutes: Number,
        coordinates: {
          lat: Number,
          lng: Number,
        },
        estimatedCostInr: Number,
        name: String,
        summary: String,
        tags: [String],
      },
    ],
  })
  attractions!: Attraction[];

  @Prop({
    default: [],
    type: [
      {
        _id: false,
        body: String,
        kind: {
          enum: ["history", "culture", "food", "dance", "festival", "travelTip"],
          type: String,
        },
        sourceUrl: String,
        title: String,
      },
    ],
  })
  sections!: DestinationSection[];

  @Prop({
    default: [],
    type: [
      {
        _id: false,
        alt: String,
        credit: String,
        license: String,
        type: {
          enum: ["image", "video", "model"],
          type: String,
        },
        url: String,
      },
    ],
  })
  media!: MediaAsset[];

  @Prop({
    default: [],
    type: [
      {
        _id: false,
        fetchedAt: Date,
        license: String,
        provider: String,
        sourceUrl: String,
        verificationStatus: {
          enum: ["UNVERIFIED", "VERIFIED", "REJECTED"],
          type: String,
        },
      },
    ],
  })
  sources!: Array<Omit<SourceAttribution, "fetchedAt"> & { fetchedAt: Date }>;

  @Prop({ required: true })
  estimatedDailyBudgetInr!: number;

  @Prop({ required: true })
  bestSeason!: string;

  @Prop({ default: [], index: true, type: [String] })
  tags!: string[];

  @Prop({
    default: "DRAFT",
    enum: ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"],
    index: true,
    type: String,
  })
  status!: PublishStatus;
}

export const DestinationSchema = SchemaFactory.createForClass(DestinationDocument);

DestinationSchema.index({
  name: "text",
  region: "text",
  country: "text",
  tags: "text",
  culturalHighlights: "text",
});
