import { z } from "zod";
import {
  coordinatesSchema,
  mongoIdSchema,
  paginationQuerySchema,
  publishStatusSchema,
  slugSchema,
  verificationStatusSchema,
} from "./common";

export const sourceAttributionSchema = z.object({
  provider: z.string(),
  sourceUrl: z.string().url(),
  license: z.string(),
  fetchedAt: z.string().datetime(),
  verificationStatus: verificationStatusSchema,
});

export const mediaAssetSchema = z.object({
  url: z.string().url(),
  alt: z.string(),
  type: z.enum(["image", "video", "model"]),
  credit: z.string().optional(),
  license: z.string().optional(),
});

export const destinationSectionSchema = z.object({
  title: z.string(),
  kind: z.enum(["history", "culture", "food", "dance", "festival", "travelTip"]),
  body: z.string(),
  sourceUrl: z.string().url().optional(),
});

export const attractionSchema = z.object({
  name: z.string(),
  summary: z.string(),
  coordinates: coordinatesSchema.optional(),
  estimatedCostInr: z.number().int().nonnegative(),
  averageVisitMinutes: z.number().int().positive(),
  tags: z.array(z.string()),
});

export const destinationSchema = z.object({
  id: mongoIdSchema,
  slug: slugSchema,
  name: z.string(),
  country: z.string(),
  region: z.string(),
  tagline: z.string(),
  summary: z.string(),
  coordinates: coordinatesSchema,
  heroImageUrl: z.string().url(),
  culturalHighlights: z.array(z.string()),
  foodHighlights: z.array(z.string()),
  danceAndArts: z.array(z.string()),
  festivals: z.array(z.string()),
  attractions: z.array(attractionSchema),
  sections: z.array(destinationSectionSchema),
  media: z.array(mediaAssetSchema),
  sources: z.array(sourceAttributionSchema),
  estimatedDailyBudgetInr: z.number().int().positive(),
  bestSeason: z.string(),
  tags: z.array(z.string()),
  status: publishStatusSchema,
});

export const destinationListQuerySchema = paginationQuerySchema.extend({
  country: z.string().optional(),
  region: z.string().optional(),
  tag: z.string().optional(),
  status: publishStatusSchema.optional(),
});

export const upsertDestinationRequestSchema = destinationSchema
  .omit({
    id: true,
  })
  .partial({
    status: true,
  });

export type SourceAttribution = z.infer<typeof sourceAttributionSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type DestinationSection = z.infer<typeof destinationSectionSchema>;
export type Attraction = z.infer<typeof attractionSchema>;
export type Destination = z.infer<typeof destinationSchema>;
export type DestinationListQuery = z.infer<typeof destinationListQuerySchema>;
export type UpsertDestinationRequest = z.infer<typeof upsertDestinationRequestSchema>;

const demoSource: SourceAttribution = {
  provider: "manual-demo",
  sourceUrl: "https://travelverse.local/sources/manual-demo",
  license: "Internal demo content",
  fetchedAt: "2026-08-07T00:00:00.000Z",
  verificationStatus: "VERIFIED",
};

