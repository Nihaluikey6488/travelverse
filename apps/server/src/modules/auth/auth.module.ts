import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { env } from "../../config/env";
import { UserDocument, UserSchema } from "../users/schemas/user.schema";
import { isGoogleOAuthConfigured } from "./auth.constants";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleStrategy } from "./strategies/google.strategy";

const googleOAuthProviders = isGoogleOAuthConfigured() ? [GoogleStrategy] : [];

@Module({
  controllers: [AuthController],
  imports: [
    MongooseModule.forFeature([{ name: UserDocument.name, schema: UserSchema }]),
    PassportModule.register({ session: false }),
    JwtModule.register({
      secret: env.JWT_SECRET,
    }),
  ],
  providers: [AuthService, ...googleOAuthProviders],
})
export class AuthModule {}
