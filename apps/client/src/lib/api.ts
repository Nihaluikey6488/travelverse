export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type ApiResponseParser<TResponse> = (payload: unknown) => TResponse;

export interface ApiRequestOptions<TResponse> extends Omit<RequestInit, "body"> {
  body?: unknown;
  parse?: ApiResponseParser<TResponse>;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions<TResponse> = {},
): Promise<TResponse> {
  const { body, parse, ...requestInit } = options;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestInit,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiRequestError(message, response.status);
  }

  const payload = (await response.json()) as unknown;

  return parse ? parse(payload) : (payload as TResponse);
}

export async function apiGet<TResponse>(
  path: string,
  parse?: ApiResponseParser<TResponse>,
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    parse,
  });
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    const message = payload.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    return message ?? `API request failed with status ${response.status}`;
  } catch {
    return `API request failed with status ${response.status}`;
  }
}
