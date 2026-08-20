import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const defaultAdminEmail = "admin@travelverse.local";
const defaultAdminPassword = "Admin@12345";
const defaultClientUrl = "http://localhost:3000";
const defaultGoogleCallbackUrl = "http://localhost:4000/api/auth/google/callback";
const defaultJwtSecret = "dev-travelverse-secret-change-before-production";
const defaultMongoUri =
  "mongodb://travelverse:travelverse@localhost:27017/travelverse?authSource=admin";
const defaultOAuthFailureRedirectUrl = "http://localhost:3000/login?oauth=failed";
const defaultOAuthSuccessRedirectUrl = "http://localhost:3000/account";

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
  ADMIN_EMAIL: z.string().email().default(defaultAdminEmail),
  ADMIN_NAME: z.string().min(1).default("TravelVerse Admin"),
  ADMIN_PASSWORD: z.string().min(8).default(defaultAdminPassword),
  CLIENT_URL: z.string().url().default(defaultClientUrl),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default(defaultGoogleCallbackUrl),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  INGESTION_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(21_600),
  INGESTION_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().default(6000),
  INGESTION_USER_AGENT: z
    .string()
    .min(10)
    .default("TravelVerse3D/0.1 (local demo; admin@travelverse.local)"),
  JWT_SECRET: z.string().min(16).default(defaultJwtSecret),
  LOG_FORMAT: z.enum(["pretty", "json"]).default("pretty"),
  MONGODB_DB_NAME: z.string().min(1).default("travelverse"),
  MONGODB_URI: z.string().min(1).default(defaultMongoUri),
  NOMINATIM_BASE_URL: z.string().url().default("https://nominatim.openstreetmap.org"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  OAUTH_FAILURE_REDIRECT_URL: z.string().url().default(defaultOAuthFailureRedirectUrl),
  OAUTH_SUCCESS_REDIRECT_URL: z.string().url().default(defaultOAuthSuccessRedirectUrl),
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

export type TravelVerseEnv = z.infer<typeof envSchema>;

const parsedEnv = envSchema.parse(process.env);
const unsafeProductionKeys = getUnsafeProductionEnvKeys(parsedEnv);

if (parsedEnv.NODE_ENV === "production" && unsafeProductionKeys.length > 0) {
  throw new Error(
    `Unsafe production environment configuration: replace ${unsafeProductionKeys.join(", ")} before starting the API.`,
  );
}

export const env = parsedEnv;

export function getUnsafeProductionEnvKeys(candidate: TravelVerseEnv): string[] {
  const unsafeKeys: string[] = [];

  if (candidate.ADMIN_EMAIL === defaultAdminEmail) {
    unsafeKeys.push("ADMIN_EMAIL");
  }

  if (candidate.ADMIN_PASSWORD === defaultAdminPassword) {
    unsafeKeys.push("ADMIN_PASSWORD");
  }

  if (candidate.CLIENT_URL === defaultClientUrl || isLocalUrl(candidate.CLIENT_URL)) {
    unsafeKeys.push("CLIENT_URL");
  }

  if (candidate.JWT_SECRET === defaultJwtSecret) {
    unsafeKeys.push("JWT_SECRET");
  }

  if (candidate.MONGODB_URI === defaultMongoUri || isLocalMongoUri(candidate.MONGODB_URI)) {
    unsafeKeys.push("MONGODB_URI");
  }

  if (candidate.OAUTH_SUCCESS_REDIRECT_URL === defaultOAuthSuccessRedirectUrl) {
    unsafeKeys.push("OAUTH_SUCCESS_REDIRECT_URL");
  }

  if (candidate.OAUTH_FAILURE_REDIRECT_URL === defaultOAuthFailureRedirectUrl) {
    unsafeKeys.push("OAUTH_FAILURE_REDIRECT_URL");
  }

  if (
    (candidate.GOOGLE_CLIENT_ID || candidate.GOOGLE_CLIENT_SECRET) &&
    candidate.GOOGLE_CALLBACK_URL === defaultGoogleCallbackUrl
  ) {
    unsafeKeys.push("GOOGLE_CALLBACK_URL");
  }

  return unsafeKeys;
}

function isLocalUrl(value: string) {
  const url = new URL(value);
  return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
}

function isLocalMongoUri(value: string) {
  return value.includes("localhost") || value.includes("127.0.0.1");
}
