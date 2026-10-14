"use client";

import { useState } from "react";
import Image from "next/image";

type PublicListingMediaProps = {
  src: string | null;
  unavailableLabel: string;
};

export function PublicListingMedia({
  src,
  unavailableLabel,
}: PublicListingMediaProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src !== null && failedSrc !== src;

  return (
    <div className="bg-surface-muted relative aspect-[4/3] w-full overflow-hidden rounded-md">
      {showImage ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 639px) 90vw, 224px"
          className="object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <p className="text-on-surface-muted absolute inset-0 flex items-center justify-center px-4 text-center text-sm font-medium">
          {unavailableLabel}
        </p>
      )}
    </div>
  );
}
