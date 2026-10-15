"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

type RefreshErrorStateProps = {
  title: string;
  description: string;
  requestId?: string;
  labels: Pick<
    Dictionary["errors"],
    | "retry"
    | "requestIdLabel"
    | "copyRequestId"
    | "requestIdCopied"
    | "requestIdCopyFailed"
  >;
};

export function RefreshErrorState(props: RefreshErrorStateProps) {
  // Changing/removing the ID unmounts its state, including pending copy handlers.
  // Late completions can only update the discarded instance, never the new ID.
  return <RequestErrorState key={props.requestId} {...props} />;
}

function RequestErrorState({
  title,
  description,
  requestId,
  labels,
}: RefreshErrorStateProps) {
  const router = useRouter();
  const titleId = useId();
  const enhanced = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot
  );
  const [copyMessage, setCopyMessage] = useState("");
  const latestCopyAttempt = useRef(0);

  async function copyRequestId() {
    if (!requestId) return;
    const attempt = ++latestCopyAttempt.current;
    setCopyMessage("");
    try {
      await navigator.clipboard.writeText(requestId);
      if (attempt === latestCopyAttempt.current) {
        setCopyMessage(labels.requestIdCopied);
      }
    } catch {
      if (attempt === latestCopyAttempt.current) {
        setCopyMessage(labels.requestIdCopyFailed);
      }
    }
  }

  return (
    <>
      <section
        role="alert"
        aria-labelledby={titleId}
        className="border-border bg-surface mt-10 max-w-3xl rounded-lg border p-5 sm:p-6"
      >
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <p className="text-on-surface-muted mt-3 leading-7">{description}</p>
        {requestId && (
          <div className="bg-surface-muted mt-5 rounded-md p-3">
            <dl className="text-sm">
              <dt className="font-semibold">{labels.requestIdLabel}</dt>
              <dd className="font-mono break-all">{requestId}</dd>
            </dl>
            {enhanced && (
              <Button
                variant="ghost"
                size="compact"
                className="mt-2"
                onClick={copyRequestId}
              >
                {labels.copyRequestId}
              </Button>
            )}
          </div>
        )}
        {enhanced ? (
          <Button className="mt-5" onClick={() => router.refresh()}>
            {labels.retry}
          </Button>
        ) : (
          // An empty href reloads this exact URL, including its query, without JS.
          <a
            href=""
            className="text-primary focus-visible:outline-focus-ring mt-5 inline-flex min-h-11 items-center rounded-md font-semibold underline focus-visible:outline-3 focus-visible:outline-offset-2"
          >
            {labels.retry}
          </a>
        )}
      </section>
      {copyMessage && (
        <p role="status" className="mt-3 text-sm">
          {copyMessage}
        </p>
      )}
    </>
  );
}
