import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BookingDocument, BookingSchema } from "../bookings/schemas/booking.schema";
import { HotelsController } from "./hotels.controller";
import { HotelsService } from "./hotels.service";
import { HotelDocument, HotelSchema } from "./schemas/hotel.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: HotelDocument.name,
        schema: HotelSchema,
      },
      {
        name: BookingDocument.name,
        schema: BookingSchema,
      },
    ]),
  ],
  controllers: [HotelsController],
  exports: [HotelsService],
  providers: [HotelsService],
})
export class HotelsModule {}
