import { z } from "zod";

const developmentDefaults = {
  API_BASE_URL: "http://localhost:5231",
  MEDIA_BASE_URL: "http://localhost:5231",
  SITE_URL: "http://localhost:3000",
} as const;

const originSchema = z
  .string()
  .refine(
    (value) => {
      if (!/^https?:\/\/[^/?#]+\/?$/i.test(value) || value.includes("\\")) {
        return false;
      }

      try {
        const url = new URL(value);

        return (
          (url.protocol === "http:" || url.protocol === "https:") &&
          url.username === "" &&
          url.password === "" &&
          url.pathname === "/" &&
          url.search === "" &&
          url.hash === ""
        );
      } catch {
        return false;
      }
    },
    {
      message:
        "must be an absolute HTTP or HTTPS origin without credentials, query, fragment, or path",
    }
  )
  .transform((value) => new URL(value).origin);

const runtimeEnvironmentSchema = z.object({
  API_BASE_URL: originSchema,
  MEDIA_BASE_URL: originSchema,
  SITE_URL: originSchema,
});

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export type RuntimeEnvironment = z.infer<typeof runtimeEnvironmentSchema>;

export function parseRuntimeEnvironment(
  source: EnvironmentSource
): RuntimeEnvironment {
  const isProduction = source.NODE_ENV === "production";
  const values = {
    API_BASE_URL:
      source.API_BASE_URL ??
      (isProduction ? undefined : developmentDefaults.API_BASE_URL),
    MEDIA_BASE_URL:
      source.MEDIA_BASE_URL ??
      (isProduction ? undefined : developmentDefaults.MEDIA_BASE_URL),
    SITE_URL:
      source.SITE_URL ??
      (isProduction ? undefined : developmentDefaults.SITE_URL),
  };
  const result = runtimeEnvironmentSchema.safeParse(values);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${String(issue.path[0])}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid runtime environment: ${details}`);
  }

  return result.data;
}
