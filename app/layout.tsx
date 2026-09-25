import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { FavoritesProvider } from "@/lib/favoritesContext";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "asiansin.love | Sincere Cross-Border Connections",
  description: "Modern, verified dating community connecting international men with sincere Southeast Asian women.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={`${nunito.variable} font-[family-name:var(--font-nunito)] bg-[#17131F] text-[#F3EBF9] fixed inset-0 flex flex-col h-[100dvh] w-full overflow-hidden select-none selection:bg-[#653C87] selection:text-white`}
      >
        <FavoritesProvider>
          {/* Fixed Top Header */}
          <div className="flex-shrink-0 z-50">
            <Navbar />
          </div>

          {/* Dedicated Scroll Container (Zero window scroll prevents address bar collapse) */}
          <div className="flex-1 w-full overflow-y-auto overscroll-y-contain flex flex-col">
            <div className="flex-1 w-full">
              {children}
            </div>
            <Footer />
          </div>

          {/* Fixed Bottom Navigation */}
          <BottomNav />
        </FavoritesProvider>
      </body>
    </html>
  );
}