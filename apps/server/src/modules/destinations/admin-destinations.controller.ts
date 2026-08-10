import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  destinationImportRequestSchema,
  destinationImportSearchQuerySchema,
  destinationListQuerySchema,
  updateDestinationRequestSchema,
  upsertDestinationRequestSchema,
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
  create(
    @Body(new ZodValidationPipe(upsertDestinationRequestSchema)) payload: UpsertDestinationRequest,
  ): Promise<Destination> {
    return this.destinationsService.create(payload);
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
  importDraft(
    @Body(new ZodValidationPipe(destinationImportRequestSchema)) payload: DestinationImportRequest,
  ): Promise<DestinationImportResult> {
    return this.destinationImportService.importDraft(payload);
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string): Promise<Destination> {
    return this.destinationsService.findBySlugForAdmin(slug);
  }

  @Patch(":slug")
  update(
    @Param("slug") slug: string,
    @Body(new ZodValidationPipe(updateDestinationRequestSchema)) payload: UpdateDestinationRequest,
  ): Promise<Destination> {
    return this.destinationsService.update(slug, payload);
  }

  @Post(":slug/publish")
  publish(@Param("slug") slug: string): Promise<Destination> {
    return this.destinationsService.publish(slug);
  }

  @Post(":slug/archive")
  archive(@Param("slug") slug: string): Promise<Destination> {
    return this.destinationsService.archive(slug);
  }
}
