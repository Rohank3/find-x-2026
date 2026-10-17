import { NextResponse } from "next/server";
import { getEffectiveSystemConfig } from "@/lib/competition";
import { getActiveAnnouncements } from "@/lib/announcements";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [config, announcements] = await Promise.all([
      getEffectiveSystemConfig().catch(() => null),
      getActiveAnnouncements().catch(() => []),
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
