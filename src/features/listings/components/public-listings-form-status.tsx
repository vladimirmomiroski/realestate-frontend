"use client";

import { useFormStatus } from "react-dom";

export function PublicListingsFormStatus({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return pending ? (
    <p role="status" className="text-on-surface-muted mt-3 text-sm">
      {label}
    </p>
  ) : null;
}
