import { describe, expect, it, vi } from "vitest";
import type { DestinationImportCandidate } from "@travelverse/contracts";
import { DestinationImportService } from "../../src/modules/destinations/import/destination-import.service";
import type { NominatimGeocodingProvider } from "../../src/modules/destinations/import/nominatim-geocoding.provider";
import type { WikimediaKnowledgeProvider } from "../../src/modules/destinations/import/wikimedia-knowledge.provider";
import type { DestinationsService } from "../../src/modules/destinations/destinations.service";

const candidate: DestinationImportCandidate = {
  coordinates: {
    lat: 24.5854,
    lng: 73.7125,
  },
  country: "India",
  displayName: "Udaipur, Rajasthan, India",
  externalId: "nominatim:123",
  name: "Udaipur",
  provider: "nominatim",
  region: "Rajasthan",
  sourceUrl: "https://www.openstreetmap.org/relation/123",
  wikipediaTitle: "Udaipur",
};

function makeService({
  create = vi.fn(),
  enrich = vi.fn(),
  search = vi.fn(),
}: {
  create?: ReturnType<typeof vi.fn>;
  enrich?: ReturnType<typeof vi.fn>;
  search?: ReturnType<typeof vi.fn>;
}) {
  return new DestinationImportService(
    {
      search,
    } as unknown as NominatimGeocodingProvider,
    {
      enrich,
    } as unknown as WikimediaKnowledgeProvider,
    {
      create,
    } as unknown as DestinationsService,
  );
}

describe("DestinationImportService", () => {
  it("returns safe warnings when geocoding provider fails", async () => {
    const service = makeService({
      search: vi.fn().mockRejectedValue(new Error("quota reached")),
    });

    const response = await service.search({
      limit: 5,
      query: "Udaipur",
    });

    expect(response.data).toEqual([]);
    expect(response.warnings[0]).toContain("Geocoding provider");
  });

  it("builds an unpublished draft preview from provider data", async () => {
    const service = makeService({
      enrich: vi.fn().mockResolvedValue({
        description: "City of lakes",
        imageUrl: "https://upload.wikimedia.org/udaipur.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Udaipur",
        summary: "Udaipur is known for lakes, palaces and heritage streets.",
        title: "Udaipur",
      }),
    });

    const preview = await service.preview({
      candidate,
    });

    expect(preview.draft.status).toBe("DRAFT");
    expect(preview.draft.slug).toBe("udaipur-rajasthan-india");
    expect(preview.draft.sources).toHaveLength(2);
    expect(preview.importedFields).toContain("hero image");
  });

  it("imports the preview as a draft destination", async () => {
    const create = vi.fn().mockImplementation((payload) =>
      Promise.resolve({
        id: "destination-id",
        ...payload,
      }),
    );
    const service = makeService({
      create,
      enrich: vi.fn().mockResolvedValue(null),
    });

    const result = await service.importDraft({
      candidate,
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ status: "DRAFT" }));
    expect(result.destination.slug).toBe("udaipur-rajasthan-india");
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("No Wikimedia summary")]),
    );
  });
});
