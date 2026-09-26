import type { Metadata, Viewport } from "next";
import {
  Pirata_One,
  Cinzel_Decorative,
  JetBrains_Mono,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import Navbar from "@/components/ui/Navbar";
import AnnouncementBanner from "@/components/ui/AnnouncementBanner";
import GlobalOceanBackground from "@/components/layout/GlobalOceanBackground";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
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

const luckiestGuy = localFont({
  src: "../fonts/LuckiestGuy-Regular.woff2",
  weight: "400",
  variable: "--font-luckiest-guy",
  display: "swap",
});

const bangers = localFont({
  src: "../fonts/Bangers-Regular.woff2",
  weight: "400",
  variable: "--font-bangers",
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

import { unstable_cache } from "next/cache";

const getCachedBroadcast = unstable_cache(
  async () => {
    const config = await prisma.systemConfig.findUnique({
      where: { id: "default" },
      select: { broadcastMessage: true },
    });
    return config?.broadcastMessage || null;
  },
  ["root-broadcast-message"],
  { revalidate: 30, tags: ["system-config"] }
);

const getCachedAnnouncements = unstable_cache(
  async () => {
    return getActiveAnnouncements();
  },
  ["root-active-announcements"],
  { revalidate: 15, tags: ["announcements"] }
);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, broadcastMessage, initialAnnouncements] = await Promise.all([
    getServerSession(authOptions).catch(() => null),
    getCachedBroadcast().catch(() => null),
    getCachedAnnouncements().catch(() => []),
  ]);

  return (
    <html
      lang="en"
      className={`${pirataOne.variable} ${cinzelDecorative.variable} ${jetbrainsMono.variable} ${luckiestGuy.variable} ${bangers.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-jetbrains-mono)] relative">
        <GlobalOceanBackground />
        <AuthProvider session={session}>
          <Navbar
            initialBroadcast={broadcastMessage}
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
