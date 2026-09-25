import './globals.css';
import { Navbar } from '@/components/Navbar';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { FavoritesProvider } from '@/lib/favoritesContext';

export const metadata = {
  title: 'asiansin.love | Sincere Cross-Border Courtship',
  description: 'Verified, intentional relationships connecting Southeast Asian singles with international gentlemen.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#17131F] text-white min-h-screen flex flex-col font-sans selection:bg-[#653C87] selection:text-white">
        <FavoritesProvider>
          <OnboardingGuard>
            <div className="flex-shrink-0 z-50">
              <Navbar />
            </div>
            <main className="flex-1 flex flex-col min-h-0">
              {children}
            </main>
          </OnboardingGuard>
        </FavoritesProvider>
      </body>
    </html>
  );
}
