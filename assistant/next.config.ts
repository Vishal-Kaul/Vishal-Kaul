import type { NextConfig } from "next";

// Only Vishal's Framer site (and this app itself) may embed the assistant.
const FRAME_ANCESTORS = [
  "'self'",
  "https://vishaluxi.framer.website",
  "https://*.framer.website",
  "https://*.framer.app",
  "https://framer.com",
  "https://*.framer.com",
].join(" ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "Content-Security-Policy", value: `frame-ancestors ${FRAME_ANCESTORS}` }],
      },
    ];
  },
};

export default nextConfig;
