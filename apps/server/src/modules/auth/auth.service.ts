import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { compare, hash } from "bcryptjs";
import { Model, Types } from "mongoose";
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from "@travelverse/contracts";
import type { GoogleProfilePayload, JwtPayload } from "./auth.types";
import { JWT_EXPIRES_IN_SECONDS } from "./auth.constants";
import { UserDocument, type UserMongoDocument } from "../users/schemas/user.schema";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserMongoDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const existingUser = await this.userModel.exists({ email: payload.email });

    if (existingUser) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await hash(payload.password, 12);
    const user = await this.userModel.create({
      authProvider: "credentials",
      email: payload.email,
      name: payload.name,
      passwordHash,
      role: "USER",
    });

    return this.toAuthResponse(user);
  }

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const user = await this.userModel.findOne({ email: payload.email }).select("+passwordHash");

    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await compare(payload.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    user.lastLoginAt = new Date();
    await user.save();

    return this.toAuthResponse(user);
  }

  async loginWithGoogle(profile: GoogleProfilePayload): Promise<AuthResponse> {
    const user = await this.userModel.findOne({
      $or: [{ googleId: profile.googleId }, { email: profile.email }],
    });

    if (user) {
      if (!user.isActive) {
        throw new UnauthorizedException("User is no longer active");
      }

      user.authProvider = user.authProvider ?? "google";
      user.avatarUrl = profile.avatarUrl ?? user.avatarUrl;
      user.googleId = profile.googleId;
      user.lastLoginAt = new Date();
      user.name = user.name || profile.name;
      await user.save();

      return this.toAuthResponse(user);
    }

    const createdUser = await this.userModel.create({
      authProvider: "google",
      avatarUrl: profile.avatarUrl,
      email: profile.email,
      googleId: profile.googleId,
      isActive: true,
      name: profile.name,
      role: "USER",
    });

    return this.toAuthResponse(createdUser);
  }

  async findAuthenticatedUser(userId: string): Promise<AuthUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException("Invalid session user");
    }

    const user = await this.userModel.findOne({ _id: userId, isActive: true });

    if (!user) {
      throw new UnauthorizedException("User is no longer active");
    }

    return this.toAuthUser(user);
  }

  createAccessToken(user: AuthUser): string {
    const payload: JwtPayload = {
      email: user.email,
      role: user.role,
      sub: user.id,
    };

    return this.jwtService.sign(payload, {
      expiresIn: JWT_EXPIRES_IN_SECONDS,
    });
  }

  toAuthResponse(user: UserMongoDocument): AuthResponse {
    return {
      user: this.toAuthUser(user),
    };
  }

  private toAuthUser(user: UserMongoDocument): AuthUser {
    const authUser: AuthUser = {
      email: user.email,
      id: user._id.toString(),
      name: user.name,
      role: user.role,
    };

    if (user.avatarUrl) {
      authUser.avatarUrl = user.avatarUrl;
    }

    return authUser;
  }
}
