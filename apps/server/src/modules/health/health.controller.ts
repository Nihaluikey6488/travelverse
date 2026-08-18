import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import mongoose from "mongoose";
import { getProviderBudgetSnapshot } from "../../common/provider-budget";
import { env } from "../../config/env";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    const database = getDatabaseHealth();

    return {
      database,
      environment: env.NODE_ENV,
      name: "travelverse-api",
      ok: true,
      providerBudget: getProviderBudgetSnapshot(),
      releaseSha: env.RELEASE_SHA,
      serviceVersion: env.SERVICE_VERSION,
      status: "alive",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  @Get("readiness")
  readiness(@Res({ passthrough: true }) response: Response) {
    const database = getDatabaseHealth();
    const ok = database.ok;

    if (!ok) {
      response.status(503);
    }

    return {
      database,
      environment: env.NODE_ENV,
      errorMonitoring: env.SENTRY_DSN ? "configured" : "not_configured",
      name: "travelverse-api",
      ok,
      providers: {
        geocoding: getProviderStatus(env.NOMINATIM_BASE_URL),
        knowledge: getProviderStatus(env.WIKIPEDIA_API_BASE_URL),
        routing: getProviderStatus(env.OSRM_BASE_URL),
      },
      releaseSha: env.RELEASE_SHA,
      serviceVersion: env.SERVICE_VERSION,
      status: ok ? "ready" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}

function getDatabaseHealth() {
  const state = mongoose.connection.readyState;

  return {
    name: mongoose.connection.name || env.MONGODB_DB_NAME,
    ok: state === 1,
    state: getConnectionStateLabel(state),
  };
}

function getConnectionStateLabel(state: number) {
  const labels: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return labels[state] ?? "unknown";
}

function getProviderStatus(baseUrl: string) {
  return {
    baseUrl,
    configured: Boolean(baseUrl),
  };
}
