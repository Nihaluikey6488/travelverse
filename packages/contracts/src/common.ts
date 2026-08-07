import { z } from "zod";

export const userRoleSchema = z.enum(["USER", "ADMIN"]);
export const publishStatusSchema = z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);
export const verificationStatusSchema = z.enum(["UNVERIFIED", "VERIFIED", "REJECTED"]);
export const bookingStatusSchema = z.enum(["PENDING", "CONFIRMED", "CANCELLED"]);
export const transportModeSchema = z.enum(["flight", "rail", "bus", "car"]);

export const mongoIdSchema = z.string().min(1);
export const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  search: z.string().trim().optional(),
});

export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export function paginatedResponseSchema<TItem extends z.ZodTypeAny>(itemSchema: TItem) {
  return z.object({
    data: z.array(itemSchema),
    meta: paginationMetaSchema,
  });
}

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
  details: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type PublishStatus = z.infer<typeof publishStatusSchema>;
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type TransportMode = z.infer<typeof transportModeSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
