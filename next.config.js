/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  // Optimize for low-bandwidth 3G networks
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [320, 420, 640, 768, 1024],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  // Disable unused features for performance
  experimental: {
    optimizePackageImports: ['@prisma/client'],
  },
};

module.exports = nextConfig;
