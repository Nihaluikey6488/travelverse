import { z } from "zod";
import { mongoIdSchema, userRoleSchema } from "./common";

export const registerRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(2).max(80),
  password: z.string().min(8).max(120),
});

export const loginRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(120),
});

export const authUserSchema = z.object({
  id: mongoIdSchema,
  email: z.string().email(),
  name: z.string(),
  role: userRoleSchema,
});

export const authResponseSchema = z.object({
  user: authUserSchema,
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
