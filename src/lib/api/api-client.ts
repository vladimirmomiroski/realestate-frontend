const DEFAULT_API_BASE_URL = "http://localhost:5231";

export type ApiQueryValue = string | number | boolean | null | undefined;

export type ApiQueryParams = Record<string, ApiQueryValue>;

type ApiGetOptions = Omit<RequestInit, "body" | "method"> & {
  query?: ApiQueryParams;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly statusText: string,
    readonly url: string,
    readonly responseBody?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    DEFAULT_API_BASE_URL
  );
}

function createApiUrl(path: string, query?: ApiQueryParams) {
  const normalizedBaseUrl = getApiBaseUrl().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizedBaseUrl}${normalizedPath}`);

  if (!query) {
    return url;
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return response.text();
  }

  const body = (await response.json()) as unknown;
  return JSON.stringify(body);
}

export async function apiGet<TResponse>(
  path: string,
  { query, headers, ...init }: ApiGetOptions = {}
): Promise<TResponse> {
  const url = createApiUrl(path, query);
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    method: "GET",
    headers: requestHeaders,
  });

  if (!response.ok) {
    const responseBody = await readResponseBody(response);
    const message = `API GET ${url.pathname} failed with ${response.status} ${response.statusText}`;

    throw new ApiError(
      message,
      response.status,
      response.statusText,
      url.toString(),
      responseBody
    );
  }

  return (await response.json()) as TResponse;
}
