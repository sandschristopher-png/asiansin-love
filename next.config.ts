import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Lets the Payment Request API (Google Pay / Apple Pay) run for this site and Stripe's frames,
  // so wallet buttons work in mobile Chrome and Android WebViews.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Permissions-Policy', value: 'payment=(self "https://js.stripe.com" "https://checkout.stripe.com")' }],
      },
    ];
  },
  images: {
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