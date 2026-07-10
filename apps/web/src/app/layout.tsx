import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (variable, latin subset) so builds never need the network.
const baloo = localFont({
  src: "../fonts/baloo2-latin.woff2",
  weight: "400 800",
  variable: "--font-baloo",
});

export const metadata: Metadata = {
  title: "¡Palabras! — Spanish for little kids",
  description:
    "Tap a sticker, hear the Spanish word. Flashcards for pre-readers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#a3e635",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={baloo.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
