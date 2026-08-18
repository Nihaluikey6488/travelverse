import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { json, urlencoded } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { requestLoggingMiddleware } from "./common/middleware/request-logging.middleware";
import { env } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.setGlobalPrefix("api");
  app.getHttpAdapter().getInstance().set("trust proxy", env.TRUST_PROXY_HOPS);
  app.use(json({ limit: "1mb" }));
  app.use(urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(requestLoggingMiddleware);
  app.enableCors({
    credentials: true,
    origin: env.CLIENT_URL,
  });
  app.use(helmet());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(env.PORT);
  console.log(
    `TravelVerse API running on http://localhost:${env.PORT}/api release=${env.RELEASE_SHA}`,
  );
}

void bootstrap();
