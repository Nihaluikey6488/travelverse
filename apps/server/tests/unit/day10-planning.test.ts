import { Types } from "mongoose";
import { describe, expect, it, vi } from "vitest";
import { createBookingRequestSchema, hotelSearchQuerySchema } from "@travelverse/contracts";
import {
  HotelsService,
  calculateNights,
  dateInputToDate,
} from "../../src/modules/hotels/hotels.service";

function makeLeanChain(result: unknown) {
  return {
    exec: vi.fn().mockResolvedValue(result),
    lean: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
  };
}

describe("Day 10 planning APIs", () => {
  it("calculates hotel stay nights", () => {
    expect(calculateNights(dateInputToDate("2026-08-20"), dateInputToDate("2026-08-23"))).toBe(3);
  });

  it("rejects invalid hotel and booking date ranges", () => {
    expect(() =>
      hotelSearchQuerySchema.parse({
        checkIn: "2026-08-23",
        checkOut: "2026-08-20",
        destinationSlug: "jaipur",
        guests: 2,
      }),
    ).toThrow();

    expect(() =>
      createBookingRequestSchema.parse({
        checkIn: "2026-08-23",
        checkOut: "2026-08-20",
        destinationSlug: "jaipur",
        guests: 2,
        hotelId: new Types.ObjectId().toString(),
        roomId: "jaipur-deluxe",
      }),
    ).toThrow();
  });

  it("marks rooms unavailable when a simulated booking overlaps", async () => {
    const hotelId = new Types.ObjectId();
    const hotelModel = {
      find: vi.fn().mockReturnValue(
        makeLeanChain([
          {
            _id: hotelId,
            address: "MI Road, Jaipur",
            amenities: ["wifi"],
            coordinates: {
              lat: 26.9162,
              lng: 75.8056,
            },
            destinationSlug: "jaipur",
            name: "Pink City Heritage Stay",
            pricingMode: "ESTIMATED",
            rating: 4.3,
            rooms: [
              {
                amenities: ["wifi"],
                basePriceInr: 2400,
                capacity: 2,
                id: "jaipur-deluxe",
                name: "Deluxe Room",
              },
            ],
          },
        ]),
      ),
    };
    const bookingModel = {
      exists: vi.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    };
    const service = new HotelsService(hotelModel as never, bookingModel as never);

    const response = await service.search({
      checkIn: "2026-08-20",
      checkOut: "2026-08-22",
      destinationSlug: "jaipur",
      guests: 2,
    });

    expect(response.hotels[0]?.availableRoomCount).toBe(0);
    expect(response.hotels[0]?.rooms[0]?.isAvailable).toBe(false);
    expect(response.hotels[0]?.rooms[0]?.unavailableReason).toBe(
      "Already booked for selected dates",
    );
  });
});
