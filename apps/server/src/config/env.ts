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
  JWT_SECRET: z.string().min(16).default("dev-travelverse-secret-change-before-production"),
  MONGODB_DB_NAME: z.string().min(1).default("travelverse"),
  MONGODB_URI: z
    .string()
    .min(1)
    .default("mongodb://travelverse:travelverse@localhost:27017/travelverse?authSource=admin"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  OAUTH_FAILURE_REDIRECT_URL: z.string().url().default("http://localhost:3000/login?oauth=failed"),
  OAUTH_SUCCESS_REDIRECT_URL: z.string().url().default("http://localhost:3000/account"),
  PORT: z.coerce.number().int().positive().default(4000),
});

export const env = envSchema.parse(process.env);
