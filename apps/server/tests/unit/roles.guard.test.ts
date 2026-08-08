import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";
import { RolesGuard } from "../../src/modules/auth/guards/roles.guard";

function makeContext(role: "ADMIN" | "USER"): ExecutionContext {
  return {
    getClass: vi.fn(),
    getHandler: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          email: "traveller@example.com",
          id: "66b1f7f4f2f1a91f0d0a1111",
          name: "Test Traveller",
          role,
        },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  it("allows users with the required role", () => {
    const guard = new RolesGuard({
      getAllAndOverride: vi.fn().mockReturnValue(["ADMIN"]),
    } as unknown as Reflector);

    expect(guard.canActivate(makeContext("ADMIN"))).toBe(true);
  });

  it("blocks normal users from admin-only routes", () => {
    const guard = new RolesGuard({
      getAllAndOverride: vi.fn().mockReturnValue(["ADMIN"]),
    } as unknown as Reflector);

    expect(() => guard.canActivate(makeContext("USER"))).toThrow(ForbiddenException);
  });
});
