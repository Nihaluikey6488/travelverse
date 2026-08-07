import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DestinationsController } from "./destinations.controller";
import { DestinationsService } from "./destinations.service";
import { DestinationDocument, DestinationSchema } from "./schemas/destination.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DestinationDocument.name,
        schema: DestinationSchema,
      },
    ]),
  ],
  controllers: [DestinationsController],
  providers: [DestinationsService],
})
export class DestinationsModule {}
