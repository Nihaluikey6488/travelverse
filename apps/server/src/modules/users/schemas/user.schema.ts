import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import type { UserRole } from "@travelverse/contracts";

export type UserMongoDocument = HydratedDocument<UserDocument>;

@Schema({
  collection: "users",
  timestamps: true,
})
export class UserDocument {
  @Prop({ lowercase: true, required: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: "USER", enum: ["USER", "ADMIN"], index: true })
  role!: UserRole;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

UserSchema.index({ email: 1 }, { unique: true });
