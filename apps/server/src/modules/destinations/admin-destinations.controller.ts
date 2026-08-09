import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  destinationListQuerySchema,
  updateDestinationRequestSchema,
  upsertDestinationRequestSchema,
  type Destination,
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

@Controller("admin/destinations")
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminDestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

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
