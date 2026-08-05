import type { NextConfig } from "next";

import { parseRuntimeEnvironment } from "./src/config/env";

const { MEDIA_BASE_URL } = parseRuntimeEnvironment(process.env);
const mediaUrl = new URL(MEDIA_BASE_URL);

const nextConfig: NextConfig = {
  images: {
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
