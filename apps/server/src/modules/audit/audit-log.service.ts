import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { AuthUser, Destination } from "@travelverse/contracts";
import { Model, Types } from "mongoose";
import { AuditEventDocument, type AdminAuditAction } from "./schemas/audit-event.schema";

type DestinationAuditInput = {
  action: AdminAuditAction;
  actor: AuthUser;
  destination: Pick<Destination, "id" | "name" | "slug" | "status">;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectModel(AuditEventDocument.name)
    private readonly auditEventModel: Model<AuditEventDocument>,
  ) {}

  async recordDestinationAction(input: DestinationAuditInput): Promise<void> {
    if (!Types.ObjectId.isValid(input.actor.id)) {
      this.logger.warn(`Skipped audit log for invalid actor id: ${input.actor.id}`);
      return;
    }

    try {
      await this.auditEventModel.create({
        action: input.action,
        actorEmail: input.actor.email,
        actorUserId: new Types.ObjectId(input.actor.id),
        metadata: {
          destinationName: input.destination.name,
          destinationStatus: input.destination.status,
          destinationSlug: input.destination.slug,
          ...input.metadata,
        },
        resourceId: input.destination.slug,
        resourceType: "destination",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown audit logging error";
      this.logger.error(`Audit logging failed: ${message}`);
    }
  }
}
