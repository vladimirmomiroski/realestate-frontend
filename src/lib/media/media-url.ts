import { env } from "@/config/env.server";

const uploadsPrefix = "/uploads/";

function hasUnsafePathEncoding(value: string): boolean {
  let decoded = value;

  for (let pass = 0; pass < 5; pass += 1) {
    if (
      decoded.includes("\\") ||
      decoded.split("/").some((segment) => segment === "." || segment === "..")
    ) {
      return true;
    }

    try {
      const next = decodeURIComponent(decoded);

      if (next === decoded) {
        return false;
      }

      decoded = next;
    } catch {
      return true;
    }
  }

  return decoded.includes("%");
}

export function resolveMediaUrl(
  value: string | null | undefined
): string | null {
  if (
    !value ||
    !value.startsWith(uploadsPrefix) ||
    value.startsWith("//") ||
    value.includes("?") ||
    value.includes("#") ||
    hasUnsafePathEncoding(value)
  ) {
    return null;
  }

  try {
    const mediaOrigin = new URL(env.MEDIA_BASE_URL);
    const resolved = new URL(value, `${mediaOrigin.origin}/`);

    if (
      resolved.origin !== mediaOrigin.origin ||
      !resolved.pathname.startsWith(uploadsPrefix) ||
      resolved.search !== "" ||
      resolved.hash !== ""
    ) {
      return null;
    }

    return resolved.href;
  } catch {
    return null;
  }
}
