import { prisma } from "./prisma";
import { redis } from "./redis";
import { computeLedger, type LedgerEvent, type LedgerSummary } from "./ledger";
import type { BatchTier } from "@prisma/client";
import { isValidEntityId } from "./utils";

export interface DashboardTeamMember {
  id: string;
  name: string | null;
  email: string;
  branch: string;
  batchYear: number;
  rollNumber: string;
}

export interface DashboardIncomingJoinRequest {
  id: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    branch: string;
    batchYear: number;
    rollNumber: string;
    batchTier: string;
  };
}

export interface DashboardTeamPayload {
  id: string;
  name: string;
  batchTier: string;
  isFrozen: boolean;
  avatarUrl: string | null;
  members: DashboardTeamMember[];
  joinRequests: DashboardIncomingJoinRequest[];
}

export interface TeamDashboardData {
  team: DashboardTeamPayload;
  pointHistory: LedgerEvent[];
  scoreSummary: LedgerSummary;
}

export interface AvailableTeamSummary {
  id: string;
  name: string;
  batchTier: string;
  isFrozen: boolean;
  _count: { members: number };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const teamMemoryCache = new Map<string, CacheEntry<TeamDashboardData>>();
const availableTeamsMemoryCache = new Map<string, CacheEntry<AvailableTeamSummary[]>>();

const TEAM_MEM_TTL_MS = 15000; // 15s local memory TTL (invalidated on solve/hint/roster action)
const AVAILABLE_MEM_TTL_MS = 60000; // 60s local memory TTL
const REDIS_TTL_SEC = 600; // 10 min shared Redis TTL

/**
 * Retrieves full team dashboard payload (metadata, members, join requests, and calculated ledger).
 *
 * Implements a 3-tier caching hierarchy:
 * 1. Process-local Memory Cache (0ms)
 * 2. Shared Resilient Redis Cache (<10ms)
 * 3. Single Consolidated Prisma Relation Join Query (~300ms vs 2000ms for 8 unpooled queries)
 */
export async function getTeamDashboardData(teamId: string): Promise<TeamDashboardData | null> {
  if (!isValidEntityId(teamId)) return null;

  // 1. Process Memory Cache
  const mem = teamMemoryCache.get(teamId);
  if (mem && Date.now() - mem.timestamp < TEAM_MEM_TTL_MS) {
    return mem.data;
  }

  // 2. Redis Shared Cache
  try {
    const cached = await redis.get(`dashboard:team:${teamId}`);
    if (cached) {
      const parsed: TeamDashboardData = JSON.parse(cached);
      if (parsed.team?.joinRequests) {
        parsed.team.joinRequests = parsed.team.joinRequests.map((r) => ({
          ...r,
          createdAt: new Date(r.createdAt),
        }));
      }
      teamMemoryCache.set(teamId, { data: parsed, timestamp: Date.now() });
      return parsed;
    }
  } catch (err) {
    console.warn("[DashboardCache] Redis read failed:", err);
  }

  // 3. Database Single Consolidated Query
  const teamRecord = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      batchTier: true,
      isFrozen: true,
      avatarUrl: true,
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          branch: true,
          batchYear: true,
          rollNumber: true,
        },
      },
      joinRequests: {
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              branch: true,
              batchYear: true,
              rollNumber: true,
              batchTier: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      submissions: {
        where: { isCorrect: true },
        select: {
          id: true,
          createdAt: true,
          pointsAwarded: true,
          puzzle: {
            select: {
              id: true,
              orderIndex: true,
              title: true,
              basePoints: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      hintUnlocks: {
        select: {
          id: true,
          unlockedAt: true,
          hint: {
            select: {
              id: true,
              orderIndex: true,
              penaltyPoints: true,
              puzzle: {
                select: {
                  orderIndex: true,
                  title: true,
                },
              },
            },
          },
          unlockedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { unlockedAt: "asc" },
      },
      scoreAdjustments: {
        select: {
          id: true,
          amount: true,
          reason: true,
          createdAt: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!teamRecord) return null;

  const ledger = computeLedger(teamRecord, {
    resolveHintAuthor: (actor) => actor?.name || actor?.email?.split("@")[0] || "Teammate",
  });

  const payload: TeamDashboardData = {
    team: {
      id: teamRecord.id,
      name: teamRecord.name,
      batchTier: teamRecord.batchTier,
      isFrozen: teamRecord.isFrozen,
      avatarUrl: teamRecord.avatarUrl,
      members: teamRecord.members,
      joinRequests: teamRecord.joinRequests,
    },
    pointHistory: ledger.pointHistory,
    scoreSummary: ledger.summary,
  };

  teamMemoryCache.set(teamId, { data: payload, timestamp: Date.now() });

  try {
    await redis.set(`dashboard:team:${teamId}`, JSON.stringify(payload), "EX", REDIS_TTL_SEC);
  } catch (err) {
    console.warn("[DashboardCache] Redis write failed:", err);
  }

  return payload;
}

/**
 * Retrieves available open teams for recruitment with short TTL caching.
 */
export async function getAvailableTeams(
  batchTier: BatchTier | string
): Promise<AvailableTeamSummary[]> {
  const tierKey = batchTier as BatchTier;
  const mem = availableTeamsMemoryCache.get(tierKey);
  if (mem && Date.now() - mem.timestamp < AVAILABLE_MEM_TTL_MS) {
    return mem.data;
  }

  try {
    const cached = await redis.get(`dashboard:available:${tierKey}`);
    if (cached) {
      const parsed: AvailableTeamSummary[] = JSON.parse(cached);
      availableTeamsMemoryCache.set(tierKey, { data: parsed, timestamp: Date.now() });
      return parsed;
    }
  } catch (err) {
    console.warn("[DashboardCache] Redis read available teams failed:", err);
  }

  const teams = await prisma.team.findMany({
    where: {
      batchTier: tierKey,
      isFrozen: false,
    },
    take: 24,
    select: {
      id: true,
      name: true,
      batchTier: true,
      isFrozen: true,
      _count: { select: { members: true } },
    },
  });

  availableTeamsMemoryCache.set(tierKey, { data: teams, timestamp: Date.now() });

  try {
    await redis.set(
      `dashboard:available:${tierKey}`,
      JSON.stringify(teams),
      "EX",
      REDIS_TTL_SEC
    );
  } catch (err) {
    console.warn("[DashboardCache] Redis write available teams failed:", err);
  }

  return teams;
}

/**
 * Invalidates team dashboard caches in both process memory and shared Redis.
 */
export async function invalidateTeamDashboardCache(teamId?: string): Promise<void> {
  if (teamId) {
    if (!isValidEntityId(teamId)) return;
    teamMemoryCache.delete(teamId);
    try {
      await redis.del(`dashboard:team:${teamId}`);
    } catch {
      // Ignored
    }
  } else {
    teamMemoryCache.clear();
    try {
      const keys = await redis.scan("dashboard:team:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Ignored
    }
  }
}

/**
 * Invalidates available teams cache in both process memory and shared Redis.
 */
export async function invalidateAvailableTeamsCache(
  batchTier?: BatchTier | string
): Promise<void> {
  if (batchTier) {
    const validTier = batchTier === "FIRST_YEAR" || batchTier === "SENIOR" ? batchTier : null;
    if (!validTier) return;
    availableTeamsMemoryCache.delete(validTier as BatchTier);
    try {
      await redis.del(`dashboard:available:${validTier}`);
    } catch {
      // Ignored
    }
  } else {
    availableTeamsMemoryCache.clear();
    try {
      const keys = await redis.scan("dashboard:available:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Ignored
    }
  }
}

export interface UserOutgoingJoinRequest {
  id: string;
  teamId: string;
  userId: string;
  createdAt: Date;
  team: {
    id: string;
    name: string;
    batchTier: BatchTier;
    isFrozen: boolean;
    avatarUrl: string | null;
    _count: { members: number };
  };
}

const userJoinRequestsMemoryCache = new Map<string, CacheEntry<UserOutgoingJoinRequest[]>>();
const USER_JOIN_REQUESTS_MEM_TTL_MS = 30000; // 30s local memory TTL

/**
 * Retrieves outgoing join requests sent by a user with in-memory caching.
 */
export async function getUserOutgoingJoinRequests(
  userId: string
): Promise<UserOutgoingJoinRequest[]> {
  const mem = userJoinRequestsMemoryCache.get(userId);
  if (mem && Date.now() - mem.timestamp < USER_JOIN_REQUESTS_MEM_TTL_MS) {
    return mem.data;
  }

  const requests = await prisma.joinRequest.findMany({
    where: { userId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          batchTier: true,
          isFrozen: true,
          avatarUrl: true,
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  userJoinRequestsMemoryCache.set(userId, { data: requests, timestamp: Date.now() });
  return requests;
}

/**
 * Invalidates user outgoing join requests cache.
 */
export function invalidateUserJoinRequestsCache(userId?: string): void {
  if (userId) {
    userJoinRequestsMemoryCache.delete(userId);
  } else {
    userJoinRequestsMemoryCache.clear();
  }
}

