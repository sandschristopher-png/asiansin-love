import type { Metadata, Viewport } from 'next';

import PwaRegister from "@/components/PwaRegister";

import { Comfortaa, Plus_Jakarta_Sans, Outfit } from 'next/font/google';

const comfortaa = Comfortaa({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-logo',
});
import './globals.css';
import { LayoutShell } from '@/components/LayoutShell';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400','500','600','700','800'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400','500','600','700','800','900'],
  variable: '--font-brand',
});

const SITE_TITLE = 'Asians in Love - Real Connections';
const SITE_DESCRIPTION =
  'Meet genuine singles across Southeast Asia. Safe, real connections with sparks, chats, and meaningful relationships.';

export const metadata: Metadata = {
  metadataBase: new URL('https://asiansin.love'),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: 'https://asiansin.love',
    siteName: 'Asians in Love',
    type: 'website',
    locale: 'en_US',
    // TODO: add images: [{ url: '/og.jpg', width: 1200, height: 630 }] once you have a 1200x630 share image.
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6555B8',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" className={`h-full ${plusJakarta.variable} ${outfit.variable} ${comfortaa.variable}`}>
      <body className="font-sans bg-[#ECE9F1] text-[#1C1924] h-full selection:bg-[#6555B8] selection:text-white antialiased overflow-hidden">
        <LayoutShell>{children}</LayoutShell>
              <PwaRegister />
      </body>
    </html>
  );
}


