import { prisma } from "./prisma";
import { redis } from "./redis";
import { computeLedger, type LedgerEvent } from "./ledger";
import { getEffectiveSystemConfig } from "./competition";
import { after } from "next/server";

// The ledger event shape is shared with the dashboard (src/lib/ledger.ts).
export type PointHistoryEvent = LedgerEvent;

export interface TeamLeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  avatarUrl?: string | null;
  batchTier: "FIRST_YEAR" | "SENIOR";
  isFirstYear: boolean;
  score: number;
  puzzlesSolved: number;
  lastSolveTime: Date | null;
  members: Array<{
    id: string;
    name: string | null;
    email: string;
    branch: string;
    batchYear: number;
  }>;
  pointHistory: PointHistoryEvent[];
  totalGained: number;
  totalPenalties: number;
  totalAdjustments: number;
}

export interface TimelineDataPoint {
  timestamp: string;
  [teamName: string]: number | string;
}

export interface LeaderboardResult {
  entries: TeamLeaderboardEntry[];
  isFrozen: boolean;
  timelineData: TimelineDataPoint[];
  topTeamNames: string[];
  showQuestionsSolved: boolean;
  showPointHistory: boolean;
  hideTeamNames: boolean;
  isAdminViewer?: boolean;
  lastUpdated?: number;
}

interface CacheEntry {
  timestamp: number;
  data: LeaderboardResult;
}

// Global in-memory cache for ultra-fast (sub-millisecond) reads
const memoryLeaderboardCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15000; // 15s memory TTL: keeps lambdas in sync with Redis while eliminating duplicate calls

let isRefreshingCache = false;
let hasPendingRefresh = false;

function sortAndRankEntries(entries: TeamLeaderboardEntry[]) {
  // Sort: Higher score first, then earliest lastSolveTime, then a stable teamId tie-break.
  entries.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.lastSolveTime && b.lastSolveTime) {
      return a.lastSolveTime.getTime() - b.lastSolveTime.getTime();
    }
    if (a.lastSolveTime) return -1;
    if (b.lastSolveTime) return 1;
    return a.teamId < b.teamId ? -1 : a.teamId > b.teamId ? 1 : 0;
  });

  // Re-assign ranks 1..N
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
}

function sanitizeForPublic(
  entries: TeamLeaderboardEntry[],
  options: {
    hideTeamNames: boolean;
    showQuestionsSolved: boolean;
    showPointHistory: boolean;
  }
): TeamLeaderboardEntry[] {
  return entries.map((entry) => {
    const copy: TeamLeaderboardEntry = {
      ...entry,
      members: [],
      pointHistory: [],
    };

    if (options.hideTeamNames) {
      copy.teamName = `Team #${entry.rank.toString().padStart(2, "0")}`;
      copy.teamId = `anon-${entry.rank}`;
      copy.avatarUrl = null;
    }

    if (!options.showPointHistory) {
      copy.totalGained = 0;
      copy.totalPenalties = 0;
      copy.totalAdjustments = 0;
    }

    if (!options.showQuestionsSolved) {
      copy.puzzlesSolved = 0;
    }

    return copy;
  });
}

/**
 * Executes a single database query to recompute all tiers for both public and admin scopes,
 * then atomically saves them into memory and Redis.
 */
