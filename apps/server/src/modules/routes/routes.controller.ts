import { Body, Controller, Post } from "@nestjs/common";
import {
  routeEstimateRequestSchema,
  type RouteEstimateRequest,
  type RouteEstimateResponse,
} from "@travelverse/contracts";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { RoutesService } from "./routes.service";

@Controller("routes")
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post("estimate")
  estimate(
    @Body(new ZodValidationPipe(routeEstimateRequestSchema)) request: RouteEstimateRequest,
  ): Promise<RouteEstimateResponse> {
    return this.routesService.estimate(request);
  }
}
