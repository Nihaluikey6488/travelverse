import type { Model } from "mongoose";
import { describe, expect, it, vi } from "vitest";
import { DestinationsService } from "../../src/modules/destinations/destinations.service";
import type { DestinationDocument } from "../../src/modules/destinations/schemas/destination.schema";

function makeDestinationRecord(overrides: Record<string, unknown> = {}) {
  return {
    _id: "mongo-destination-id",
    attractions: [],
    bestSeason: "October to March",
    coordinates: {
      lat: 26.9124,
      lng: 75.7873,
    },
    country: "India",
    culturalHighlights: ["Forts"],
    danceAndArts: ["Ghoomar"],
    estimatedDailyBudgetInr: 2800,
    festivals: ["Teej"],
    foodHighlights: ["Kachori"],
    heroImageUrl: "https://example.com/hero.jpg",
    media: [],
    name: "Jaipur",
    region: "Rajasthan",
    sections: [],
    slug: "jaipur",
    sources: [],
    status: "PUBLISHED",
    summary: "Pink city summary",
    tagline: "Forts and food",
    tags: ["history"],
    ...overrides,
  };
}

function makeLeanChain(result: unknown) {
  return {
    exec: vi.fn().mockResolvedValue(result),
    lean: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
  };
}

function makeService(model: Partial<Model<DestinationDocument>>) {
  return new DestinationsService(model as Model<DestinationDocument>);
}

describe("DestinationsService", () => {
  it("lists only published destinations for public discovery", async () => {
    const findChain = makeLeanChain([makeDestinationRecord()]);
    const countExec = vi.fn().mockResolvedValue(1);
    const model = {
      countDocuments: vi.fn().mockReturnValue({ exec: countExec }),
      find: vi.fn().mockReturnValue(findChain),
    };
    const service = makeService(model);

    const response = await service.findPublished({
      limit: 12,
      page: 1,
    });

    expect(model.find).toHaveBeenCalledWith({ status: "PUBLISHED" }, undefined);
    expect(model.countDocuments).toHaveBeenCalledWith({ status: "PUBLISHED" });
    expect(response.meta.total).toBe(1);
    expect(response.data[0]?.slug).toBe("jaipur");
  });

  it("creates admin drafts by default", async () => {
    const create = vi.fn().mockResolvedValue({
      toObject: () => makeDestinationRecord({ status: "DRAFT" }),
    });
    const service = makeService({
      create,
    });

    const response = await service.create({
      attractions: [],
      bestSeason: "October to March",
      coordinates: {
        lat: 26.9124,
        lng: 75.7873,
      },
      country: "India",
      culturalHighlights: [],
      danceAndArts: [],
      estimatedDailyBudgetInr: 2800,
      festivals: [],
      foodHighlights: [],
      heroImageUrl: "https://example.com/hero.jpg",
      media: [],
      name: "Jaipur",
      region: "Rajasthan",
      sections: [],
      slug: "jaipur",
      sources: [],
      summary: "Pink city summary",
      tagline: "Forts and food",
      tags: [],
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ status: "DRAFT" }));
    expect(response.status).toBe("DRAFT");
  });

  it("updates only provided destination fields", async () => {
    const chain = makeLeanChain(makeDestinationRecord({ summary: "Updated story" }));
    const findOneAndUpdate = vi.fn().mockReturnValue(chain);
    const service = makeService({
      findOneAndUpdate,
    });

    const response = await service.update("jaipur", {
      summary: "Updated story",
    });

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { slug: "jaipur" },
      {
        $set: {
          summary: "Updated story",
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );
    expect(response.summary).toBe("Updated story");
  });

  it("publishes a destination by slug", async () => {
    const chain = makeLeanChain([makeDestinationRecord()]);
    chain.exec.mockResolvedValue(makeDestinationRecord({ status: "PUBLISHED" }));
    const findOneAndUpdate = vi.fn().mockReturnValue(chain);
    const service = makeService({
      findOneAndUpdate,
    });

    const response = await service.publish("jaipur");

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { slug: "jaipur" },
      {
        $set: {
          status: "PUBLISHED",
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );
    expect(response.status).toBe("PUBLISHED");
  });
});
