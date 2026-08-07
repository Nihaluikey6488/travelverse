import { z } from "zod";

const envSchema = z.object({
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_DB_NAME: z.string().min(1).default("travelverse"),
  MONGODB_URI: z
    .string()
    .min(1)
    .default("mongodb://travelverse:travelverse@localhost:27017/travelverse?authSource=admin"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
});

export const env = envSchema.parse(process.env);
