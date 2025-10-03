import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    ppr: true,
    useCache: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        port: '',
        search: '',
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 60, // 60 days
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
