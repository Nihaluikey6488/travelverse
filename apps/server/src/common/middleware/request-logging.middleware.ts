import { Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";

const logger = new Logger("HttpRequest");

export function requestLoggingMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const startedAt = process.hrtime.bigint();
  const requestId = getRequestId(request);

  response.setHeader("x-request-id", requestId);

  response.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const payload = {
      durationMs: Math.round(durationMs),
      method: request.method,
      path: request.originalUrl ?? request.url,
      releaseSha: env.RELEASE_SHA,
      requestId,
      service: "travelverse-api",
      statusCode: response.statusCode,
      timestamp: new Date().toISOString(),
      userAgent: request.get("user-agent") ?? "unknown",
    };
    const message =
      env.LOG_FORMAT === "json"
        ? JSON.stringify(payload)
        : `${payload.method} ${payload.path} ${payload.statusCode} ${payload.durationMs}ms requestId=${requestId}`;

    if (response.statusCode >= 500) {
      logger.error(message);
      return;
    }

    if (response.statusCode >= 400) {
      logger.warn(message);
      return;
    }

    logger.log(message);
  });

  next();
}

function getRequestId(request: Request) {
  const header = request.headers["x-request-id"];

  if (Array.isArray(header)) {
    return header[0] ?? randomUUID();
  }

  return header ?? randomUUID();
}
