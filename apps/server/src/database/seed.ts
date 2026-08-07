import mongoose from "mongoose";
import { sampleDestinations } from "@travelverse/contracts";
import { env } from "../config/env";
import {
  DestinationDocument,
  DestinationSchema,
} from "../modules/destinations/schemas/destination.schema";

const DestinationModel = mongoose.model(DestinationDocument.name, DestinationSchema);

async function seed() {
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
  });

  for (const destination of sampleDestinations) {
    await DestinationModel.updateOne(
      {
        slug: destination.slug,
      },
      {
        $set: {
          ...destination,
          status: "PUBLISHED",
        },
      },
      {
        upsert: true,
      },
    );
  }

  console.log(`Seeded ${sampleDestinations.length} destinations into MongoDB`);
  await mongoose.disconnect();
}

void seed().catch(async (error: unknown) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
