import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { env } from "../config/env";

@Module({
  imports: [
    MongooseModule.forRoot(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      retryAttempts: 3,
      retryDelay: 1000,
    }),
  ],
})
export class DatabaseModule {}
