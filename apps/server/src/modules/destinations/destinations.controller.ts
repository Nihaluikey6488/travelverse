import { Controller, Get, Param } from "@nestjs/common";
import type { Destination } from "@travelverse/contracts";
import { DestinationsService } from "./destinations.service";

@Controller("destinations")
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Get()
  findAll(): Destination[] {
    return this.destinationsService.findAll();
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string): Destination {
    return this.destinationsService.findBySlug(slug);
  }
}