async function computeAndStoreAllLeaderboards(): Promise<void> {
  const config = await getEffectiveSystemConfig().catch(() => null);
  const isFrozen = config?.competitionState === "FROZEN";
  const showQuestionsSolved = config?.showQuestionsSolved ?? true;
  const showPointHistory = config?.showPointHistory ?? true;
  const hideTeamNames = config?.hideTeamNames ?? false;
  const isUpcoming = (config?.competitionState ?? "UPCOMING") === "UPCOMING";
  const effectiveFreezeTime = config?.freezeTime ?? new Date();

  // Fetch all teams and their score-affecting events in a single optimized query
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      batchTier: true,
      submissions: {
        where: { isCorrect: true },
        select: {
          id: true,
          createdAt: true,
          pointsAwarded: true,
          puzzle: {
            select: {
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
        },
        orderBy: { unlockedAt: "asc" },
      },
      scoreAdjustments: {
        select: {
          id: true,
          amount: true,
          reason: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const now = Date.now();

  // 1. Compute Admin entries (unfiltered by freeze, full visibility)
  const adminRawEntries: TeamLeaderboardEntry[] = teams.map((team) => {
    const { summary } = computeLedger(team);
    const lastSolveTime =
      team.submissions.length > 0
        ? team.submissions[team.submissions.length - 1].createdAt
        : null;

    return {
      rank: 0,
      teamId: team.id,
      teamName: team.name,
      avatarUrl: team.avatarUrl || null,
      batchTier: team.batchTier as "FIRST_YEAR" | "SENIOR",
      isFirstYear: team.batchTier === "FIRST_YEAR",
      score: summary.score,
      puzzlesSolved: team.submissions.length,
      lastSolveTime,
      members: [],
      pointHistory: [],
      totalGained: summary.totalGained,
      totalPenalties: summary.totalPenalties,
      totalAdjustments: summary.totalAdjustments,
    };
  });

  // Sort and rank Admin ALL
  const adminAll = [...adminRawEntries];
  sortAndRankEntries(adminAll);

  // Admin FIRST_YEAR
  const adminFY = adminRawEntries
    .filter((e) => e.batchTier === "FIRST_YEAR")
    .map((e) => ({ ...e }));
  sortAndRankEntries(adminFY);

  // Admin SENIOR
  const adminSenior = adminRawEntries
    .filter((e) => e.batchTier === "SENIOR")
    .map((e) => ({ ...e }));
  sortAndRankEntries(adminSenior);

  const adminResultAll: LeaderboardResult = {
    entries: adminAll,
    isFrozen,
    timelineData: [],
    topTeamNames: [],
    showQuestionsSolved: true,
    showPointHistory: true,
    hideTeamNames: false,
    isAdminViewer: true,
    lastUpdated: now,
  };

  const adminResultFY: LeaderboardResult = {
    entries: adminFY,
    isFrozen,
    timelineData: [],
    topTeamNames: [],
    showQuestionsSolved: true,
    showPointHistory: true,
    hideTeamNames: false,
    isAdminViewer: true,
    lastUpdated: now,
  };

  const adminResultSenior: LeaderboardResult = {
    entries: adminSenior,
    isFrozen,
    timelineData: [],
    topTeamNames: [],
    showQuestionsSolved: true,
    showPointHistory: true,
    hideTeamNames: false,
    isAdminViewer: true,
    lastUpdated: now,
  };

  // 2. Compute Public entries (respecting freeze time and upcoming state)
  let publicResultAll: LeaderboardResult;
  let publicResultFY: LeaderboardResult;
  let publicResultSenior: LeaderboardResult;

  if (isUpcoming) {
    const emptyResult: LeaderboardResult = {
      entries: [],
      isFrozen: false,
      timelineData: [],
      topTeamNames: [],
      showQuestionsSolved,
      showPointHistory,
      hideTeamNames,
      isAdminViewer: false,
      lastUpdated: now,
    };
    publicResultAll = emptyResult;
    publicResultFY = emptyResult;
    publicResultSenior = emptyResult;
  } else {
    // If competition is frozen, filter events up to freeze time
    const publicRawEntries: TeamLeaderboardEntry[] = teams.map((team) => {
      const filteredSubmissions = isFrozen
        ? team.submissions.filter((s) => s.createdAt <= effectiveFreezeTime)
        : team.submissions;
      const filteredHints = isFrozen
        ? team.hintUnlocks.filter((h) => h.unlockedAt <= effectiveFreezeTime)
        : team.hintUnlocks;
      const filteredAdjustments = isFrozen
        ? team.scoreAdjustments.filter((a) => a.createdAt <= effectiveFreezeTime)
        : team.scoreAdjustments;

      const { summary } = computeLedger({
        submissions: filteredSubmissions,
        hintUnlocks: filteredHints,
        scoreAdjustments: filteredAdjustments,
      });

      const lastSolveTime =
        filteredSubmissions.length > 0
          ? filteredSubmissions[filteredSubmissions.length - 1].createdAt
          : null;

      return {
        rank: 0,
        teamId: team.id,
        teamName: team.name,
        avatarUrl: team.avatarUrl || null,
        batchTier: team.batchTier as "FIRST_YEAR" | "SENIOR",
        isFirstYear: team.batchTier === "FIRST_YEAR",
        score: summary.score,
        puzzlesSolved: filteredSubmissions.length,
        lastSolveTime,
        members: [],
        pointHistory: [],
        totalGained: summary.totalGained,
        totalPenalties: summary.totalPenalties,
        totalAdjustments: summary.totalAdjustments,
      };
    });

    // Public ALL
    const publicAllRanked = [...publicRawEntries];
    sortAndRankEntries(publicAllRanked);
    const sanitizedAll = sanitizeForPublic(publicAllRanked, {
      hideTeamNames,
      showQuestionsSolved,
      showPointHistory,
    });

    // Public FIRST_YEAR
    const publicFYRanked = publicRawEntries
      .filter((e) => e.batchTier === "FIRST_YEAR")
      .map((e) => ({ ...e }));
    sortAndRankEntries(publicFYRanked);
    const sanitizedFY = sanitizeForPublic(publicFYRanked, {
      hideTeamNames,
      showQuestionsSolved,
      showPointHistory,
    });

    // Public SENIOR
    const publicSeniorRanked = publicRawEntries
      .filter((e) => e.batchTier === "SENIOR")
      .map((e) => ({ ...e }));
    sortAndRankEntries(publicSeniorRanked);
    const sanitizedSenior = sanitizeForPublic(publicSeniorRanked, {
      hideTeamNames,
      showQuestionsSolved,
      showPointHistory,
    });

    publicResultAll = {
      entries: sanitizedAll,
      isFrozen,
      timelineData: [],
      topTeamNames: [],
      showQuestionsSolved,
      showPointHistory,
      hideTeamNames,
      isAdminViewer: false,
      lastUpdated: now,
    };

    publicResultFY = {
      entries: sanitizedFY,
      isFrozen,
      timelineData: [],
      topTeamNames: [],
      showQuestionsSolved,
      showPointHistory,
      hideTeamNames,
      isAdminViewer: false,
      lastUpdated: now,
    };

    publicResultSenior = {
      entries: sanitizedSenior,
      isFrozen,
      timelineData: [],
      topTeamNames: [],
      showQuestionsSolved,
      showPointHistory,
      hideTeamNames,
      isAdminViewer: false,
      lastUpdated: now,
    };
  }

  // Atomically update memory cache
  memoryLeaderboardCache.set("public:ALL", { timestamp: now, data: publicResultAll });
  memoryLeaderboardCache.set("public:FIRST_YEAR", { timestamp: now, data: publicResultFY });
  memoryLeaderboardCache.set("public:SENIOR", { timestamp: now, data: publicResultSenior });
  memoryLeaderboardCache.set("admin:ALL", { timestamp: now, data: adminResultAll });
  memoryLeaderboardCache.set("admin:FIRST_YEAR", { timestamp: now, data: adminResultFY });
  memoryLeaderboardCache.set("admin:SENIOR", { timestamp: now, data: adminResultSenior });

  // Atomically update Redis in background (non-blocking for callers)
  const REDIS_TTL_SEC = 600; // 10 minutes safety TTL
  void Promise.all([
    redis.set("leaderboard:public:ALL", JSON.stringify(publicResultAll), "EX", REDIS_TTL_SEC),
    redis.set("leaderboard:public:FIRST_YEAR", JSON.stringify(publicResultFY), "EX", REDIS_TTL_SEC),
    redis.set("leaderboard:public:SENIOR", JSON.stringify(publicResultSenior), "EX", REDIS_TTL_SEC),
    redis.set("leaderboard:admin:ALL", JSON.stringify(adminResultAll), "EX", REDIS_TTL_SEC),
    redis.set("leaderboard:admin:FIRST_YEAR", JSON.stringify(adminResultFY), "EX", REDIS_TTL_SEC),
    redis.set("leaderboard:admin:SENIOR", JSON.stringify(adminResultSenior), "EX", REDIS_TTL_SEC),
  ]).catch(() => undefined);
}

/**
 * Coalesced background refresh:
 * Multiple rapid calls (e.g. concurrent solves or hint unlocks) are deduplicated so
 * at most one database recomputation runs at a time, followed by at most one catch-up.
 */
export async function refreshLeaderboardCache(): Promise<void> {
  if (isRefreshingCache) {
    hasPendingRefresh = true;
    return;
  }

  isRefreshingCache = true;
  try {
    do {
      hasPendingRefresh = false;
      await computeAndStoreAllLeaderboards();
    } while (hasPendingRefresh);
  } catch (err) {
    console.error("[Leaderboard] Background recomputation failed:", err);
  } finally {
    isRefreshingCache = false;
  }
}

/**
 * Triggers an asynchronous, non-blocking cache recomputation.
 * Called on every score-altering event (correct solve, hint unlock, admin adjustment).
 * Reads will continue to be served with zero latency from the current cache until
 * the new snapshot is ready.
 */
export function invalidateLeaderboardCache(): void {
  try {
    // On Vercel serverless, after() ensures the background recomputation finishes
    // without delaying the client's HTTP response or getting frozen prematurely.
    after(async () => {
      await refreshLeaderboardCache();
    });
  } catch {
    void refreshLeaderboardCache().catch((err) => {
      console.error("[Leaderboard] Background invalidate/refresh error:", err);
    });
  }
}

/**
 * Retrieves leaderboard standings for the specified tier and viewer scope.
 *
 * Guarantees ultra-fast response times:
 * 1. Serves from in-memory cache (< 0.1ms).
 * 2. If memory is cold, serves from Redis (< 2ms).
 * 3. Only on a complete cold start will it compute, store, and return.
 */
export async function getLeaderboardData(
  filterTier?: "FIRST_YEAR" | "SENIOR",
  requesterIsAdmin: boolean = false
): Promise<LeaderboardResult> {
  const scope = requesterIsAdmin ? "admin" : "public";
  const tierKey = filterTier || "ALL";
  const cacheKey = `${scope}:${tierKey}`;

  // 1. Fast in-memory lookup
  const memoryCached = memoryLeaderboardCache.get(cacheKey);
  if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_TTL_MS) {
    return memoryCached.data;
  }

  // 2. Redis lookup
  try {
    const redisCached = await redis.get(`leaderboard:${cacheKey}`);
    if (redisCached) {
      const parsed = JSON.parse(redisCached) as LeaderboardResult;
      memoryLeaderboardCache.set(cacheKey, { timestamp: Date.now(), data: parsed });
      return parsed;
    }
  } catch {
    // Gracefully fall back to compute
  }

  // 3. Cold start fallback: compute and cache immediately
  await computeAndStoreAllLeaderboards();

  const fresh = memoryLeaderboardCache.get(cacheKey);
  if (fresh) {
    return fresh.data;
  }

  return {
    entries: [],
    isFrozen: false,
    timelineData: [],
    topTeamNames: [],
    showQuestionsSolved: true,
    showPointHistory: true,
    hideTeamNames: false,
    isAdminViewer: requesterIsAdmin,
    lastUpdated: Date.now(),
  };
}
