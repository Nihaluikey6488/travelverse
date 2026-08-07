import { z } from "zod";

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const destinationSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  country: z.string(),
  region: z.string(),
  tagline: z.string(),
  summary: z.string(),
  coordinates: coordinatesSchema,
  heroImageUrl: z.string().url(),
  culturalHighlights: z.array(z.string()),
  estimatedDailyBudgetInr: z.number().int().positive(),
  bestSeason: z.string(),
  tags: z.array(z.string()),
});

export const transportEstimateSchema = z.object({
  mode: z.enum(["flight", "rail", "bus", "car"]),
  from: z.string(),
  to: z.string(),
  distanceKm: z.number().nonnegative(),
  durationMinutes: z.number().int().nonnegative(),
  estimatedCostInr: z.number().int().nonnegative(),
  source: z.string(),
  isLivePrice: z.boolean(),
});

export const itineraryStopSchema = z.object({
  title: z.string(),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "night"]),
  notes: z.string(),
  estimatedCostInr: z.number().int().nonnegative(),
});

export const itinerarySchema = z.object({
  destinationSlug: z.string(),
  days: z.array(
    z.object({
      day: z.number().int().positive(),
      stops: z.array(itineraryStopSchema),
    }),
  ),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Destination = z.infer<typeof destinationSchema>;
export type TransportEstimate = z.infer<typeof transportEstimateSchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;

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
    culturalHighlights: ["Amber Fort", "Hawa Mahal", "Dal Baati Churma", "Ghoomar"],
    estimatedDailyBudgetInr: 2800,
    bestSeason: "October to March",
    tags: ["history", "food", "architecture", "shopping"],
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
    culturalHighlights: ["Dashashwamedh Ghat", "Kashi Vishwanath", "Banarasi Paan", "Thumri"],
    estimatedDailyBudgetInr: 2200,
    bestSeason: "November to February",
    tags: ["culture", "spiritual", "food", "walking"],
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
    culturalHighlights: ["Old Goa", "Seafood", "Fugdi", "Beach markets"],
    estimatedDailyBudgetInr: 3500,
    bestSeason: "November to February",
    tags: ["beaches", "hotels", "nightlife", "heritage"],
  },
];
