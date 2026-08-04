"use client";

import { useId } from "react";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  description: string;
  onRetry?: () => void;
  requestId?: string;
  requestIdLabel?: string;
  retryLabel?: string;
  title: string;
};

export function ErrorState({
  description,
  onRetry,
  requestId,
  requestIdLabel,
  retryLabel,
  title,
}: ErrorStateProps) {
  const titleId = useId();

  return (
    <section
      role="alert"
      aria-labelledby={titleId}
      className="border-border bg-surface mx-auto my-12 max-w-xl rounded-lg border p-6 shadow-sm"
    >
      <h1 id={titleId} className="text-2xl font-semibold">
        {title}
      </h1>
      <p className="text-on-surface-muted mt-3 leading-7">{description}</p>
      {requestId && requestIdLabel ? (
        <dl className="bg-surface-muted mt-5 rounded-md p-3 text-sm">
          <dt className="font-semibold">{requestIdLabel}</dt>
          <dd className="font-mono break-all">{requestId}</dd>
        </dl>
      ) : null}
      {onRetry && retryLabel ? (
        <Button className="mt-6" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </section>
  );
}
