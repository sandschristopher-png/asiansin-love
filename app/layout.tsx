import type { Metadata, Viewport } from 'next';
import { Comfortaa, Plus_Jakarta_Sans, Outfit } from 'next/font/google';

const comfortaa = Comfortaa({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-logo',
});
import './globals.css';
import { LayoutShell } from '@/components/LayoutShell';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-brand',
});

export const metadata: Metadata = {
  title: 'Asians in Love - Serious Courtship',
  description: 'A thoughtful platform dedicated to intentional courtship, values-first compatibility, and lifelong marriage.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      </body>
    </html>
  );
}

