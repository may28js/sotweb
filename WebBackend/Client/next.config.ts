import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5200/api/:path*',
        },
        {
          source: '/uploads/:path*',
          destination: 'http://localhost:5200/uploads/:path*',
        },
      ];
    },
};

export default nextConfig;
