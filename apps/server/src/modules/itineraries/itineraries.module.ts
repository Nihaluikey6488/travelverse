import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { ItinerariesController } from "./itineraries.controller";
import { ItinerariesService } from "./itineraries.service";
import { ItineraryDocument, ItinerarySchema } from "./schemas/itinerary.schema";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: ItineraryDocument.name,
        schema: ItinerarySchema,
      },
    ]),
  ],
  controllers: [ItinerariesController],
  exports: [ItinerariesService],
  providers: [ItinerariesService],
})
export class ItinerariesModule {}
