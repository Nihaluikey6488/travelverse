import type { CanActivate, ExecutionContext, INestApplication } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  sampleDestinations,
  type AuthResponse,
  type AuthUser,
  type BookingSimulationResponse,
  type DestinationListResponse,
} from "@travelverse/contracts";
import { ApiExceptionFilter } from "../../src/common/filters/api-exception.filter";
import { AuthController } from "../../src/modules/auth/auth.controller";
import { AUTH_COOKIE_NAME } from "../../src/modules/auth/auth.constants";
import { AuthService } from "../../src/modules/auth/auth.service";
import { AuthGuard } from "../../src/modules/auth/guards/auth.guard";
import { GoogleOAuthGuard } from "../../src/modules/auth/guards/google-oauth.guard";
import { RolesGuard } from "../../src/modules/auth/guards/roles.guard";
import { BookingsController } from "../../src/modules/bookings/bookings.controller";
import { BookingsService } from "../../src/modules/bookings/bookings.service";
import { DestinationsController } from "../../src/modules/destinations/destinations.controller";
import { DestinationsService } from "../../src/modules/destinations/destinations.service";

const userId = "66b1f7f4f2f1a91f0d0a1111";
const hotelId = "66b1f7f4f2f1a91f0d0a2222";
const itineraryId = "66b1f7f4f2f1a91f0d0a3333";

const travellerUser: AuthUser = {
  email: "traveller@example.com",
  id: userId,
  name: "Test Traveller",
  role: "USER",
};

const adminUser: AuthUser = {
  ...travellerUser,
  email: "admin@example.com",
  name: "Admin Traveller",
  role: "ADMIN",
};

describe("API integration flows", () => {
  let apps: INestApplication[] = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps = [];
    vi.restoreAllMocks();
  });

  describe("auth API", () => {
    let authService: {
      createAccessToken: ReturnType<typeof vi.fn>;
      login: ReturnType<typeof vi.fn>;
      register: ReturnType<typeof vi.fn>;
    };
    let app: INestApplication;

    beforeEach(async () => {
      authService = {
        createAccessToken: vi.fn().mockReturnValue("signed-test-token"),
        login: vi.fn().mockResolvedValue({ user: travellerUser } satisfies AuthResponse),
        register: vi.fn().mockResolvedValue({ user: travellerUser } satisfies AuthResponse),
      };
      app = await createAuthApp(authService);
      apps.push(app);
    });

    it("registers a user, validates payload and sets an http-only session cookie", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send({
          email: "traveller@example.com",
          name: "Test Traveller",
          password: "Password123",
        })
        .expect(201);

      expect(response.body.user.email).toBe("traveller@example.com");
      expect(response.headers["set-cookie"]?.join(";")).toContain(AUTH_COOKIE_NAME);
      expect(authService.createAccessToken).toHaveBeenCalledWith(travellerUser);
    });

    it("rejects malformed auth payloads with normalized API errors", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: "not-an-email",
          password: "short",
        })
        .expect(400);

      expect(response.body).toEqual(
        expect.objectContaining({
          code: "BAD_REQUEST",
          statusCode: 400,
        }),
      );
      expect(authService.login).not.toHaveBeenCalled();
    });

    it("enforces admin role checks on protected admin auth endpoint", async () => {
      await request(app.getHttpServer())
        .get("/api/auth/admin-check")
        .set("x-test-role", "USER")
        .expect(403);

      const response = await request(app.getHttpServer())
        .get("/api/auth/admin-check")
        .set("x-test-role", "ADMIN")
        .expect(200);

      expect(response.body.user.role).toBe("ADMIN");
    });
  });

  describe("destinations API", () => {
    it("passes validated pagination and search query to the public destination service", async () => {
      const destinationList: DestinationListResponse = {
        data: [sampleDestinations[0]],
        meta: {
          limit: 6,
          page: 2,
          total: 1,
          totalPages: 1,
        },
      };
      const destinationsService = {
        findBySlug: vi.fn(),
        findPublished: vi.fn().mockResolvedValue(destinationList),
        findPublishedFacets: vi.fn().mockResolvedValue({
          activities: ["history"],
          categories: ["food"],
          countries: ["India"],
          regions: ["Rajasthan"],
          tags: ["architecture"],
        }),
      };
      const app = await createDestinationApp(destinationsService);
      apps.push(app);

      const response = await request(app.getHttpServer())
        .get("/api/destinations?page=2&limit=6&search=jai")
        .expect(200);

      expect(response.body.meta.page).toBe(2);
      expect(destinationsService.findPublished).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 6,
          page: 2,
          search: "jai",
        }),
      );
    });

    it("rejects invalid destination slugs before hitting the service", async () => {
      const destinationsService = {
        findBySlug: vi.fn(),
        findPublished: vi.fn(),
        findPublishedFacets: vi.fn(),
      };
      const app = await createDestinationApp(destinationsService);
      apps.push(app);

      const response = await request(app.getHttpServer())
        .get("/api/destinations/Bad%20Slug")
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(destinationsService.findBySlug).not.toHaveBeenCalled();
    });
  });

  describe("bookings API", () => {
    let bookingsService: {
      create: ReturnType<typeof vi.fn>;
      listForUser: ReturnType<typeof vi.fn>;
    };
    let app: INestApplication;

    beforeEach(async () => {
      bookingsService = {
        create: vi.fn().mockResolvedValue(makeBookingResponse()),
        listForUser: vi.fn().mockResolvedValue({
          bookings: [makeBookingResponse().booking],
        }),
      };
      app = await createBookingsApp(bookingsService);
      apps.push(app);
    });

    it("lists bookings for the authenticated user only", async () => {
      const response = await request(app.getHttpServer()).get("/api/bookings").expect(200);

      expect(response.body.bookings).toHaveLength(1);
      expect(bookingsService.listForUser).toHaveBeenCalledWith(userId);
    });

    it("creates a booking with validated payload and current user ownership", async () => {
      await request(app.getHttpServer())
        .post("/api/bookings")
        .send({
          checkIn: "2026-08-20",
          checkOut: "2026-08-23",
          destinationSlug: "jaipur",
          guests: 2,
          hotelId,
          itineraryId,
          roomId: "jaipur-deluxe",
        })
        .expect(201);

      expect(bookingsService.create).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          destinationSlug: "jaipur",
          hotelId,
          roomId: "jaipur-deluxe",
        }),
      );
    });

    it("rejects invalid booking date ranges before booking service execution", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/bookings")
        .send({
          checkIn: "2026-08-23",
          checkOut: "2026-08-20",
          destinationSlug: "jaipur",
          guests: 2,
          hotelId,
          roomId: "jaipur-deluxe",
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(bookingsService.create).not.toHaveBeenCalled();
    });
  });
});

