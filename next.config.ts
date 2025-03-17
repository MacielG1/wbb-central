import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
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
};

export default nextConfig;
