import { Injectable, NotFoundException } from "@nestjs/common";
import { sampleDestinations } from "@travelverse/contracts";
import type { Destination } from "@travelverse/contracts";

@Injectable()
export class DestinationsService {
  findAll(): Destination[] {
    return sampleDestinations;
  }

  findBySlug(slug: string): Destination {
    const destination = sampleDestinations.find((item) => item.slug === slug);

    if (!destination) {
      throw new NotFoundException(`Destination "${slug}" was not found`);
    }

    return destination;
  }
}
