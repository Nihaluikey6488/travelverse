import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";
import type { BookingStatus } from "@travelverse/contracts";

export type BookingMongoDocument = HydratedDocument<BookingDocument>;

@Schema({
  collection: "bookings",
  timestamps: true,
})
export class BookingDocument {
  @Prop({ index: true, ref: "UserDocument", required: true, type: MongooseSchema.Types.ObjectId })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({ index: true, required: true })
  destinationSlug!: string;

  @Prop({ ref: "HotelDocument", type: MongooseSchema.Types.ObjectId })
  hotelId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  checkIn!: Date;

  @Prop({ required: true })
  checkOut!: Date;

  @Prop({ min: 1, required: true })
  guests!: number;

  @Prop({
    default: "PENDING",
    enum: ["PENDING", "CONFIRMED", "CANCELLED"],
    index: true,
    type: String,
  })
  status!: BookingStatus;

  @Prop({ default: 0, min: 0 })
  estimatedTotalInr!: number;
}

export const BookingSchema = SchemaFactory.createForClass(BookingDocument);

BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ destinationSlug: 1, checkIn: 1, checkOut: 1 });
