import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Old long-tail keyword pages -> the city hubs (lib/seo/cityData.ts), so search authority
  // consolidates on one URL per city instead of two pages competing for the same queries.
  // statusCode 301 (permanent: true would send 308).
  async redirects() {
    return [
      { source: '/dating/cebu-dating', destination: '/cebu', statusCode: 301 },
      { source: '/dating/manila-dating', destination: '/manila', statusCode: 301 },
      { source: '/dating/bangkok-dating', destination: '/bangkok', statusCode: 301 },
      { source: '/dating/phnom-penh-dating', destination: '/phnom-penh', statusCode: 301 },
      { source: '/dating/kuala-lumpur-dating', destination: '/kuala-lumpur', statusCode: 301 },
      { source: '/dating/cambodia-dating', destination: '/phnom-penh', statusCode: 301 },
      { source: '/dating/khmer-dating', destination: '/phnom-penh', statusCode: 301 },
    ];
  },
  // Lets the Payment Request API (Google Pay / Apple Pay) run for this site and Stripe's frames,
  // so wallet buttons work in mobile Chrome and Android WebViews.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Permissions-Policy', value: 'payment=(self "https://js.stripe.com" "https://checkout.stripe.com")' }],
      },
      // Static fonts, SVGs and brand images in /public: cached for a year. These URLs carry no
      // content hash, so a changed asset must ship under a new file name to reach returning
      // visitors. (next/font and /_next/static files are already hashed and immutable.)
      {
        source: '/:all*(svg|woff|woff2|ttf|otf|png|jpg|jpeg|webp|avif|ico)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  images: {
    // Next 16 only accepts listed qualities (default [75]); 95 is the landing hero photo.
    qualities: [75, 95],
    // Two-tier WebP delivery: ~640px for Discover cards, up to 1440px for the profile detail view
    // (matches the 1440px max edge from lib/utils/imageCompressor.ts). WebP only: fast to encode
    // and decoded in hardware on budget Android chipsets.
    formats: ['image/webp'],
    deviceSizes: [360, 414, 480, 640, 750, 828, 1080, 1200, 1440],
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