import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { RealtimeMatchToast } from '@/components/RealtimeMatchToast';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
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
    <html lang="en" className={`h-full ${plusJakarta.variable} ${outfit.variable}`}>
      <body className="font-sans bg-[#ECE9F1] text-[#1C1924] h-full selection:bg-[#6555B8] selection:text-white antialiased overflow-hidden">
        <div className="w-full max-w-[430px] h-[100dvh] mx-auto bg-white flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.08)] relative border-x border-black/[0.04] overflow-hidden">
          {/* Main scrollable body */}
          <div className="flex-1 flex flex-col min-h-0 relative overflow-y-auto smooth-scroll no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <Navbar />
            <main className="flex-1 flex flex-col w-full min-h-0">
              {children}
            </main>
            <Footer />
            <RealtimeMatchToast />
          </div>
          {/* Bottom Dock Navigation */}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
