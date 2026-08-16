import {
  authResponseSchema,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
} from "@travelverse/contracts";
import { apiGet, apiRequest } from "@/lib/api";

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    body: payload,
    method: "POST",
    parse: (response) => authResponseSchema.parse(response),
  });
}

export function register(payload: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    body: payload,
    method: "POST",
    parse: (response) => authResponseSchema.parse(response),
  });
}

export function getCurrentUser(): Promise<AuthResponse> {
  return apiGet<AuthResponse>("/auth/me", (response) => authResponseSchema.parse(response));
}

export function checkAdminAccess(): Promise<AuthResponse> {
  return apiGet<AuthResponse>("/auth/admin-check", (response) => authResponseSchema.parse(response));
}

export function logout(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}
