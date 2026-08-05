import type { components } from "@/contracts/generated/openapi";

export type ProblemDetailsWire =
  components["schemas"]["ApiProblemDetailsResponse"];

export type ValidationProblemDetailsWire =
  components["schemas"]["ApiValidationProblemDetailsResponse"];

export type ValidationErrors = Record<string, string[]>;

export type CanonicalProblemDetails = {
  code: string;
  detail?: string | null;
  errors?: ValidationErrors;
  instance?: string | null;
  status: number;
  title: string;
  traceId?: string | null;
  type?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalNullableString(value: Record<string, unknown>, key: string) {
  return (
    !(key in value) || value[key] === null || typeof value[key] === "string"
  );
}

export function isValidationErrors(value: unknown): value is ValidationErrors {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (messages) =>
        Array.isArray(messages) &&
        messages.every((message) => typeof message === "string")
    )
  );
}

export function isCanonicalProblemDetails(
  value: unknown
): value is CanonicalProblemDetails {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.status === "number" &&
    Number.isInteger(value.status) &&
    value.status >= 100 &&
    value.status <= 599 &&
    typeof value.code === "string" &&
    value.code.length > 0 &&
    typeof value.title === "string" &&
    value.title.length > 0 &&
    isOptionalNullableString(value, "type") &&
    isOptionalNullableString(value, "detail") &&
    isOptionalNullableString(value, "instance") &&
    isOptionalNullableString(value, "traceId") &&
    (!("errors" in value) || isValidationErrors(value.errors))
  );
}

export function isValidationProblemDetails(
  value: unknown
): value is CanonicalProblemDetails & { errors: ValidationErrors } {
  return (
    isCanonicalProblemDetails(value) &&
    "errors" in value &&
    isValidationErrors(value.errors)
  );
}
