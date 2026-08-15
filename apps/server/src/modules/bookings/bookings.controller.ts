import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  createBookingRequestSchema,
  type AuthUser,
  type BookingListResponse,
  type BookingSimulationResponse,
  type CreateBookingRequest,
} from "@travelverse/contracts";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthGuard } from "../auth/guards/auth.guard";
import { BookingsService } from "./bookings.service";

@Controller("bookings")
@UseGuards(AuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<BookingListResponse> {
    return this.bookingsService.listForUser(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createBookingRequestSchema)) payload: CreateBookingRequest,
  ): Promise<BookingSimulationResponse> {
    return this.bookingsService.create(user.id, payload);
  }
}
