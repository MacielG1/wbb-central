import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
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
};

export default nextConfig;
