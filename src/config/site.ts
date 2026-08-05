import "server-only";

import { env } from "./env.server";

export const siteConfig = {
  url: new URL(env.SITE_URL),
} as const;
