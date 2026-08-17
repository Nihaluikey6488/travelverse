import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuditLogService } from "./audit-log.service";
import { AuditEventDocument, AuditEventSchema } from "./schemas/audit-event.schema";

@Module({
  exports: [AuditLogService],
  imports: [
    MongooseModule.forFeature([
      {
        name: AuditEventDocument.name,
        schema: AuditEventSchema,
      },
    ]),
  ],
  providers: [AuditLogService],
})
export class AuditModule {}
