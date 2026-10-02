import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Asians in Love — Serious Courtship & Marriage',
  description: 'Serious courtship & marriage platform for intentional singles.',
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
    <html lang="en" className={`h-full ${outfit.variable}`}>
      <body className="font-sans bg-[#FFFFFF] text-[#1C1924] min-h-full overflow-y-auto selection:bg-[#6555B8] selection:text-white pb-24 sm:pb-0">
        {children}
      </body>
    </html>
  );
}
