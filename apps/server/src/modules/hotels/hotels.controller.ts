import { Controller, Get, Query } from "@nestjs/common";
import {
  hotelSearchQuerySchema,
  type HotelSearchQuery,
  type HotelSearchResponse,
} from "@travelverse/contracts";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { HotelsService } from "./hotels.service";

@Controller("hotels")
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  search(
    @Query(new ZodValidationPipe(hotelSearchQuerySchema)) query: HotelSearchQuery,
  ): Promise<HotelSearchResponse> {
    return this.hotelsService.search(query);
  }
}
