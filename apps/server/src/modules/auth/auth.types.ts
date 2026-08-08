import type { Request } from "express";
import type { AuthUser, UserRole } from "@travelverse/contracts";

export interface JwtPayload {
  email: string;
  role: UserRole;
  sub: string;
}

export interface GoogleProfilePayload {
  avatarUrl?: string;
  email: string;
  googleId: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
