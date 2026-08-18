import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const envFilePaths = [
  resolve(__dirname, "../../.env"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
  resolve(__dirname, "../../../../.env"),
];

for (const envFilePath of [...new Set(envFilePaths)]) {
  if (existsSync(envFilePath)) {
    loadDotenv({
      override: false,
      path: envFilePath,
      quiet: true,
    });
  }
}

const envSchema = z.object({
  ADMIN_EMAIL: z.string().email().default("admin@travelverse.local"),
  ADMIN_NAME: z.string().min(1).default("TravelVerse Admin"),
  ADMIN_PASSWORD: z.string().min(8).default("Admin@12345"),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default("http://localhost:4000/api/auth/google/callback"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  INGESTION_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(21_600),
  INGESTION_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().default(6000),
  INGESTION_USER_AGENT: z
    .string()
    .min(10)
    .default("TravelVerse3D/0.1 (local demo; admin@travelverse.local)"),
  JWT_SECRET: z.string().min(16).default("dev-travelverse-secret-change-before-production"),
  LOG_FORMAT: z.enum(["pretty", "json"]).default("pretty"),
  MONGODB_DB_NAME: z.string().min(1).default("travelverse"),
  MONGODB_URI: z
    .string()
    .min(1)
    .default("mongodb://travelverse:travelverse@localhost:27017/travelverse?authSource=admin"),
  NOMINATIM_BASE_URL: z.string().url().default("https://nominatim.openstreetmap.org"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  OAUTH_FAILURE_REDIRECT_URL: z.string().url().default("http://localhost:3000/login?oauth=failed"),
  OAUTH_SUCCESS_REDIRECT_URL: z.string().url().default("http://localhost:3000/account"),
  OSRM_BASE_URL: z.string().url().default("https://router.project-osrm.org"),
  PORT: z.coerce.number().int().positive().default(4000),
  PROVIDER_DAILY_REQUEST_LIMIT: z.coerce.number().int().nonnegative().default(500),
  PROVIDER_MONTHLY_BUDGET_INR: z.coerce.number().int().nonnegative().default(0),
  RELEASE_SHA: z.string().min(1).default("local"),
  ROUTING_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  ROUTING_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().default(7000),
  SENTRY_DSN: z.union([z.string().url(), z.literal("")]).default(""),
  SERVICE_VERSION: z.string().min(1).default("0.1.0"),
  TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().default(0),
  WIKIPEDIA_API_BASE_URL: z.string().url().default("https://en.wikipedia.org"),
});

export const env = envSchema.parse(process.env);
