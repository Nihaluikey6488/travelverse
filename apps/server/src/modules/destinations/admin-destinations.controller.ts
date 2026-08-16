import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  destinationImportRequestSchema,
  destinationImportSearchQuerySchema,
  destinationListQuerySchema,
  slugSchema,
  updateDestinationRequestSchema,
  upsertDestinationRequestSchema,
  type AuthUser,
  type Destination,
  type DestinationImportPreview,
  type DestinationImportRequest,
  type DestinationImportResult,
  type DestinationImportSearchQuery,
  type DestinationImportSearchResponse,
  type DestinationListQuery,
  type DestinationListResponse,
  type UpdateDestinationRequest,
  type UpsertDestinationRequest,
} from "@travelverse/contracts";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuditLogService } from "../audit/audit-log.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { DestinationsService } from "./destinations.service";
import { DestinationImportService } from "./import/destination-import.service";

@Controller("admin/destinations")
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminDestinationsController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly destinationsService: DestinationsService,
    private readonly destinationImportService: DestinationImportService,
  ) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(destinationListQuerySchema)) query: DestinationListQuery,
  ): Promise<DestinationListResponse> {
    return this.destinationsService.findForAdmin(query);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(upsertDestinationRequestSchema)) payload: UpsertDestinationRequest,
  ): Promise<Destination> {
    const destination = await this.destinationsService.create(payload);
    await this.auditLogService.recordDestinationAction({
      action: "DESTINATION_CREATED",
      actor: user,
      destination,
      metadata: {
        status: destination.status,
      },
    });

    return destination;
  }

  @Get("import/search")
  searchImportCandidates(
    @Query(new ZodValidationPipe(destinationImportSearchQuerySchema))
    query: DestinationImportSearchQuery,
  ): Promise<DestinationImportSearchResponse> {
    return this.destinationImportService.search(query);
  }

  @Post("import/preview")
  previewImport(
    @Body(new ZodValidationPipe(destinationImportRequestSchema)) payload: DestinationImportRequest,
  ): Promise<DestinationImportPreview> {
    return this.destinationImportService.preview(payload);
  }

  @Post("import")
  async importDraft(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(destinationImportRequestSchema)) payload: DestinationImportRequest,
  ): Promise<DestinationImportResult> {
    const importResult = await this.destinationImportService.importDraft(payload);
    await this.auditLogService.recordDestinationAction({
      action: "DESTINATION_IMPORTED",
      actor: user,
      destination: importResult.destination,
      metadata: {
        importedFields: importResult.importedFields,
        provider: importResult.candidate.provider,
        sourceCount: importResult.sources.length,
      },
    });

    return importResult;
  }

  @Get(":slug")
  findBySlug(@Param("slug", new ZodValidationPipe(slugSchema)) slug: string): Promise<Destination> {
    return this.destinationsService.findBySlugForAdmin(slug);
  }

  @Patch(":slug")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("slug", new ZodValidationPipe(slugSchema)) slug: string,
    @Body(new ZodValidationPipe(updateDestinationRequestSchema)) payload: UpdateDestinationRequest,
  ): Promise<Destination> {
    const destination = await this.destinationsService.update(slug, payload);
    await this.auditLogService.recordDestinationAction({
      action: "DESTINATION_UPDATED",
      actor: user,
      destination,
      metadata: {
        updatedFields: Object.keys(payload),
      },
    });

    return destination;
  }

  @Post(":slug/publish")
  async publish(
    @CurrentUser() user: AuthUser,
    @Param("slug", new ZodValidationPipe(slugSchema)) slug: string,
  ): Promise<Destination> {
    const destination = await this.destinationsService.publish(slug);
    await this.auditLogService.recordDestinationAction({
      action: "DESTINATION_PUBLISHED",
      actor: user,
      destination,
    });

    return destination;
  }

  @Post(":slug/archive")
  async archive(
    @CurrentUser() user: AuthUser,
    @Param("slug", new ZodValidationPipe(slugSchema)) slug: string,
  ): Promise<Destination> {
    const destination = await this.destinationsService.archive(slug);
    await this.auditLogService.recordDestinationAction({
      action: "DESTINATION_ARCHIVED",
      actor: user,
      destination,
    });

    return destination;
  }
}
