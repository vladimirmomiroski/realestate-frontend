"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/feedback/error-state";
import { useClientDictionary } from "@/i18n/client-context";

type LocaleErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function LocaleError({
  error,
  unstable_retry,
}: LocaleErrorProps) {
  const dictionary = useClientDictionary();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title={dictionary.errors.genericTitle}
      description={dictionary.errors.genericDescription}
      retryLabel={dictionary.errors.retry}
      onRetry={unstable_retry}
      requestId={error.digest}
      requestIdLabel={dictionary.errors.requestIdLabel}
    />
  );
}
