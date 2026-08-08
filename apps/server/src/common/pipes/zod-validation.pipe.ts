import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import type { ZodTypeAny } from "zod";
import { ZodError } from "zod";

@Injectable()
export class ZodValidationPipe<TSchema extends ZodTypeAny> implements PipeTransform<unknown> {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: this.formatError(result.error),
      });
    }

    return result.data;
  }

  private formatError(error: ZodError) {
    return error.flatten().fieldErrors;
  }
}
