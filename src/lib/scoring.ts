import { prisma } from "./prisma";
import { computeLedger, type LedgerEvent } from "./ledger";

// The ledger event shape is shared with the dashboard (src/lib/ledger.ts).
export type PointHistoryEvent = LedgerEvent;

export interface TeamLeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
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
}

/**
 * Computes live leaderboard standings with accurate ledger calculation:
 * Solves (+) minus Hint Penalties (-) plus/minus Organizer Adjustments (+/-).
 * Ties broken by earliest timestamp of the last correct solve.
 * If hideTeamNames is enabled in SystemConfig and requesterIsAdmin is false,
 * team names and member details are anonymized (e.g. "Team #01").
 */
export async function getLeaderboardData(
  filterTier?: "FIRST_YEAR" | "SENIOR",
  requesterIsAdmin: boolean = false
): Promise<LeaderboardResult> {
  try {
    // Check system state & display toggles
    const config = await prisma.systemConfig.findUnique({ where: { id: "default" } }).catch(() => null);
    const isFrozen = config?.competitionState === "FROZEN";
    const showQuestionsSolved = config?.showQuestionsSolved ?? true;
    const showPointHistory = config?.showPointHistory ?? true;
    const hideTeamNames = config?.hideTeamNames ?? false;

    // When competition is FROZEN and viewer is not an admin, filter events up to freezeTime
    const freezeFilter = isFrozen && !requesterIsAdmin && config?.freezeTime
      ? config.freezeTime
      : null;

    // Fetch all teams with members, submissions, hint unlocks, and score adjustments
    const teams = await prisma.team.findMany({
      where: filterTier ? { batchTier: filterTier } : undefined,
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            branch: true,
            batchYear: true,
          },
        },
        submissions: {
          where: {
            isCorrect: true,
            ...(freezeFilter ? { createdAt: { lte: freezeFilter } } : {}),
          },
          include: {
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
          where: freezeFilter ? { unlockedAt: { lte: freezeFilter } } : undefined,
          include: {
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
              },
            },
          },
          orderBy: { unlockedAt: "asc" },
        },
        scoreAdjustments: {
          where: freezeFilter ? { createdAt: { lte: freezeFilter } } : undefined,
          include: {
            createdBy: {
              // Organizer identity for the audit trail. Email is deliberately
              // NOT selected: this shape is serialized to non-admin clients
              // when showPointHistory is enabled, so every field here ships to
              // anonymous /api/leaderboard consumers.
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

    const ranked: TeamLeaderboardEntry[] = teams.map((team) => {
      // Ledger computation is shared with the dashboard (src/lib/ledger.ts)
      const { pointHistory, summary } = computeLedger(team);

      const lastSolveTime = team.submissions.length > 0
        ? team.submissions[team.submissions.length - 1].createdAt
        : null;

      return {
        rank: 0,
        teamId: team.id,
        teamName: team.name,
        batchTier: team.batchTier as "FIRST_YEAR" | "SENIOR",
        isFirstYear: team.batchTier === "FIRST_YEAR",
        score: summary.score,
        puzzlesSolved: team.submissions.length,
        lastSolveTime,
        members: team.members,
        pointHistory,
        totalGained: summary.totalGained,
        totalPenalties: summary.totalPenalties,
        totalAdjustments: summary.totalAdjustments,
      };
    });

    // Sort: Higher score first, then earliest lastSolveTime, then a stable
    // teamId tie-break. The last clause matters: without a total order the
    // comparator is non-transitive for equal-score teams (both-null or
    // mixed-null lastSolveTime), so V8 may rank teams inconsistently between
    // sorts — flipping leaderboard positions between page loads.
    ranked.sort((a, b) => {
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

    // Assign ranks
    ranked.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // If hideTeamNames is active and requester is not admin, mask team names and strip identities
    const shouldMask = hideTeamNames && !requesterIsAdmin;
    if (shouldMask) {
      ranked.forEach((entry) => {
        const maskedName = `Team #${entry.rank.toString().padStart(2, "0")}`;
        entry.teamName = maskedName;
        entry.teamId = `anon-${entry.rank}`;
        // Strip member identities to prevent de-anonymization via DevTools
        entry.members = [];
        // Sanitize point history: remove author names and organizer notes
        entry.pointHistory = entry.pointHistory.map((ev) => ({
          ...ev,
          authorName: undefined,
          reason: undefined,
        }));
      });
    } else if (!requesterIsAdmin) {
      // Non-admins must NEVER receive team member rosters or student PII
      ranked.forEach((entry) => {
        entry.members = [];
      });
    }

    // Generate Timeline Data for Top 20 teams
    const top20 = ranked.slice(0, 20);
    const topTeamNames = top20.map((t) => t.teamName);

    // Collect all timeline events from top 20
    type TimelineEvent = {
      teamName: string;
      time: Date;
      scoreAfter: number;
    };
    const timelineEvents: TimelineEvent[] = [];

    for (const team of top20) {
      for (const ev of team.pointHistory) {
        timelineEvents.push({
          teamName: team.teamName,
          time: new Date(ev.timestamp),
          scoreAfter: ev.scoreAfter,
        });
      }
    }

    // Sort timeline events chronologically
    timelineEvents.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Build timeline data points
    const timelineData: TimelineDataPoint[] = [];
    const currentScores: Record<string, number> = {};
    topTeamNames.forEach((name) => (currentScores[name] = 0));

    // Initial baseline
    if (timelineEvents.length > 0) {
      const startTime = config?.startTime
        ? new Date(config.startTime)
        : new Date(timelineEvents[0].time.getTime() - 60000);
      timelineData.push({
        // Seconds granularity: minute-only labels made same-minute solves
        // collapse into duplicate x categories, letting the step-line connect
        // points out of chronological order.
        timestamp: startTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        ...currentScores,
      });
    }

    for (const event of timelineEvents) {
      currentScores[event.teamName] = event.scoreAfter;
      timelineData.push({
        timestamp: event.time.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        ...currentScores,
      });
    }

    return {
      entries: ranked,
      isFrozen,
      timelineData,
      topTeamNames,
      showQuestionsSolved,
      showPointHistory,
      hideTeamNames,
      isAdminViewer: requesterIsAdmin,
    };
  } catch (error) {
    // Log loudly and rethrow so the API route returns 500 instead of a
    // healthy-looking empty leaderboard that masks a database outage.
    console.error("getLeaderboardData error:", error);
    throw error instanceof Error ? error : new Error("Failed to compute leaderboard.");
  }
}
