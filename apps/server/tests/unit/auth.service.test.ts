import { UnauthorizedException } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import { hash } from "bcryptjs";
import type { Model } from "mongoose";
import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@travelverse/contracts";
import { AuthService } from "../../src/modules/auth/auth.service";
import type { UserMongoDocument } from "../../src/modules/users/schemas/user.schema";

const userId = "66b1f7f4f2f1a91f0d0a1111";

function makeUser(overrides: Partial<UserMongoDocument> = {}) {
  return {
    _id: {
      toString: () => userId,
    },
    email: "traveller@example.com",
    isActive: true,
    name: "Test Traveller",
    passwordHash: "",
    role: "USER",
    save: vi.fn(),
    ...overrides,
  } as unknown as UserMongoDocument & { save: ReturnType<typeof vi.fn> };
}

function makeService(userModel: Partial<Model<UserMongoDocument>>) {
  return new AuthService(userModel as Model<UserMongoDocument>, {
    sign: vi.fn().mockReturnValue("signed-token"),
  } as unknown as JwtService);
}

describe("AuthService", () => {
  it("logs in a user with valid credentials and returns a safe auth user", async () => {
    const user = makeUser({
      passwordHash: await hash("Password123", 12),
    });

    const select = vi.fn().mockResolvedValue(user);
    const service = makeService({
      findOne: vi.fn().mockReturnValue({ select }),
    });

    const response = await service.login({
      email: "traveller@example.com",
      password: "Password123",
    });

    expect(response.user).toEqual<AuthUser>({
      email: "traveller@example.com",
      id: userId,
      name: "Test Traveller",
      role: "USER",
    });
    expect(response).not.toHaveProperty("passwordHash");
    expect(user.save).toHaveBeenCalledOnce();
  });

  it("rejects invalid credentials", async () => {
    const user = makeUser({
      passwordHash: await hash("Password123", 12),
    });

    const service = makeService({
      findOne: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(user),
      }),
    });

    await expect(
      service.login({
        email: "traveller@example.com",
        password: "WrongPassword123",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("creates short-lived signed tokens from the safe user DTO", () => {
    const sign = vi.fn().mockReturnValue("signed-token");
    const service = new AuthService({} as Model<UserMongoDocument>, { sign } as unknown as JwtService);

    const token = service.createAccessToken({
      email: "traveller@example.com",
      id: userId,
      name: "Test Traveller",
      role: "USER",
    });

    expect(token).toBe("signed-token");
    expect(sign).toHaveBeenCalledWith(
      {
        email: "traveller@example.com",
        role: "USER",
        sub: userId,
      },
      {
        expiresIn: 604800,
      },
    );
  });
});
