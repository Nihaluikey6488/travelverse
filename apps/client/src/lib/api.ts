export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
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
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiRequestError(message, response.status);
  }

  return response.json() as Promise<TResponse>;
}

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  return apiRequest<TResponse>(path);
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
