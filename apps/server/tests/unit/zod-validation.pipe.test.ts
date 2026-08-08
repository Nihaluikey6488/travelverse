import { BadRequestException } from "@nestjs/common";
import { loginRequestSchema } from "@travelverse/contracts";
import { describe, expect, it } from "vitest";
import { ZodValidationPipe } from "../../src/common/pipes/zod-validation.pipe";

describe("ZodValidationPipe", () => {
  it("returns parsed data for a valid request body", () => {
    const pipe = new ZodValidationPipe(loginRequestSchema);

    expect(
      pipe.transform({
        email: "USER@EXAMPLE.COM",
        password: "Password123",
      }),
    ).toEqual({
      email: "user@example.com",
      password: "Password123",
    });
  });

  it("throws a bad request exception for invalid input", () => {
    const pipe = new ZodValidationPipe(loginRequestSchema);

    expect(() =>
      pipe.transform({
        email: "not-an-email",
        password: "short",
      }),
    ).toThrow(BadRequestException);
  });
});
