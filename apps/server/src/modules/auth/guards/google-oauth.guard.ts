import { Injectable, ServiceUnavailableException, type CanActivate } from "@nestjs/common";
import { AuthGuard as PassportAuthGuard } from "@nestjs/passport";
import { isGoogleOAuthConfigured } from "../auth.constants";

@Injectable()
export class GoogleOAuthGuard extends PassportAuthGuard("google") {
  canActivate(context: Parameters<CanActivate["canActivate"]>[0]) {
    if (!isGoogleOAuthConfigured()) {
      throw new ServiceUnavailableException(
        "Google authentication is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      );
    }

    return super.canActivate(context);
  }

  getAuthenticateOptions() {
    return {
      accessType: "online",
      prompt: "select_account",
      session: false,
    };
  }
}
