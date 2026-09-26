import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'asiansin.love',
    short_name: 'asiansin.love',
    description: 'Verified, intentional relationships connecting Southeast Asian singles with international gentlemen.',
    start_url: '/',
    display: 'standalone',
    background_color: '#17131F',
    theme_color: '#17131F',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
