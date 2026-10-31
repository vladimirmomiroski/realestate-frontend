import type { NextConfig } from "next";

import { parseRuntimeEnvironment } from "./src/config/env";

const { MEDIA_BASE_URL } = parseRuntimeEnvironment(process.env);
const mediaUrl = new URL(MEDIA_BASE_URL);

const nextConfig: NextConfig = {
  // Preserve special query keys for the catalog's query-presence indexing policy.
  skipProxyUrlNormalize: true,
  images: {
    dangerouslyAllowLocalIP:
      process.env.NODE_ENV !== "production" &&
      (mediaUrl.hostname === "localhost" || mediaUrl.hostname === "127.0.0.1"),
    remotePatterns: [
      {
        protocol: mediaUrl.protocol === "http:" ? "http" : "https",
        hostname: mediaUrl.hostname,
        port: mediaUrl.port,
        pathname: "/uploads/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
