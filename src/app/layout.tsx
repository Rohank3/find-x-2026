import type { Metadata, Viewport } from "next";
import { Pirata_One, Cinzel_Decorative, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import Navbar from "@/components/ui/Navbar";
import AnnouncementBanner from "@/components/ui/AnnouncementBanner";
import GlobalOceanBackground from "@/components/layout/GlobalOceanBackground";
import { prisma } from "@/lib/prisma";
import { getActiveAnnouncements } from "@/lib/announcements";

const pirataOne = Pirata_One({
  weight: "400",
  variable: "--font-pirata-one",
  subsets: ["latin"],
  display: "swap",
});

const cinzelDecorative = Cinzel_Decorative({
  weight: ["400", "700", "900"],
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FIND X — The Grand Voyage | IIIT Lucknow",
  description:
    "IIIT Lucknow's ultimate cryptic hunt. Join the crew, decode the cipher, chart the Grand Line, and claim your bounty.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, initialAnnouncements] = await Promise.all([
    prisma.systemConfig
      .findUnique({
        where: { id: "default" },
        select: { broadcastMessage: true },
      })
      .catch(() => null),
    getActiveAnnouncements().catch(() => []),
  ]);

  return (
    <html
      lang="en"
      className={`${pirataOne.variable} ${cinzelDecorative.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-jetbrains-mono)] relative">
        <GlobalOceanBackground />
        <AuthProvider>
          <Navbar
            initialBroadcast={config?.broadcastMessage || null}
            initialAnnouncements={initialAnnouncements}
          />
          <AnnouncementBanner initialAnnouncements={initialAnnouncements} />
          <main className="relative flex-1 flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
