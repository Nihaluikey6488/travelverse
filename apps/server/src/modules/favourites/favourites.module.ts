import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import {
  DestinationDocument,
  DestinationSchema,
} from "../destinations/schemas/destination.schema";
import { FavouritesController } from "./favourites.controller";
import { FavouritesService } from "./favourites.service";
import { FavouriteDocument, FavouriteSchema } from "./schemas/favourite.schema";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: FavouriteDocument.name,
        schema: FavouriteSchema,
      },
      {
        name: DestinationDocument.name,
        schema: DestinationSchema,
      },
    ]),
  ],
  controllers: [FavouritesController],
  providers: [FavouritesService],
})
export class FavouritesModule {}
