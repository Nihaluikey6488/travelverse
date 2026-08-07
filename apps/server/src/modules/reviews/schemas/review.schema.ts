import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type ReviewMongoDocument = HydratedDocument<ReviewDocument>;

@Schema({
  collection: "reviews",
  timestamps: true,
})
export class ReviewDocument {
  @Prop({ index: true, ref: "UserDocument", required: true, type: MongooseSchema.Types.ObjectId })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({ index: true, required: true })
  destinationSlug!: string;

  @Prop({ max: 5, min: 1, required: true })
  rating!: number;

  @Prop({ maxlength: 1000, required: true, trim: true })
  comment!: string;

  @Prop({ default: true, index: true })
  isPublished!: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(ReviewDocument);

ReviewSchema.index({ destinationSlug: 1, isPublished: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, destinationSlug: 1 });