export const sampleDestinations: Destination[] = [
  {
    id: "dst-jaipur",
    slug: "jaipur",
    name: "Jaipur",
    country: "India",
    region: "Rajasthan",
    tagline: "Forts, royal streets, blue pottery and sunset viewpoints.",
    summary:
      "Jaipur is a high-impact MVP destination because it has famous monuments, food, craft, history and easy route planning use cases.",
    coordinates: {
      lat: 26.9124,
      lng: 75.7873,
    },
    heroImageUrl:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1400&q=80",
    culturalHighlights: ["Amber Fort", "Hawa Mahal", "City Palace", "Jantar Mantar"],
    foodHighlights: ["Dal Baati Churma", "Pyaaz Kachori", "Ghewar"],
    danceAndArts: ["Ghoomar", "Blue pottery", "Block printing"],
    festivals: ["Jaipur Literature Festival", "Teej", "Gangaur"],
    attractions: [
      {
        name: "Amber Fort",
        summary: "A hilltop fort known for courtyards, mirror work and sunset views.",
        coordinates: {
          lat: 26.9855,
          lng: 75.8513,
        },
        estimatedCostInr: 200,
        averageVisitMinutes: 150,
        tags: ["history", "architecture", "viewpoint"],
      },
      {
        name: "Hawa Mahal",
        summary: "The iconic pink facade built for royal women to observe street life.",
        coordinates: {
          lat: 26.9239,
          lng: 75.8267,
        },
        estimatedCostInr: 50,
        averageVisitMinutes: 60,
        tags: ["history", "architecture", "photography"],
      },
    ],
    sections: [
      {
        title: "Why Jaipur matters",
        kind: "history",
        body: "Jaipur connects royal planning, fort architecture, craft markets and food culture in a compact travel route.",
      },
      {
        title: "Local taste",
        kind: "food",
        body: "A first trip should include dal baati churma, pyaaz kachori and a sweet stop for ghewar.",
      },
    ],
    media: [],
    sources: [demoSource],
    estimatedDailyBudgetInr: 2800,
    bestSeason: "October to March",
    tags: ["history", "food", "architecture", "shopping"],
    status: "PUBLISHED",
  },
  {
    id: "dst-varanasi",
    slug: "varanasi",
    name: "Varanasi",
    country: "India",
    region: "Uttar Pradesh",
    tagline: "Ghats, ancient lanes, river rituals and classical music.",
    summary:
      "Varanasi gives the project strong storytelling depth through history, spirituality, food and walking route experiences.",
    coordinates: {
      lat: 25.3176,
      lng: 82.9739,
    },
    heroImageUrl:
      "https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=1400&q=80",
    culturalHighlights: ["Dashashwamedh Ghat", "Kashi Vishwanath", "Sarnath", "Ganga Aarti"],
    foodHighlights: ["Banarasi Paan", "Kachori Sabzi", "Malaiyo"],
    danceAndArts: ["Thumri", "Banarasi silk weaving", "Classical music"],
    festivals: ["Dev Deepawali", "Ganga Mahotsav", "Mahashivratri"],
    attractions: [
      {
        name: "Dashashwamedh Ghat",
        summary: "A major riverfront ghat known for the evening Ganga Aarti.",
        coordinates: {
          lat: 25.3062,
          lng: 83.0104,
        },
        estimatedCostInr: 0,
        averageVisitMinutes: 90,
        tags: ["culture", "river", "ritual"],
      },
      {
        name: "Sarnath",
        summary: "A historic Buddhist site close to Varanasi with museums and stupas.",
        coordinates: {
          lat: 25.3811,
          lng: 83.0214,
        },
        estimatedCostInr: 50,
        averageVisitMinutes: 150,
        tags: ["history", "spiritual", "museum"],
      },
    ],
    sections: [
      {
        title: "Old city rhythm",
        kind: "culture",
        body: "The best Varanasi experience mixes ghats, narrow lanes, food stops and slow morning walks by the river.",
      },
      {
        title: "Music and craft",
        kind: "dance",
        body: "Classical music, thumri and Banarasi weaving give the city a strong cultural identity beyond sightseeing.",
      },
    ],
    media: [],
    sources: [demoSource],
    estimatedDailyBudgetInr: 2200,
    bestSeason: "November to February",
    tags: ["culture", "spiritual", "food", "walking"],
    status: "PUBLISHED",
  },
  {
    id: "dst-goa",
    slug: "goa",
    name: "Goa",
    country: "India",
    region: "Goa",
    tagline: "Beaches, Portuguese heritage, seafood and slow coastal routes.",
    summary:
      "Goa is useful for hotels, route comparison, local experiences and cost planning in one destination flow.",
    coordinates: {
      lat: 15.2993,
      lng: 74.124,
    },
    heroImageUrl:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=80",
    culturalHighlights: ["Old Goa", "Fontainhas", "Beach markets", "Portuguese-era churches"],
    foodHighlights: ["Goan fish curry", "Bebinca", "Prawn balchao"],
    danceAndArts: ["Fugdi", "Dekhni", "Azulejo-inspired design"],
    festivals: ["Carnival", "Sao Joao", "Shigmo"],
    attractions: [
      {
        name: "Fontainhas",
        summary: "A colourful heritage quarter with cafes, galleries and walking routes.",
        coordinates: {
          lat: 15.4953,
          lng: 73.8289,
        },
        estimatedCostInr: 0,
        averageVisitMinutes: 90,
        tags: ["heritage", "walking", "photography"],
      },
      {
        name: "Baga Beach",
        summary: "A popular beach belt for food, nightlife and water activities.",
        coordinates: {
          lat: 15.5553,
          lng: 73.7517,
        },
        estimatedCostInr: 0,
        averageVisitMinutes: 180,
        tags: ["beach", "food", "nightlife"],
      },
    ],
    sections: [
      {
        title: "Beyond beaches",
        kind: "culture",
        body: "Goa works best when beaches are combined with heritage streets, village food and local festival routes.",
      },
      {
        title: "Food trail",
        kind: "food",
        body: "Seafood, bakery stops and local sweets make cost planning and itinerary building very practical here.",
      },
    ],
    media: [],
    sources: [demoSource],
    estimatedDailyBudgetInr: 3500,
    bestSeason: "November to February",
    tags: ["beaches", "hotels", "nightlife", "heritage"],
    status: "PUBLISHED",
  },
];
