import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type {
  Hotel,
  HotelAvailability,
  HotelSearchQuery,
  HotelSearchResponse,
} from "@travelverse/contracts";
import type { Model, Types } from "mongoose";
import { BookingDocument } from "../bookings/schemas/booking.schema";
import { HotelDocument } from "./schemas/hotel.schema";

type HotelRecord = Omit<Hotel, "id" | "pricingMode"> & {
  _id: Types.ObjectId;
  pricingMode?: Hotel["pricingMode"];
};

@Injectable()
export class HotelsService {
  constructor(
    @InjectModel(HotelDocument.name)
    private readonly hotelModel: Model<HotelDocument>,
    @InjectModel(BookingDocument.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {}

  async search(query: HotelSearchQuery): Promise<HotelSearchResponse> {
    const checkInDate = dateInputToDate(query.checkIn);
    const checkOutDate = dateInputToDate(query.checkOut);
    const nights = calculateNights(checkInDate, checkOutDate);
    const filter: Record<string, unknown> = {
      destinationSlug: query.destinationSlug,
    };

    if (query.amenity) {
      filter.amenities = query.amenity;
    }

    if (query.minRating !== undefined) {
      filter.rating = {
        $gte: query.minRating,
      };
    }

    const hotels = await this.hotelModel
      .find(filter)
      .sort({
        rating: -1,
        name: 1,
      })
      .lean<HotelRecord[]>()
      .exec();
    const availability = await Promise.all(
      hotels.map((hotel) => this.toAvailability(hotel, query, checkInDate, checkOutDate, nights)),
    );
    const filteredHotels =
      query.maxPriceInr === undefined
        ? availability
        : availability.filter((hotel) =>
            hotel.rooms.some(
              (room) => room.isAvailable && room.basePriceInr <= Number(query.maxPriceInr),
            ),
          );

    return {
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      currency: "INR",
      destinationSlug: query.destinationSlug,
      fetchedAt: new Date().toISOString(),
      guests: query.guests,
      hotels: filteredHotels,
      nights,
      warnings:
        filteredHotels.length > 0
          ? ["Hotel prices are simulated planning estimates until a booking provider is connected."]
          : ["No matching hotels found. Try fewer guests or remove filters."],
    };
  }

  async findHotelById(hotelId: string): Promise<HotelRecord | null> {
    return this.hotelModel.findById(hotelId).lean<HotelRecord>().exec();
  }

  toContract(hotel: HotelRecord): Hotel {
    return {
      address: hotel.address,
      amenities: hotel.amenities ?? [],
      coordinates: hotel.coordinates,
      destinationSlug: hotel.destinationSlug,
      id: String(hotel._id),
      name: hotel.name,
      pricingMode: hotel.pricingMode ?? "ESTIMATED",
      rating: hotel.rating,
      rooms: (hotel.rooms ?? []).map((room) => ({
        amenities: room.amenities ?? [],
        basePriceInr: room.basePriceInr,
        capacity: room.capacity,
        id: room.id,
        name: room.name,
      })),
    };
  }

  private async toAvailability(
    hotel: HotelRecord,
    query: HotelSearchQuery,
    checkIn: Date,
    checkOut: Date,
    nights: number,
  ): Promise<HotelAvailability> {
    const rooms = await Promise.all(
      (hotel.rooms ?? []).map(async (room) => {
        const capacityBlocked = room.capacity < query.guests;
        const conflictingBooking = capacityBlocked
          ? false
          : await this.hasConflictingBooking(String(hotel._id), room.id, checkIn, checkOut);
        const isAvailable = !capacityBlocked && !conflictingBooking;

        return {
          ...room,
          amenities: room.amenities ?? [],
          estimatedTotalInr: room.basePriceInr * nights,
          isAvailable,
          nights,
          unavailableReason: capacityBlocked
            ? `Room supports ${room.capacity} guest(s)`
            : conflictingBooking
              ? "Already booked for selected dates"
              : undefined,
        };
      }),
    );
    const availableRooms = rooms.filter((room) => room.isAvailable);
    const lowestNightlyRateInr =
      availableRooms.length > 0
        ? Math.min(...availableRooms.map((room) => room.basePriceInr))
        : Math.min(...rooms.map((room) => room.basePriceInr), 0);

    return {
      ...this.toContract(hotel),
      availableRoomCount: availableRooms.length,
      lowestNightlyRateInr,
      rooms,
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
}

export function dateInputToDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const difference = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.ceil(difference / 86_400_000));
}
