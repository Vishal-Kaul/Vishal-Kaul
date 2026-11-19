import type { NextConfig } from "next";

// Only Vishal's published Framer site (and this app itself) may embed the assistant.
// If the site gets a custom domain, add it here. The Framer editor preview won't
// render the embed; test on the published site.
const FRAME_ANCESTORS = [
  "'self'",
  "https://vishaluxi.framer.website",
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