async function createAuthApp(authService: unknown) {
  const testingModuleBuilder = Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      Reflector,
      RolesGuard,
      {
        provide: AuthService,
        useValue: authService,
      },
    ],
  })
    .overrideGuard(AuthGuard)
    .useValue(createHeaderAuthGuard())
    .overrideGuard(GoogleOAuthGuard)
    .useValue({
      canActivate: vi.fn().mockReturnValue(true),
    });

  const testingModule = await testingModuleBuilder.compile();

  return setupApiApp(testingModule.createNestApplication());
}

async function createDestinationApp(destinationsService: unknown) {
  const testingModule = await Test.createTestingModule({
    controllers: [DestinationsController],
    providers: [
      {
        provide: DestinationsService,
        useValue: destinationsService,
      },
    ],
  }).compile();

  return setupApiApp(testingModule.createNestApplication());
}

async function createBookingsApp(bookingsService: unknown) {
  const testingModuleBuilder = Test.createTestingModule({
    controllers: [BookingsController],
    providers: [
      {
        provide: BookingsService,
        useValue: bookingsService,
      },
    ],
  })
    .overrideGuard(AuthGuard)
    .useValue(createHeaderAuthGuard());

  const testingModule = await testingModuleBuilder.compile();

  return setupApiApp(testingModule.createNestApplication());
}

async function setupApiApp(app: INestApplication) {
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.init();
  return app;
}

function createHeaderAuthGuard(): CanActivate {
  return {
    canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest<{
        headers: Record<string, string | undefined>;
        user?: AuthUser;
      }>();

      if (request.headers["x-test-auth"] === "missing") {
        throw new UnauthorizedException("Authentication required");
      }

      request.user = request.headers["x-test-role"] === "ADMIN" ? adminUser : travellerUser;
      return true;
    },
  };
}

function makeBookingResponse(): BookingSimulationResponse {
  return {
    booking: {
      checkIn: "2026-08-20T00:00:00.000Z",
      checkOut: "2026-08-23T00:00:00.000Z",
      destinationSlug: "jaipur",
      estimatedTotalInr: 8064,
      guests: 2,
      hotelId,
      id: "66b1f7f4f2f1a91f0d0a4444",
      roomId: "jaipur-deluxe",
      status: "CONFIRMED",
      userId,
    },
    currency: "INR",
    hotel: {
      address: "MI Road, Jaipur",
      amenities: ["wifi", "breakfast"],
      coordinates: {
        lat: 26.9162,
        lng: 75.8056,
      },
      destinationSlug: "jaipur",
      id: hotelId,
      name: "Pink City Heritage Stay",
      pricingMode: "ESTIMATED",
      rating: 4.3,
      rooms: [
        {
          amenities: ["wifi", "breakfast"],
          basePriceInr: 2400,
          capacity: 2,
          id: "jaipur-deluxe",
          name: "Deluxe Room",
        },
      ],
    },
    nights: 3,
    room: {
      amenities: ["wifi", "breakfast"],
      basePriceInr: 2400,
      capacity: 2,
      id: "jaipur-deluxe",
      name: "Deluxe Room",
    },
    warnings: ["This is a simulated booking."],
  };
}
