import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(|submit)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://*.wix.com https://*.wixsite.com https://*.wixstudio.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
