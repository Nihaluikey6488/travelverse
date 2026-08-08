import type { Request } from "express";
import type { AuthUser, UserRole } from "@travelverse/contracts";

export interface JwtPayload {
  email: string;
  role: UserRole;
  sub: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
