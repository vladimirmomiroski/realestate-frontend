import { isCanonicalProblemDetails } from "./problem-details";

export type ApiProblem = {
  status: number;
  code: string;
  title: string;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  requestId?: string;
};

function nonEmpty(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

export function normalizeApiProblem(
  body: unknown,
  responseStatus: number,
  responseRequestId?: string | null
): ApiProblem | null {
  if (!isCanonicalProblemDetails(body)) {
    return null;
  }

  const problem: ApiProblem = {
    status: responseStatus,
    code: body.code,
    title: body.title,
  };
  const detail = nonEmpty(body.detail);
  const instance = nonEmpty(body.instance);
  const requestId = nonEmpty(responseRequestId) ?? nonEmpty(body.traceId);

  if (detail) {
    problem.detail = detail;
  }

  if (instance) {
    problem.instance = instance;
  }

  if (body.errors) {
    problem.errors = body.errors;
  }

  if (requestId) {
    problem.requestId = requestId;
  }

  return problem;
}

export class ApiProblemError extends Error {
  readonly kind = "problem";

  constructor(readonly problem: ApiProblem) {
    super(`API request failed with ${problem.status} (${problem.code}).`);
    this.name = "ApiProblemError";
  }
}

export class ApiHttpError extends Error {
  readonly kind = "http";

  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly requestId?: string,
    readonly contentType?: string,
    readonly responseBody?: string
  ) {
    super(`API request failed with ${status} ${statusText}.`);
    this.name = "ApiHttpError";
  }
}

export type MalformedResponseReason =
  | "invalid-json"
  | "invalid-success-body"
  | "unexpected-content-type";

export class MalformedApiResponseError extends Error {
  readonly kind = "malformed-response";

  constructor(
    readonly status: number,
    readonly reason: MalformedResponseReason,
    readonly requestId?: string,
    options?: ErrorOptions
  ) {
    super(`API success response was malformed (${reason}).`, options);
    this.name = "MalformedApiResponseError";
  }
}

export class ApiNetworkError extends Error {
  readonly kind = "network";

  constructor(options?: ErrorOptions) {
    super("The API request failed before receiving a response.", options);
    this.name = "ApiNetworkError";
  }
}

export class ApiAbortError extends Error {
  readonly kind = "aborted";

  constructor(options?: ErrorOptions) {
    super("The API request was aborted.", options);
    this.name = "ApiAbortError";
  }
}

export type ClassifiedApiError =
  | ApiProblemError
  | ApiHttpError
  | MalformedApiResponseError
  | ApiNetworkError
  | ApiAbortError;
