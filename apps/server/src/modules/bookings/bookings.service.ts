import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type {
  Booking,
  BookingListResponse,
  BookingSimulationResponse,
  CreateBookingRequest,
  Room,
} from "@travelverse/contracts";
import { Model, Types } from "mongoose";
import { HotelsService, calculateNights, dateInputToDate } from "../hotels/hotels.service";
import { BookingDocument } from "./schemas/booking.schema";

type ObjectIdLike = {
  toString(): string;
};

type BookingRecord = Omit<Booking, "checkIn" | "checkOut" | "hotelId" | "id" | "userId"> & {
  _id: ObjectIdLike;
  checkIn: Date;
  checkOut: Date;
  hotelId?: ObjectIdLike;
  userId: ObjectIdLike;
};

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(BookingDocument.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly hotelsService: HotelsService,
  ) {}

  async listForUser(userId: string): Promise<BookingListResponse> {
    this.ensureObjectId(userId, "Invalid session user");
    const filter: Record<string, unknown> = {
      userId,
    };
    const bookings = await this.bookingModel
      .find(filter)
      .sort({
        checkIn: -1,
      })
      .lean<BookingRecord[]>()
      .exec();

    return {
      bookings: bookings.map((booking) => this.toContract(booking)),
    };
  }

  async create(userId: string, payload: CreateBookingRequest): Promise<BookingSimulationResponse> {
    this.ensureObjectId(userId, "Invalid session user");
    this.ensureObjectId(payload.hotelId, "Invalid hotel id");
    const hotelRecord = await this.hotelsService.findHotelById(payload.hotelId);

    if (!hotelRecord) {
      throw new NotFoundException("Hotel was not found");
    }

    if (hotelRecord.destinationSlug !== payload.destinationSlug) {
      throw new BadRequestException("Hotel does not belong to selected destination");
    }

    const room = hotelRecord.rooms.find((candidateRoom) => candidateRoom.id === payload.roomId);

    if (!room) {
      throw new NotFoundException("Room was not found for selected hotel");
    }

    if (room.capacity < payload.guests) {
      throw new BadRequestException(`Room supports only ${room.capacity} guest(s)`);
    }

    const checkIn = dateInputToDate(payload.checkIn);
    const checkOut = dateInputToDate(payload.checkOut);
    const nights = calculateNights(checkIn, checkOut);
    const conflictingBooking = await this.hasConflictingBooking(
      payload.hotelId,
      payload.roomId,
      checkIn,
      checkOut,
    );

    if (conflictingBooking) {
      throw new ConflictException("Selected room is already booked for these dates");
    }

    const roomTotal = room.basePriceInr * nights;
    const estimatedTotalInr = Math.round(roomTotal * 1.12);
    const bookingPayload = {
      checkIn,
      checkOut,
      destinationSlug: payload.destinationSlug,
      estimatedTotalInr,
      guests: payload.guests,
      hotelId: new Types.ObjectId(payload.hotelId),
      roomId: payload.roomId,
      status: "CONFIRMED",
      userId: new Types.ObjectId(userId),
    };
    const booking = await this.bookingModel.create(bookingPayload as unknown as BookingDocument);

    return {
      booking: this.toContract(booking.toObject() as BookingRecord),
      currency: "INR",
      hotel: this.hotelsService.toContract(hotelRecord),
      nights,
      room: toRoomContract(room),
      warnings: [
        "This is a simulated booking. No payment is collected and no real hotel inventory is reserved.",
      ],
    };
  }

  private async hasConflictingBooking(
    hotelId: string,
    roomId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<boolean> {
    const filter: Record<string, unknown> = {
      checkIn: {
        $lt: checkOut,
      },
      checkOut: {
        $gt: checkIn,
      },
      hotelId,
      roomId,
      status: {
        $in: ["PENDING", "CONFIRMED"],
      },
    };
    const booking = await this.bookingModel.exists(filter);

    return Boolean(booking);
  }

  private toContract(booking: BookingRecord): Booking {
    return {
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
      destinationSlug: booking.destinationSlug,
      estimatedTotalInr: booking.estimatedTotalInr,
      guests: booking.guests,
      hotelId: booking.hotelId ? booking.hotelId.toString() : undefined,
      id: String(booking._id),
      roomId: booking.roomId,
      status: booking.status,
      userId: booking.userId.toString(),
    };
  }

  private ensureObjectId(value: string, message: string): void {
    if (!Types.ObjectId.isValid(value)) {
      if (message.includes("session")) {
        throw new UnauthorizedException(message);
      }

      throw new BadRequestException(message);
    }
  }
}

function toRoomContract(room: Room): Room {
  return {
    amenities: room.amenities ?? [],
    basePriceInr: room.basePriceInr,
    capacity: room.capacity,
    id: room.id,
    name: room.name,
  };
}
