import { z } from "zod";
import {
  coordinatesSchema,
  mongoIdSchema,
  paginationQuerySchema,
  paginatedResponseSchema,
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
  activity: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
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

export const updateDestinationRequestSchema = upsertDestinationRequestSchema.partial();

export const destinationListResponseSchema = paginatedResponseSchema(destinationSchema);

export const destinationFacetResponseSchema = z.object({
  activities: z.array(z.string()),
  categories: z.array(z.string()),
  countries: z.array(z.string()),
  regions: z.array(z.string()),
  tags: z.array(z.string()),
});

export const favouriteListResponseSchema = z.object({
  destinationSlugs: z.array(slugSchema),
});

export const favouriteMutationResponseSchema = favouriteListResponseSchema.extend({
  destinationSlug: slugSchema,
  isFavourite: z.boolean(),
});

export const destinationImportSearchQuerySchema = z.object({
  query: z.string().trim().min(2),
  limit: z.coerce.number().int().positive().max(10).default(5),
});

export const destinationImportCandidateSchema = z.object({
  externalId: z.string().min(1),
  provider: z.string().min(1),
  name: z.string().min(1),
  displayName: z.string().min(1),
  country: z.string().optional(),
  region: z.string().optional(),
  coordinates: coordinatesSchema,
  category: z.string().optional(),
  importance: z.number().optional(),
  sourceUrl: z.string().url(),
  wikipediaTitle: z.string().optional(),
  wikidataId: z.string().optional(),
});

export const destinationImportSearchResponseSchema = z.object({
  data: z.array(destinationImportCandidateSchema),
  warnings: z.array(z.string()),
});

export const destinationImportRequestSchema = z.object({
  candidate: destinationImportCandidateSchema,
});

export const destinationImportPreviewSchema = z.object({
  candidate: destinationImportCandidateSchema,
  draft: upsertDestinationRequestSchema,
  importedFields: z.array(z.string()),
  sources: z.array(sourceAttributionSchema),
  warnings: z.array(z.string()),
});

export const destinationImportResultSchema = destinationImportPreviewSchema.extend({
  destination: destinationSchema,
});

export type SourceAttribution = z.infer<typeof sourceAttributionSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type DestinationSection = z.infer<typeof destinationSectionSchema>;
export type Attraction = z.infer<typeof attractionSchema>;
export type Destination = z.infer<typeof destinationSchema>;
export type DestinationListQuery = z.infer<typeof destinationListQuerySchema>;
export type DestinationFacetResponse = z.infer<typeof destinationFacetResponseSchema>;
export type UpsertDestinationRequest = z.infer<typeof upsertDestinationRequestSchema>;
export type UpdateDestinationRequest = z.infer<typeof updateDestinationRequestSchema>;
export type DestinationListResponse = z.infer<typeof destinationListResponseSchema>;
export type FavouriteListResponse = z.infer<typeof favouriteListResponseSchema>;
export type FavouriteMutationResponse = z.infer<typeof favouriteMutationResponseSchema>;
export type DestinationImportSearchQuery = z.infer<typeof destinationImportSearchQuerySchema>;
export type DestinationImportCandidate = z.infer<typeof destinationImportCandidateSchema>;
export type DestinationImportSearchResponse = z.infer<typeof destinationImportSearchResponseSchema>;
export type DestinationImportRequest = z.infer<typeof destinationImportRequestSchema>;
export type DestinationImportPreview = z.infer<typeof destinationImportPreviewSchema>;
export type DestinationImportResult = z.infer<typeof destinationImportResultSchema>;

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
        title: "Royal craft culture",
        kind: "culture",
        body: "The city is known for planned pink facades, palace courtyards, block printing, blue pottery and market streets that still feel active rather than museum-like.",
      },
      {
        title: "Local taste",
        kind: "food",
        body: "A first trip should include dal baati churma, pyaaz kachori and a sweet stop for ghewar.",
      },
      {
        title: "Ghoomar and handmade rhythm",
        kind: "dance",
        body: "Ghoomar performances, puppet storytelling and textile work give Jaipur a strong evening culture beyond monuments.",
      },
      {
        title: "Festival windows",
        kind: "festival",
        body: "Teej, Gangaur and the Jaipur Literature Festival create high-energy seasonal reasons to plan the trip around specific dates.",
      },
      {
        title: "Practical route advice",
        kind: "travelTip",
        body: "Start Amber Fort early, keep Hawa Mahal and City Palace for the old-city walking block, and leave evening buffer for traffic near markets.",
      },
    ],
    media: [
      {
        alt: "Amber fort walls and Jaipur hill route",
        credit: "Unsplash",
        license: "Unsplash license",
        type: "image",
        url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80",
      },
      {
        alt: "Pink architecture and old city facade in Jaipur",
        credit: "Unsplash",
        license: "Unsplash license",
        type: "image",
        url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
      },
    ],
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
        title: "Ancient river city",
        kind: "history",
        body: "Varanasi is one of India’s oldest living urban cultures, where temple lanes, ghats and river rituals shape the travel experience.",
      },
      {
        title: "Old city rhythm",
        kind: "culture",
        body: "The best Varanasi experience mixes ghats, narrow lanes, food stops and slow morning walks by the river.",
      },
      {
        title: "Street breakfast trail",
        kind: "food",
        body: "Kachori sabzi, lassi, paan and winter malaiyo are strong food anchors for a route that starts early and moves on foot.",
      },
      {
        title: "Music and craft",
        kind: "dance",
        body: "Classical music, thumri and Banarasi weaving give the city a strong cultural identity beyond sightseeing.",
      },
      {
        title: "Dev Deepawali glow",
        kind: "festival",
        body: "Dev Deepawali and Ganga Mahotsav turn the riverfront into a special visual experience, but also require early hotel and route planning.",
      },
      {
        title: "Practical route advice",
        kind: "travelTip",
        body: "Use walking routes around the ghats, keep Sarnath as a half-day side trip, and plan sunrise boat rides before heat and crowd build up.",
      },
    ],
    media: [
      {
        alt: "Varanasi ghats at sunrise",
        credit: "Unsplash",
        license: "Unsplash license",
        type: "image",
        url: "https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=1200&q=80",
      },
      {
        alt: "Boats on the Ganga river in Varanasi",
        credit: "Unsplash",
        license: "Unsplash license",
        type: "image",
        url: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=1200&q=80",
      },
    ],
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
        title: "Layered coastal history",
        kind: "history",
        body: "Goa’s churches, forts, village lanes and Portuguese-era architecture make it more than a beach stop.",
      },
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
      {
        title: "Fugdi and coastal performance",
        kind: "dance",
        body: "Fugdi, Dekhni and village festival performances add local movement and music to an otherwise beach-heavy itinerary.",
      },
      {
        title: "Carnival and monsoon mood",
        kind: "festival",
        body: "Carnival, Sao Joao and Shigmo change the mood of the trip, while monsoon months suit slower heritage and cafe routes.",
      },
      {
        title: "Practical route advice",
        kind: "travelTip",
        body: "Split North Goa beach activity from Old Goa and Fontainhas heritage walks; bike rentals help, but late-night routes need safety planning.",
      },
    ],
    media: [
      {
        alt: "Goa coastline with palms and beach route",
        credit: "Unsplash",
        license: "Unsplash license",
        type: "image",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      },
      {
        alt: "Goa heritage street and colourful houses",
        credit: "Unsplash",
        license: "Unsplash license",
        type: "image",
        url: "https://images.unsplash.com/photo-1558960214-f4283a743867?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    sources: [demoSource],
    estimatedDailyBudgetInr: 3500,
    bestSeason: "November to February",
    tags: ["beaches", "hotels", "nightlife", "heritage"],
    status: "PUBLISHED",
  },
];
