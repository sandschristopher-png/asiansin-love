import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    // Serve modern formats; Next picks AVIF, then WebP, by the browser's Accept header.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 414, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [32, 48, 64, 96, 128, 160, 240, 320],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;