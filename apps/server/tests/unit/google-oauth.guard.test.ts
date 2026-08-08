import { ServiceUnavailableException, type ExecutionContext } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { env } from "../../src/config/env";
import { GoogleOAuthGuard } from "../../src/modules/auth/guards/google-oauth.guard";

describe("GoogleOAuthGuard", () => {
  it("blocks the OAuth redirect when Google credentials are not configured", () => {
    env.GOOGLE_CLIENT_ID = "";
    env.GOOGLE_CLIENT_SECRET = "";

    const guard = new GoogleOAuthGuard();

    expect(() => guard.canActivate({} as ExecutionContext)).toThrow(ServiceUnavailableException);
  });
});
