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

type ActiveAnnouncements = Awaited<ReturnType<typeof fetchActiveAnnouncementsFromDb>>;

interface CachedAnnouncements {
  timestamp: number;
  data: ActiveAnnouncements;
}

let announcementsMemCache: CachedAnnouncements | null = null;
const ANNOUNCEMENTS_MEM_TTL_MS = 60000;

export function invalidateAnnouncementsCache() {
  announcementsMemCache = null;
}

export function notifyAnnouncementUpdate() {
  invalidateAnnouncementsCache();
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
    invalidateAnnouncementsCache();
  } catch (err) {
    console.error("[Announcements] Failed to purge expired announcements:", err);
  }
}

async function fetchActiveAnnouncementsFromDb() {
  const now = new Date();
  return prisma.announcement.findMany({
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
        select: {
          name: true,
        },
      },
    },
  });
}

/**
 * Fetches all currently active announcements, ordered newest to oldest (stacked).
 * Leverages in-memory cache with instant invalidation to eliminate redundant DB calls.
 */
export async function getActiveAnnouncements() {
  if (announcementsMemCache && Date.now() - announcementsMemCache.timestamp < ANNOUNCEMENTS_MEM_TTL_MS) {
    return announcementsMemCache.data;
  }
  const data = await fetchActiveAnnouncementsFromDb();
  announcementsMemCache = { timestamp: Date.now(), data };
  return data;
}
