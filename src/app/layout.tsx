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
import LazyOceanBackground from "@/components/layout/LazyOceanBackground";
import SplashDismiss from "@/components/layout/SplashDismiss";
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

const description =
  "IIIT Lucknow's ultimate cryptic hunt. Join the crew, decode the cipher, chart the Grand Line, and claim your bounty.";

export const metadata: Metadata = {
  title: "FIND X — The Grand Voyage | IIIT Lucknow",
  description,
  applicationName: "FIND X",
  openGraph: {
    type: "website",
    siteName: "FIND X — The Grand Voyage",
    title: "FIND X — The Grand Voyage | IIIT Lucknow",
    description,
  },
  twitter: {
    card: "summary",
    title: "FIND X — The Grand Voyage | IIIT Lucknow",
    description,
  },
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
        {/* Zero-JS instant splash — visible from first paint until React hydrates */}
        <div
          id="__splash"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0c0805',
            transition: 'opacity 0.5s ease-out',
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes __splash_spin { to { transform: rotate(360deg) } }
            @keyframes __splash_pulse { 0%,100% { opacity: 0.6 } 50% { opacity: 1 } }
            #__splash_ring { width: 48px; height: 48px; border-radius: 50%; border: 2px solid rgba(212,175,55,0.3); border-top-color: #d4af37; animation: __splash_spin 1s linear infinite; margin-bottom: 24px; }
            #__splash_text { font-family: system-ui, sans-serif; font-size: 36px; font-weight: 900; letter-spacing: 0.12em; background: linear-gradient(180deg, #fff 0%, #fddf28 30%, #d4af37 65%, #85580c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
            #__splash_sub { font-family: system-ui, sans-serif; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(212,175,55,0.7); animation: __splash_pulse 2s ease-in-out infinite; }
          `}} />
          <div id="__splash_ring" />
          <div id="__splash_text">FIND X</div>
          <div id="__splash_sub">Charting the Grand Line...</div>
        </div>
        <LazyOceanBackground />
        <SplashDismiss />
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
