import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type FavouriteMongoDocument = HydratedDocument<FavouriteDocument>;

@Schema({
  collection: "favourites",
  timestamps: true,
})
export class FavouriteDocument {
  @Prop({ index: true, ref: "UserDocument", required: true, type: MongooseSchema.Types.ObjectId })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({ index: true, required: true })
  destinationSlug!: string;
}

export const FavouriteSchema = SchemaFactory.createForClass(FavouriteDocument);

FavouriteSchema.index({ userId: 1, destinationSlug: 1 }, { unique: true });
