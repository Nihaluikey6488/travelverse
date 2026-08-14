import { Body, Controller, Post } from "@nestjs/common";
import {
  transportComparisonRequestSchema,
  type TransportComparisonRequest,
  type TransportComparisonResponse,
} from "@travelverse/contracts";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { TransportService } from "./transport.service";

@Controller("transport")
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post("compare")
  compare(
    @Body(new ZodValidationPipe(transportComparisonRequestSchema))
    request: TransportComparisonRequest,
  ): Promise<TransportComparisonResponse> {
    return this.transportService.compare(request);
  }
}
