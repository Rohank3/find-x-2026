import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveAnnouncements } from "@/lib/announcements";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [config, announcements] = await Promise.all([
      prisma.systemConfig.findUnique({
        where: { id: "default" },
        select: {
          broadcastMessage: true,
          announcementRetentionDays: true,
          updatedAt: true,
        },
      }),
      getActiveAnnouncements(),
    ]);

    const latestMessage = announcements[0]?.message || config?.broadcastMessage || null;

    return NextResponse.json({
      broadcastMessage: latestMessage,
      announcements,
      retentionDays: config?.announcementRetentionDays ?? 3,
      updatedAt: config?.updatedAt || null,
    });
  } catch (err) {
    console.error("[API Announcement] Error fetching announcements:", err);
    return NextResponse.json(
      {
        broadcastMessage: null,
        announcements: [],
        retentionDays: 3,
        error: "Failed to fetch announcements",
      },
      { status: 500 }
    );
  }
}
