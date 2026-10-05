import { RealtimeMatchToast } from '@/components/RealtimeMatchToast';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-brand',
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
    <html lang="en" className={`h-full ${plusJakarta.variable} ${outfit.variable}`}>
      <body className="font-sans bg-[#ECE9F1] text-[#1C1924] h-full selection:bg-[#6555B8] selection:text-white antialiased overflow-hidden">
        <div className="w-full max-w-[430px] h-[100dvh] mx-auto bg-white flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.08)] relative border-x border-black/[0.04] overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 relative overflow-y-auto smooth-scroll no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <Navbar />
            {children}
            <Footer />
            <RealtimeMatchToast />
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
