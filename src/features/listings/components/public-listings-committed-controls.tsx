"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";

export function PublicListingsCommittedControls({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const container = useRef<HTMLDivElement>(null);
  const committedUrl = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    // Read after navigation commits. URLSearchParams.toString() would erase
    // encoding differences between distinct browser URLs (e.g. %20 and +).
    const url = window.location.pathname + window.location.search;
    if (committedUrl.current !== undefined && committedUrl.current !== url) {
      container.current?.closest("form")?.reset();
    }
    committedUrl.current = url;
  }, [pathname, searchParams]);

  return (
    <div ref={container} className={className}>
      {children}
    </div>
  );
}
