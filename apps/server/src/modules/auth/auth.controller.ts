import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import {
  loginRequestSchema,
  registerRequestSchema,
  type AuthResponse,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
} from "@travelverse/contracts";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "./auth.constants";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Roles } from "./decorators/roles.decorator";
import { AuthGuard } from "./guards/auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body(new ZodValidationPipe(registerRequestSchema)) payload: RegisterRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const authResponse = await this.authService.register(payload);
    this.setSessionCookie(response, authResponse.user);
    return authResponse;
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body(new ZodValidationPipe(loginRequestSchema)) payload: LoginRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const authResponse = await this.authService.login(payload);
    this.setSessionCookie(response, authResponse.user);
    return authResponse;
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE_NAME, {
      path: getAuthCookieOptions().path,
      sameSite: getAuthCookieOptions().sameSite,
      secure: getAuthCookieOptions().secure,
    });

    return {
      message: "Logged out successfully",
    };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser): AuthResponse {
    return { user };
  }

  @Get("admin-check")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  adminCheck(@CurrentUser() user: AuthUser): AuthResponse {
    return { user };
  }

  private setSessionCookie(response: Response, user: AuthUser) {
    const token = this.authService.createAccessToken(user);
    response.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  }
}
