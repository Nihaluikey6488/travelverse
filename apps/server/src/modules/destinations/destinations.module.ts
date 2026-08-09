import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { AdminDestinationsController } from "./admin-destinations.controller";
import { DestinationsController } from "./destinations.controller";
import { DestinationsService } from "./destinations.service";
import { DestinationDocument, DestinationSchema } from "./schemas/destination.schema";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: DestinationDocument.name,
        schema: DestinationSchema,
      },
    ]),
  ],
  controllers: [AdminDestinationsController, DestinationsController],
  providers: [DestinationsService],
})
export class DestinationsModule {}
