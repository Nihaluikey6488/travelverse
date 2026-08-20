import { describe, expect, it } from "vitest";
import { getUnsafeProductionEnvKeys, type TravelVerseEnv } from "../../src/config/env";

const safeEnv: TravelVerseEnv = {
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_NAME: "TravelVerse Admin",
  ADMIN_PASSWORD: "A-safe-production-password-123",
  CLIENT_URL: "https://travelverse.example.com",
  GOOGLE_CALLBACK_URL: "https://api.travelverse.example.com/api/auth/google/callback",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  INGESTION_CACHE_TTL_SECONDS: 21_600,
  INGESTION_FETCH_TIMEOUT_MS: 6000,
  INGESTION_USER_AGENT: "TravelVerse3D/0.1 (production; admin@example.com)",
  JWT_SECRET: "replace-with-a-long-random-production-secret",
  LOG_FORMAT: "json",
  MONGODB_DB_NAME: "travelverse",
  MONGODB_URI: "mongodb+srv://user:password@example.mongodb.net/travelverse",
  NODE_ENV: "production",
  NOMINATIM_BASE_URL: "https://nominatim.openstreetmap.org",
  OAUTH_FAILURE_REDIRECT_URL: "https://travelverse.example.com/login?oauth=failed",
  OAUTH_SUCCESS_REDIRECT_URL: "https://travelverse.example.com/account",
  OSRM_BASE_URL: "https://router.project-osrm.org",
  PORT: 4000,
  PROVIDER_DAILY_REQUEST_LIMIT: 500,
  PROVIDER_MONTHLY_BUDGET_INR: 0,
  RELEASE_SHA: "abc123",
  ROUTING_CACHE_TTL_SECONDS: 900,
  ROUTING_FETCH_TIMEOUT_MS: 7000,
  SENTRY_DSN: "",
  SERVICE_VERSION: "0.1.0",
  TRUST_PROXY_HOPS: 1,
  WIKIPEDIA_API_BASE_URL: "https://en.wikipedia.org",
};

describe("production environment guardrails", () => {
  it("does not flag a production-safe configuration", () => {
    expect(getUnsafeProductionEnvKeys(safeEnv)).toEqual([]);
  });

  it("flags unsafe development defaults before production boot", () => {
    expect(
      getUnsafeProductionEnvKeys({
        ...safeEnv,
        ADMIN_EMAIL: "admin@travelverse.local",
        ADMIN_PASSWORD: "Admin@12345",
        CLIENT_URL: "http://localhost:3000",
        GOOGLE_CALLBACK_URL: "http://localhost:4000/api/auth/google/callback",
        GOOGLE_CLIENT_ID: "google-client",
        JWT_SECRET: "dev-travelverse-secret-change-before-production",
        MONGODB_URI:
          "mongodb://travelverse:travelverse@localhost:27017/travelverse?authSource=admin",
        OAUTH_FAILURE_REDIRECT_URL: "http://localhost:3000/login?oauth=failed",
        OAUTH_SUCCESS_REDIRECT_URL: "http://localhost:3000/account",
      }),
    ).toEqual([
      "ADMIN_EMAIL",
      "ADMIN_PASSWORD",
      "CLIENT_URL",
      "JWT_SECRET",
      "MONGODB_URI",
      "OAUTH_SUCCESS_REDIRECT_URL",
      "OAUTH_FAILURE_REDIRECT_URL",
      "GOOGLE_CALLBACK_URL",
    ]);
  });
});
