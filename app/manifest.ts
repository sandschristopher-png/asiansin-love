import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'asiansin.love - Southeast Asian Dating',
    short_name: 'asiansin.love',
    description: 'Modern, high-trust dating platform across Southeast Asia.',
    start_url: '/browse',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#e11d48',
    icons: [
      {
        src: '/icon',
        sizes: '48x48 96x96 192x192 512x512',
        type: 'image/png',
      },
    ],
  }
}