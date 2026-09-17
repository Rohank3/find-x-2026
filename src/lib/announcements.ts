import { EventEmitter } from "events";
import { prisma } from "@/lib/prisma";

// Singleton event emitter for announcements to survive Next.js dev reloads
const globalForEvents = globalThis as unknown as {
  announcementEvents?: EventEmitter;
};

export const announcementEvents =
  globalForEvents.announcementEvents ?? new EventEmitter();

// Allow multiple concurrent SSE client listeners without warning
announcementEvents.setMaxListeners(200);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.announcementEvents = announcementEvents;
}

export function notifyAnnouncementUpdate() {
  announcementEvents.emit("announcement_update", {
    timestamp: Date.now(),
  });
}

/**
 * Clean up expired announcements (self-deletion after X days).
 * This ensures announcements that passed their retention period are deleted from the database.
 */
export async function purgeExpiredAnnouncements() {
  try {
    const now = new Date();
    await prisma.announcement.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });
  } catch (err) {
    console.error("[Announcements] Failed to purge expired announcements:", err);
  }
}

/**
 * Fetches all currently active announcements, ordered newest to oldest (stacked).
 *
 * NOTE: no purge here — this runs on every page render and every per-client
 * 15s poll, and the query below already filters expiresAt > now, so a
 * deleteMany per read was pure redundant write load. Expired-row housekeeping
 * happens in the admin create/delete announcement actions instead.
 */
export async function getActiveAnnouncements() {
  const now = new Date();
  return await prisma.announcement.findMany({
    where: {
      expiresAt: {
        gt: now,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      createdBy: {
        // No `email`: this function feeds the PUBLIC /api/announcement route
        // and the root layout's RSC payload, so any field here ships to
        // anonymous visitors (same PII class as scoring.ts adjustments).
        select: {
          name: true,
        },
      },
    },
  });
}
