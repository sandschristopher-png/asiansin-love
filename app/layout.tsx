import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FavoritesProvider } from '@/lib/favoritesContext';
import { NotificationToast } from '@/components/NotificationToast';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'asiansin.love | Sincere Southeast Asian Courtship',
  description: 'Dignified, scam-free dating community connecting international men with verified Southeast Asian women.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="min-h-screen flex flex-col bg-[#17131F] text-[#F3EBF9] font-[family-name:var(--font-nunito)] antialiased">
        <FavoritesProvider>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
          <NotificationToast />
        </FavoritesProvider>
      </body>
    </html>
  );
}
