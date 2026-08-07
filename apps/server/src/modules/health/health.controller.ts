import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      name: "travelverse-api",
      ok: true,
      timestamp: new Date().toISOString(),
    };
  }
}
