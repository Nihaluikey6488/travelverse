import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { AdminDestinationsController } from "./admin-destinations.controller";
import { DestinationsController } from "./destinations.controller";
import { DestinationsService } from "./destinations.service";
import { DestinationImportService } from "./import/destination-import.service";
import { ExternalHttpService } from "./import/external-http.service";
import { NominatimGeocodingProvider } from "./import/nominatim-geocoding.provider";
import { ProviderCacheService } from "./import/provider-cache.service";
import { WikimediaKnowledgeProvider } from "./import/wikimedia-knowledge.provider";
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
  providers: [
    DestinationImportService,
    DestinationsService,
    ExternalHttpService,
    NominatimGeocodingProvider,
    ProviderCacheService,
    WikimediaKnowledgeProvider,
  ],
})
export class DestinationsModule {}
