import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Asians in Love - Serious Courtship & Marriage',
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
    <html lang="en" className={`h-full ${plusJakarta.variable}`}>
      <body className="font-sans bg-[#ECE9F1] text-[#1C1924] min-h-screen selection:bg-[#6555B8] selection:text-white antialiased">
        {/* Centered Mobile App Shell */}
        <div className="w-full max-w-[430px] min-h-screen mx-auto bg-white flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.08)] relative border-x border-black/[0.04]">
          <div className="flex-1 pb-20">
            {children}
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
