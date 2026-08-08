import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { sampleDestinations } from "@travelverse/contracts";
import type { Coordinates, Destination } from "@travelverse/contracts";
import { env } from "../config/env";
import {
  DestinationDocument,
  DestinationSchema,
} from "../modules/destinations/schemas/destination.schema";
import { HotelDocument, HotelSchema } from "../modules/hotels/schemas/hotel.schema";
import { UserDocument, UserSchema } from "../modules/users/schemas/user.schema";

type SeedHotel = {
  address: string;
  amenities: string[];
  coordinates: Coordinates;
  destinationSlug: string;
  name: string;
  pricingMode: "LIVE" | "SANDBOX" | "ESTIMATED";
  rating: number;
  rooms: Array<{
    amenities: string[];
    basePriceInr: number;
    capacity: number;
    id: string;
    name: string;
  }>;
};

const DestinationModel = mongoose.model(DestinationDocument.name, DestinationSchema);
const HotelModel = mongoose.model(HotelDocument.name, HotelSchema);
const UserModel = mongoose.model(UserDocument.name, UserSchema);

const seedHotels: SeedHotel[] = [
  {
    address: "MI Road, Jaipur, Rajasthan",
    amenities: ["wifi", "breakfast", "local tour desk"],
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
        amenities: ["wifi", "queen bed", "breakfast"],
        basePriceInr: 2400,
        capacity: 2,
        id: "jaipur-deluxe",
        name: "Deluxe Room",
      },
    ],
  },
  {
    address: "Near Dashashwamedh Ghat, Varanasi",
    amenities: ["wifi", "river walk assistance", "breakfast"],
    coordinates: {
      lat: 25.307,
      lng: 83.009,
    },
    destinationSlug: "varanasi",
    name: "Ghat View Guest House",
    pricingMode: "ESTIMATED",
    rating: 4.1,
    rooms: [
      {
        amenities: ["wifi", "river view", "breakfast"],
        basePriceInr: 1900,
        capacity: 2,
        id: "varanasi-river",
        name: "River View Room",
      },
    ],
  },
  {
    address: "Calangute-Baga Road, Goa",
    amenities: ["pool", "wifi", "bike rental desk"],
    coordinates: {
      lat: 15.544,
      lng: 73.755,
    },
    destinationSlug: "goa",
    name: "Coastal Route Resort",
    pricingMode: "ESTIMATED",
    rating: 4.4,
    rooms: [
      {
        amenities: ["wifi", "balcony", "pool access"],
        basePriceInr: 3600,
        capacity: 2,
        id: "goa-coastal",
        name: "Coastal Room",
      },
    ],
  },
];

function toDestinationDocument(destination: Destination) {
  return {
    attractions: destination.attractions,
    bestSeason: destination.bestSeason,
    coordinates: destination.coordinates,
    country: destination.country,
    culturalHighlights: destination.culturalHighlights,
    danceAndArts: destination.danceAndArts,
    estimatedDailyBudgetInr: destination.estimatedDailyBudgetInr,
    festivals: destination.festivals,
    foodHighlights: destination.foodHighlights,
    heroImageUrl: destination.heroImageUrl,
    media: destination.media,
    name: destination.name,
    region: destination.region,
    sections: destination.sections,
    slug: destination.slug,
    sources: destination.sources.map((source) => ({
      ...source,
      fetchedAt: new Date(source.fetchedAt),
    })),
    status: destination.status,
    summary: destination.summary,
    tagline: destination.tagline,
    tags: destination.tags,
  };
}

async function seedAdmin() {
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

  await UserModel.updateOne(
    {
      email: env.ADMIN_EMAIL,
    },
    {
      $set: {
        email: env.ADMIN_EMAIL,
        authProvider: "credentials",
        isActive: true,
        name: env.ADMIN_NAME,
        passwordHash,
        role: "ADMIN",
      },
    },
    {
      upsert: true,
    },
  );
}

async function seedDestinations() {
  for (const destination of sampleDestinations) {
    await DestinationModel.updateOne(
      {
        slug: destination.slug,
      },
      {
        $set: toDestinationDocument(destination),
      },
      {
        upsert: true,
      },
    );
  }
}

async function seedHotelEstimates() {
  for (const hotel of seedHotels) {
    await HotelModel.updateOne(
      {
        destinationSlug: hotel.destinationSlug,
        name: hotel.name,
      },
      {
        $set: hotel,
      },
      {
        upsert: true,
      },
    );
  }
}

async function seed() {
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
  });

  await seedAdmin();
  await seedDestinations();
  await seedHotelEstimates();

  console.log(
    `Seeded admin user, ${sampleDestinations.length} destinations and ${seedHotels.length} hotels`,
  );
  await mongoose.disconnect();
}

void seed().catch(async (error: unknown) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
