import { Module } from "@nestjs/common";
import { TransportCostEngine } from "./transport-cost-engine";
import { TransportController } from "./transport.controller";
import {
  EstimatedBusProvider,
  EstimatedDrivingProvider,
  EstimatedRailProvider,
  SandboxFlightProvider,
} from "./transport-quote.providers";
import { TransportService } from "./transport.service";

@Module({
  controllers: [TransportController],
  providers: [
    EstimatedBusProvider,
    EstimatedDrivingProvider,
    EstimatedRailProvider,
    SandboxFlightProvider,
    TransportCostEngine,
    TransportService,
  ],
})
export class TransportModule {}
