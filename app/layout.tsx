import InAppToast from '@/components/InAppToast';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { FavoritesProvider } from '@/lib/favoritesContext';
import { PwaRegister } from '@/components/PwaRegister';
import { IosInstallBanner } from '@/components/IosInstallBanner';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'asiansin.love',
  },
  title: 'asiansin.love | Sincere Cross-Border Courtship',
  description: 'Verified, intentional relationships connecting Southeast Asian singles with international gentlemen.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-[#17131F] text-white min-h-full overflow-y-auto selection:bg-[#653C87] selection:text-white pb-24 sm:pb-0">
        <PwaRegister />
        <IosInstallBanner />
        <FavoritesProvider>
          <OnboardingGuard>
            <Navbar />
            <main className="w-full">
              <InAppToast />
              {children}
            </main>
            <BottomNav />
          </OnboardingGuard>
        </FavoritesProvider>
      </body>
    </html>
  );
}
