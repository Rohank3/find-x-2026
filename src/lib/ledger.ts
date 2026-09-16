/**
 * Shared team score ledger.
 *
 * Single source of truth for the chronological point history (solves,
 * hint penalties, organizer adjustments) and the derived score summary.
 * Used by `getLeaderboardData` (leaderboard + timeline) and the team
 * dashboard page — previously two ~150-line copies that could drift.
 */

export type LedgerEventType =
  | "SOLVE"
  | "HINT_PENALTY"
  | "ORGANIZER_BONUS"
  | "ORGANIZER_PENALTY";

export interface LedgerEvent {
  id: string;
  type: LedgerEventType;
  title: string;
  amount: number; // positive or negative
  scoreAfter: number;
  reason?: string;
  authorName?: string;
  timestamp: string; // ISO string
}

export interface LedgerSummary {
  score: number;
  totalGained: number;
  totalPenalties: number;
  totalAdjustments: number;
}

export type LedgerActor = { name?: string | null; email?: string | null } | null | undefined;

/**
 * Minimal structural shape of a Prisma team include with submissions /
 * hintUnlocks / scoreAdjustments (both call sites select at least these).
 */
export interface LedgerTeamData {
  submissions: Array<{
    id: string;
    createdAt: Date;
    pointsAwarded: number;
    puzzle: { orderIndex: number; title: string; basePoints: number } | null;
  }>;
  hintUnlocks: Array<{
    id: string;
    unlockedAt: Date;
    hint: {
      orderIndex: number;
      penaltyPoints: number;
      puzzle: { orderIndex: number; title: string } | null;
    } | null;
    unlockedBy?: LedgerActor;
  }>;
  scoreAdjustments: Array<{
    id: string;
    amount: number;
    reason: string;
    createdAt: Date;
    createdBy?: LedgerActor;
  }>;
}

export interface ComputeLedgerOptions {
  /**
   * Hint-author display differs between surfaces: the dashboard falls back to
   * the unlocker's email prefix, the leaderboard to a plain "Teammate".
   * Preserved as an injection point so neither surface changes behavior.
   */
  resolveHintAuthor?: (actor: LedgerActor) => string;
}

export function computeLedger(
  team: LedgerTeamData,
  options: ComputeLedgerOptions = {}
): { pointHistory: LedgerEvent[]; summary: LedgerSummary } {
  const resolveHintAuthor =
    options.resolveHintAuthor ?? ((actor: LedgerActor) => actor?.name || "Teammate");

  type RawEvent = {
    id: string;
    date: Date;
    type: LedgerEventType;
    title: string;
    amount: number;
    reason?: string;
    authorName?: string;
  };

  const rawEvents: RawEvent[] = [];

  // 1. Solves (+base points)
  for (const sub of team.submissions) {
    const solvePoints = sub.puzzle?.basePoints ?? sub.pointsAwarded ?? 100;
    rawEvents.push({
      id: `solve-${sub.id}`,
      date: sub.createdAt,
      type: "SOLVE",
      title: sub.puzzle
        ? `Solved #${sub.puzzle.orderIndex}: ${sub.puzzle.title}`
        : "Puzzle Solved",
      amount: solvePoints,
      reason: "Correct answer submitted",
    });
  }

  // 2. Hint Penalties (-penalty points)
  for (const unlock of team.hintUnlocks) {
    const penalty = unlock.hint?.penaltyPoints ?? 20;
    const puzzleRef = unlock.hint?.puzzle
      ? `#${unlock.hint.puzzle.orderIndex}: ${unlock.hint.puzzle.title}`
      : "Puzzle";
    rawEvents.push({
      id: `hint-${unlock.id}`,
      date: unlock.unlockedAt,
      type: "HINT_PENALTY",
      title: `Hint #${unlock.hint?.orderIndex ?? 1} — ${puzzleRef}`,
      amount: -penalty,
      reason: "Hint unlocked",
      authorName: resolveHintAuthor(unlock.unlockedBy),
    });
  }

  // 3. Organizer Adjustments (+/- amount)
  for (const adj of team.scoreAdjustments) {
    const isBonus = adj.amount >= 0;
    rawEvents.push({
      id: `adj-${adj.id}`,
      date: adj.createdAt,
      type: isBonus ? "ORGANIZER_BONUS" : "ORGANIZER_PENALTY",
      title: isBonus ? `Bonus (+${adj.amount})` : `Penalty (${adj.amount})`,
      amount: adj.amount,
      reason: adj.reason,
      authorName: adj.createdBy?.name || "Organizer",
    });
  }

  // Chronological sort
  rawEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Compute rolling score
  let rolling = 0;
  let totalGained = 0;
  let totalPenalties = 0;
  let totalAdjustments = 0;

  const pointHistory: LedgerEvent[] = [];

  for (const ev of rawEvents) {
    if (ev.type === "SOLVE") {
      totalGained += ev.amount;
    } else if (ev.type === "HINT_PENALTY") {
      totalPenalties += Math.abs(ev.amount);
    } else {
      totalAdjustments += ev.amount;
    }

    rolling = Math.max(0, rolling + ev.amount);

    pointHistory.push({
      id: ev.id,
      type: ev.type,
      title: ev.title,
      amount: ev.amount,
      scoreAfter: rolling,
      reason: ev.reason,
      authorName: ev.authorName,
      timestamp: ev.date.toISOString(),
    });
  }

  return {
    pointHistory,
    summary: { score: rolling, totalGained, totalPenalties, totalAdjustments },
  };
}
