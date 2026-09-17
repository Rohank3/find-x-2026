import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import Navbar from "@/components/ui/Navbar";
import UnicornBackground from "@/components/ui/UnicornBackground";
import InternalAtmosphere from "@/components/ui/InternalAtmosphere";
import { prisma } from "@/lib/prisma";
import { getActiveAnnouncements } from "@/lib/announcements";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FIND X | IIIT Lucknow",
  description: "IIIT Lucknow's ultimate cryptic hunt platform. Team up, decode clues, and solve for X.",
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
    prisma.systemConfig.findUnique({
      where: { id: "default" },
      select: { broadcastMessage: true },
    }).catch(() => null),
    getActiveAnnouncements().catch(() => []),
  ]);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-black text-white`}>
      <body className="min-h-full flex flex-col bg-black text-white selection:bg-white selection:text-black font-mono">
        {/* Persistent homepage background: mounts once, survives client
            navigation so returning home never re-boots WebGL. */}
        <UnicornBackground />
        {/* Subtle atmospheric dot matrix & ambient spotlight for internal pages */}
        <InternalAtmosphere />
        <AuthProvider>
          <Navbar
            initialBroadcast={config?.broadcastMessage || null}
            initialAnnouncements={initialAnnouncements}
          />
          <main className="relative z-10 flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
