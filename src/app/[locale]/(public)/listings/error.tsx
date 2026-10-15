"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/feedback/error-state";
import { useClientDictionary } from "@/i18n/client-context";

export default function ListingsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { errors } = useClientDictionary();
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);

  return (
    <ErrorState
      title={errors.genericTitle}
      description={errors.genericDescription}
      retryLabel={errors.retry}
      onRetry={() => retry()}
    />
  );
}
