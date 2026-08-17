import { expect, test, type Page } from "@playwright/test";
import { sampleDestinations } from "@travelverse/contracts";

test.describe("TravelVerse critical browser journeys", () => {
  test("main user can move from cinematic home to published discovery", async ({ page }) => {
    await mockTravelVerseApi(page);
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /spin the world/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /explore story/i })).toBeVisible();

    await page.getByLabel(/search destinations/i).fill("food");
    await expect(page.getByText("Jaipur").first()).toBeVisible();

    await page.getByRole("link", { name: /explore story/i }).click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(page.getByRole("heading", { name: /3 destinations found/i })).toBeVisible();
  });

  test("administrator can publish a draft from the destination workspace", async ({ page }) => {
    const draft = {
      ...sampleDestinations[0],
      status: "DRAFT" as const,
    };
    const published = {
      ...draft,
      status: "PUBLISHED" as const,
    };

    await mockTravelVerseApi(page, { draft, published });

    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/admin/destinations");
    await expect(page.getByRole("heading", { name: /destination admin/i })).toBeVisible();
    await expect(page.getByText("DRAFT").first()).toBeVisible();

    await page.getByRole("button", { name: /publish/i }).first().click();
    await expect(page.getByText(/published jaipur/i)).toBeVisible();
  });
});

async function mockTravelVerseApi(
  page: Page,
  admin?: {
    draft: (typeof sampleDestinations)[number];
    published: (typeof sampleDestinations)[number];
  },
) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === "/api/auth/me") {
      await route.fulfill({
        contentType: "application/json",
        json: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
          statusCode: 401,
          timestamp: new Date("2026-08-17T00:00:00.000Z").toISOString(),
        },
        status: 401,
      });
      return;
    }

    if (url.pathname === "/api/auth/admin-check") {
      await route.fulfill({
        contentType: "application/json",
        json: {
          user: {
            email: "admin@travelverse.local",
            id: "66b1f7f4f2f1a91f0d0a1111",
            name: "Admin Traveller",
            role: "ADMIN",
          },
        },
      });
      return;
    }

    if (url.pathname === "/api/destinations/facets") {
      await route.fulfill({
        contentType: "application/json",
        json: {
          activities: ["architecture", "food", "history"],
          categories: ["culture", "food", "history"],
          countries: ["India"],
          regions: ["Goa", "Rajasthan", "Uttar Pradesh"],
          tags: ["beaches", "food", "history"],
        },
      });
      return;
    }

    if (url.pathname === "/api/destinations") {
      await route.fulfill({
        contentType: "application/json",
        json: {
          data: sampleDestinations,
          meta: {
            limit: 6,
            page: 1,
            total: sampleDestinations.length,
            totalPages: 1,
          },
        },
      });
      return;
    }

    if (admin && url.pathname === "/api/admin/destinations") {
      await route.fulfill({
        contentType: "application/json",
        json: {
          data: [admin.draft],
          meta: {
            limit: 50,
            page: 1,
            total: 1,
            totalPages: 1,
          },
        },
      });
      return;
    }

    if (admin && url.pathname === "/api/admin/destinations/jaipur/publish") {
      await route.fulfill({
        contentType: "application/json",
        json: admin.published,
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      json: {
        code: "NOT_FOUND",
        message: `No E2E mock for ${url.pathname}`,
        statusCode: 404,
        timestamp: new Date("2026-08-17T00:00:00.000Z").toISOString(),
      },
      status: 404,
    });
  });
}
