import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  type DestinationFacetResponse,
  destinationListQuerySchema,
  type Destination,
  type DestinationListQuery,
  type DestinationListResponse,
} from "@travelverse/contracts";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { DestinationsService } from "./destinations.service";

@Controller("destinations")
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(destinationListQuerySchema)) query: DestinationListQuery,
  ): Promise<DestinationListResponse> {
    return this.destinationsService.findPublished(query);
  }

  @Get("facets")
  findFacets(): Promise<DestinationFacetResponse> {
    return this.destinationsService.findPublishedFacets();
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string): Promise<Destination> {
    return this.destinationsService.findBySlug(slug);
  }
}
