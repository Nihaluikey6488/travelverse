import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DestinationsModule } from "./modules/destinations/destinations.module";
import { FavouritesModule } from "./modules/favourites/favourites.module";
import { HealthModule } from "./modules/health/health.module";
import { RoutesModule } from "./modules/routes/routes.module";
import { TransportModule } from "./modules/transport/transport.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        limit: 120,
        name: "default",
        ttl: 60_000,
      },
    ]),
    DatabaseModule,
    HealthModule,
    AuthModule,
    DestinationsModule,
    FavouritesModule,
    RoutesModule,
    TransportModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
