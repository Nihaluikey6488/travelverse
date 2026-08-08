import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import type { Profile } from "passport-google-oauth20";
import { Strategy } from "passport-google-oauth20";
import type { AuthUser } from "@travelverse/contracts";
import { env } from "../../../config/env";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private readonly authService: AuthService) {
    super({
      callbackURL: env.GOOGLE_CALLBACK_URL,
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<AuthUser> {
    const email = profile.emails?.find((item) => item.verified)?.value ?? profile._json.email;

    if (!email || profile._json.email_verified === false) {
      throw new UnauthorizedException("Google account email is not verified");
    }

    const response = await this.authService.loginWithGoogle({
      avatarUrl: profile._json.picture,
      email: email.toLowerCase(),
      googleId: profile.id,
      name: profile.displayName || profile._json.name || email.split("@")[0],
    });

    return response.user;
  }
}
