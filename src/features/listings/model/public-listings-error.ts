import type { Dictionary } from "@/i18n";
import {
  ApiHttpError,
  ApiNetworkError,
  ApiProblemError,
  MalformedApiResponseError,
} from "@/lib/api/api-error";

export function publicListingsError(
  error: unknown,
  labels: Dictionary["listings"]["failure"]
): { description: string; requestId?: string } | null {
  if (error instanceof ApiProblemError) {
    const { status, code, requestId } = error.problem;
    const description =
      status === 400 && code === "validation.failed"
        ? labels.validation
        : status === 500 && code === "server.unexpected"
          ? labels.server
          : labels.http;
    return { description, requestId };
  }
  if (error instanceof ApiHttpError) {
    return { description: labels.http, requestId: error.requestId };
  }
  if (error instanceof MalformedApiResponseError) {
    return { description: labels.malformed, requestId: error.requestId };
  }
  if (error instanceof ApiNetworkError) {
    return { description: labels.network };
  }
  // Cancellation and unexpected exceptions retain their original control flow.
  return null;
}
