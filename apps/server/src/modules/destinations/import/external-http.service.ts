import { Injectable } from "@nestjs/common";
import { env } from "../../../config/env";

@Injectable()
export class ExternalHttpService {
  async getJson<TResponse>(url: URL): Promise<TResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.INGESTION_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": env.INGESTION_USER_AGENT,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Provider returned ${response.status} for ${url.hostname}`);
      }

      return (await response.json()) as TResponse;
    } finally {
      clearTimeout(timeout);
    }
  }
}
