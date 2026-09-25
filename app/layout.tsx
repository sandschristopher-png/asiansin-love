import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
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
    <html lang="en" className="dark overflow-x-hidden">
      <body
        className={`${nunito.variable} font-[family-name:var(--font-nunito)] bg-[#17131F] text-[#F3EBF9] min-h-screen flex flex-col overflow-x-hidden selection:bg-[#653C87] selection:text-white`}
      >
        <FavoritesProvider>
          <Navbar />
          <div className="flex-1 w-full max-w-full overflow-x-hidden">
            {children}
          </div>
          <Footer />
        </FavoritesProvider>
      </body>
    </html>
  );
}