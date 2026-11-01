"use client";

import { useLinkStatus } from "next/link";

export function PublicListingsLinkStatus({ label }: { label: string }) {
  const { pending } = useLinkStatus();

  return pending ? (
    <span role="status" className="text-on-surface-muted text-sm font-normal">
      {label}
    </span>
  ) : null;
}
