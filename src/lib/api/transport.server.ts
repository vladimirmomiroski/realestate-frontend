import "server-only";

import { env } from "@/config/env.server";

import {
  ApiAbortError,
  ApiHttpError,
  ApiNetworkError,
  ApiProblemError,
  MalformedApiResponseError,
  normalizeApiProblem,
} from "./api-error";
import { serializeQueryParams, type QueryParams } from "./query-params";

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export type SuccessBodyParser<T> = (value: unknown) => T;

export type ApiRequestOptions = {
  path: string;
  method?: ApiMethod;
  query?: QueryParams;
  omitEmptyStringQueryKeys?: readonly string[];
  headers?: HeadersInit;
  body?: JsonValue | FormData;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  signal?: AbortSignal;
  bearerToken?: string;
};

function createApiUrl(
  path: string,
  query: QueryParams | undefined,
  omitEmptyStringQueryKeys: readonly string[] | undefined
) {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("?") ||
    path.includes("#")
  ) {
    throw new TypeError("API path must be a root-relative application path.");
  }

  let decodedPath: string;

  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    throw new TypeError("API path contains invalid URL encoding.");
  }

  if (
    decodedPath.includes("\\") ||
    decodedPath.startsWith("//") ||
    decodedPath
      .split("/")
      .some((segment) => segment === "." || segment === "..")
  ) {
    throw new TypeError("API path must not contain traversal segments.");
  }

  const baseUrl = new URL(env.API_BASE_URL);
  const url = new URL(path, `${baseUrl.origin}/`);

  if (url.origin !== baseUrl.origin) {
    throw new TypeError("API path must remain on the configured API origin.");
  }

  if (query) {
    const serialized = serializeQueryParams(query, {
      omitEmptyStringFor: omitEmptyStringQueryKeys,
    });

    if (serialized) {
      url.search = serialized;
    }
  }

  return url;
}

function isJsonMediaType(contentType: string | null) {
  if (!contentType) {
    return false;
  }

  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();

  return (
    mediaType === "application/json" || mediaType?.endsWith("+json") === true
  );
}

function getRequestId(response: Response) {
  const requestId = response.headers.get("X-Request-ID")?.trim();

  return requestId || undefined;
}

function isAbortFailure(error: unknown, signal: AbortSignal | undefined) {
  return (
    signal?.aborted === true ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError")
  );
}

function isClassifiedError(error: unknown) {
  return (
    error instanceof ApiProblemError ||
    error instanceof ApiHttpError ||
    error instanceof MalformedApiResponseError ||
    error instanceof ApiNetworkError ||
    error instanceof ApiAbortError
  );
}

async function readResponse<T>(
  response: Response,
  parseJson: SuccessBodyParser<T> | undefined
): Promise<T | unknown | undefined> {
  const requestId = getRequestId(response);

  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const contentType = response.headers.get("content-type");
  const responseBody = await response.text();

  if (response.ok && responseBody.length === 0) {
    return undefined;
  }

  if (!isJsonMediaType(contentType)) {
    if (response.ok) {
      throw new MalformedApiResponseError(
        response.status,
        "unexpected-content-type",
        requestId
      );
    }

    throw new ApiHttpError(
      response.status,
      response.statusText,
      requestId,
      contentType ?? undefined,
      responseBody || undefined
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(responseBody);
  } catch (error) {
    if (response.ok) {
      throw new MalformedApiResponseError(
        response.status,
        "invalid-json",
        requestId,
        { cause: error }
      );
    }

    throw new ApiHttpError(
      response.status,
      response.statusText,
      requestId,
      contentType ?? undefined,
      responseBody || undefined
    );
  }

  if (!response.ok) {
    const problem = normalizeApiProblem(parsed, response.status, requestId);

    if (problem) {
      throw new ApiProblemError(problem);
    }

    throw new ApiHttpError(
      response.status,
      response.statusText,
      requestId,
      contentType ?? undefined,
      responseBody || undefined
    );
  }

  if (!parseJson) {
    return parsed;
  }

  try {
    return parseJson(parsed);
  } catch (error) {
    throw new MalformedApiResponseError(
      response.status,
      "invalid-success-body",
      requestId,
      { cause: error }
    );
  }
}

export function requestApi<T>(
  options: ApiRequestOptions & { parseJson: SuccessBodyParser<T> }
): Promise<T | undefined>;

export function requestApi(
  options: ApiRequestOptions & { parseJson?: undefined }
): Promise<unknown | undefined>;

export async function requestApi<T>(
  options: ApiRequestOptions & { parseJson?: SuccessBodyParser<T> }
): Promise<T | unknown | undefined> {
  const {
    bearerToken,
    body,
    cache,
    headers: additionalHeaders,
    method = "GET",
    next,
    omitEmptyStringQueryKeys,
    parseJson,
    path,
    query,
    signal,
  } = options;
  const url = createApiUrl(path, query, omitEmptyStringQueryKeys);
  const headers = new Headers(additionalHeaders);

  headers.delete("X-Request-ID");
  headers.delete("Authorization");

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (bearerToken !== undefined) {
    const token = bearerToken.trim();

    if (!token) {
      throw new TypeError("Bearer token must not be empty.");
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  let requestBody: BodyInit | undefined;

  if (body instanceof FormData) {
    headers.delete("Content-Type");
    requestBody = body;
  } else if (body !== undefined) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    requestBody = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
      cache,
      next,
      signal,
    });

    return await readResponse(response, parseJson);
  } catch (error) {
    if (isClassifiedError(error)) {
      throw error;
    }

    if (isAbortFailure(error, signal)) {
      throw new ApiAbortError({ cause: error });
    }

    throw new ApiNetworkError({ cause: error });
  }
}
