import { Module } from "@nestjs/common";
import { OsrmRoutingProvider } from "./osrm-routing.provider";
import { RoutesController } from "./routes.controller";
import { RoutesService } from "./routes.service";
import { RoutingCacheService } from "./routing-cache.service";

@Module({
  controllers: [RoutesController],
  providers: [OsrmRoutingProvider, RoutesService, RoutingCacheService],
})
export class RoutesModule {}
