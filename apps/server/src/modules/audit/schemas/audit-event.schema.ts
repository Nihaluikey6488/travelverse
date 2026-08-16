import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type AuditEventMongoDocument = HydratedDocument<AuditEventDocument>;

export type AdminAuditAction =
  | "DESTINATION_ARCHIVED"
  | "DESTINATION_CREATED"
  | "DESTINATION_IMPORTED"
  | "DESTINATION_PUBLISHED"
  | "DESTINATION_UPDATED";

@Schema({
  collection: "auditEvents",
  timestamps: true,
})
export class AuditEventDocument {
  @Prop({
    enum: [
      "DESTINATION_ARCHIVED",
      "DESTINATION_CREATED",
      "DESTINATION_IMPORTED",
      "DESTINATION_PUBLISHED",
      "DESTINATION_UPDATED",
    ],
    index: true,
    required: true,
    type: String,
  })
  action!: AdminAuditAction;

  @Prop({ index: true, ref: "UserDocument", required: true, type: MongooseSchema.Types.ObjectId })
  actorUserId!: Types.ObjectId;

  @Prop({ lowercase: true, required: true, trim: true })
  actorEmail!: string;

  @Prop({ index: true, required: true })
  resourceType!: string;

  @Prop({ index: true, required: true })
  resourceId!: string;

  @Prop({ default: {}, type: Object })
  metadata!: Record<string, unknown>;
}

export const AuditEventSchema = SchemaFactory.createForClass(AuditEventDocument);

AuditEventSchema.index({ actorUserId: 1, createdAt: -1 });
AuditEventSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
