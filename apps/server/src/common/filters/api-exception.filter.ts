import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

type ExceptionResponseBody = {
  details?: unknown;
  error?: string;
  message?: string | string[];
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const body = this.toResponseBody(status, exceptionResponse);

    response.status(status).json(body);
  }

  private toResponseBody(status: number, response: unknown) {
    const responseBody = this.isResponseBody(response) ? response : undefined;
    const rawMessage = responseBody?.message;
    const message =
      status === HttpStatus.INTERNAL_SERVER_ERROR
        ? "Internal server error"
        : Array.isArray(rawMessage)
          ? rawMessage.join(", ")
          : rawMessage || (typeof response === "string" ? response : "Request failed");

    return {
      code: responseBody?.error?.toUpperCase().replace(/\s+/g, "_") ?? this.toStatusCode(status),
      details: responseBody?.details,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    };
  }

  private isResponseBody(value: unknown): value is ExceptionResponseBody {
    return typeof value === "object" && value !== null;
  }

  private toStatusCode(status: number): string {
    return HttpStatus[status] ?? "API_ERROR";
  }
}
