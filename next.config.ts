import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'sharp'],
  async rewrites() {
    return [
      {
        source: '/rsc',
        destination: '/arcis',
      },
    ];
  },
};

export default nextConfig;
