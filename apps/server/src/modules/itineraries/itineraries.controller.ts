import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  createItineraryRequestSchema,
  type AuthUser,
  type CreateItineraryRequest,
  type Itinerary,
  type ItineraryListResponse,
} from "@travelverse/contracts";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthGuard } from "../auth/guards/auth.guard";
import { ItinerariesService } from "./itineraries.service";

@Controller("itineraries")
@UseGuards(AuthGuard)
export class ItinerariesController {
  constructor(private readonly itinerariesService: ItinerariesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<ItineraryListResponse> {
    return this.itinerariesService.listForUser(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createItineraryRequestSchema)) payload: CreateItineraryRequest,
  ): Promise<Itinerary> {
    return this.itinerariesService.create(user.id, payload);
  }
}
