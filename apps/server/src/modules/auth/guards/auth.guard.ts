import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { AUTH_COOKIE_NAME } from "../auth.constants";
import type { AuthenticatedRequest, JwtPayload } from "../auth.types";
import { AuthService } from "../auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException("Authentication required");
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = await this.authService.findAuthenticatedUser(payload.sub);
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired session");
    }
  }

  private extractToken(request: Request): string | undefined {
    const cookieToken = request.cookies?.[AUTH_COOKIE_NAME] as string | undefined;

    if (cookieToken) {
      return cookieToken;
    }

    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
