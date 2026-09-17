"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeAnswer, stripDangerousChars, isValidEntityId } from "@/lib/utils";
import { checkLockout, recordWrongAttempt, clearAttemptsOnSuccess } from "@/lib/lockout";
import { revalidatePath } from "next/cache";

export type SubmitResult = {
  success: boolean;
  isCorrect?: boolean;
  pointsAwarded?: number;
  lockedOut?: boolean;
  remainingSeconds?: number;
  message?: string;
  error?: string;
};

/**
 * Evaluates puzzle submissions server-side with normalized matching,
 * Redis anti-brute-force rate limiting, and atomic Q1 roster freeze.
 */
export async function submitPuzzleAnswerAction(
  puzzleId: string,
  answerText: string
): Promise<SubmitResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user?.teamId || !user.team) {
      return { success: false, error: "You must be part of a team to submit answers." };
    }

    const team = user.team;

    if (!isValidEntityId(puzzleId)) {
      return { success: false, error: "Invalid puzzle identifier." };
    }

    if (typeof answerText !== "string" || answerText.length > 500) {
      return { success: false, error: "Please enter a valid answer (maximum 500 characters)." };
    }

    // Check system competition state
    const systemConfig = await prisma.systemConfig.findUnique({ where: { id: "default" } });
    const compState = systemConfig?.competitionState ?? "UPCOMING";
    if (compState !== "LIVE" && compState !== "FROZEN") {
      return {
        success: false,
        error: `Submissions are currently closed. Competition status: ${compState}.`,
      };
    }

    // Check Redis anti-brute-force lockout state
    const lockout = await checkLockout(team.id, puzzleId);
    if (lockout.isLocked) {
      return {
        success: false,
        lockedOut: true,
        remainingSeconds: lockout.remainingSeconds,
        error: `Your team is locked out! Please wait ${lockout.remainingSeconds}s before trying again.`,
      };
    }

    // Fetch puzzle
    const puzzle = await prisma.puzzle.findUnique({
      where: { id: puzzleId },
      include: { hints: { include: { teamUnlocks: { where: { teamId: team.id } } } } },
    });

    if (!puzzle) {
      return { success: false, error: "Puzzle not found." };
    }

    // Verify team has solved all preceding puzzles in the ladder (Progressive Unlock)
    const precedingUnsolved = await prisma.puzzle.count({
      where: {
        orderIndex: { lt: puzzle.orderIndex },
        submissions: {
          none: { teamId: team.id, isCorrect: true },
        },
      },
    });

    if (precedingUnsolved > 0) {
      return { success: false, error: "This puzzle is locked! Complete preceding puzzles first." };
    }

    // Normalize answer
    const normalizedAttempt = normalizeAnswer(answerText);
    if (!normalizedAttempt) {
      return { success: false, error: "Please enter an answer." };
    }

    // Check against accepted answers
    const matchesAnswer = puzzle.acceptedAnswers.some(
      (ans) => normalizeAnswer(ans) === normalizedAttempt
    );

    // Fast-path duplicate check (full atomic guard happens at insert time below)
    const alreadySolved = await prisma.submission.findFirst({
      where: { teamId: team.id, puzzleId, isCorrect: true },
    });
    if (alreadySolved) {
      return { success: true, isCorrect: true, message: "Puzzle already solved by your team!" };
    }

    if (!matchesAnswer) {
      // Record wrong attempt in Redis & trigger lockout if threshold is breached
      const attemptResult = await recordWrongAttempt(team.id, puzzle.id, {
        maxAttempts: systemConfig?.lockoutMaxAttempts ?? 5,
        windowMinutes: systemConfig?.lockoutWindowMinutes ?? 2,
        lockoutMinutes: systemConfig?.lockoutDurationMinutes ?? 5,
      });

      // Record submission audit in DB
      const cleanAttempt = stripDangerousChars(answerText).trim().slice(0, 100);
      await prisma.submission.create({
        data: {
          teamId: team.id,
          puzzleId: puzzle.id,
          attemptText: cleanAttempt,
          isCorrect: false,
          pointsAwarded: 0,
        },
      });

      if (attemptResult.lockedOutNow) {
        return {
          success: false,
          isCorrect: false,
          lockedOut: true,
          remainingSeconds: attemptResult.remainingSeconds,
          error: `Too many incorrect attempts. Please wait ${attemptResult.remainingSeconds}s before trying again.`,
        };
      }

      return {
        success: false,
        isCorrect: false,
        lockedOut: false,
        message: "Incorrect answer. Please try again.",
      };
    }

    // --- Answer is CORRECT ---
    // Clear wrong attempts
    await clearAttemptsOnSuccess(team.id, puzzle.id);

    // Calculate score: base points minus unlocked hints penalty
    let totalPenalty = 0;
    for (const h of puzzle.hints) {
      if (h.teamUnlocks && h.teamUnlocks.length > 0) {
        totalPenalty += h.penaltyPoints;
      }
    }
    const netPoints = Math.max(0, puzzle.basePoints - totalPenalty);

    // Process solve transaction.
    // Concurrency safety: a Team row lock + in-transaction duplicate check
    // (see below) guarantee two teammates submitting the same correct answer
    // concurrently can NEVER both insert a winning row (classic TOCTOU: the
    // original pre-check ran outside the transaction, allowing duplicate
    // solves and double roster freezes).
    let solveSucceeded = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Serialize concurrent correct submissions for this team: the row lock
        // makes the duplicate check + winning insert atomic. Without it two
        // teammates submitting the same answer can both pass the pre-check and
        // both INSERT a winning row (double points, double roster freeze) —
        if (!isValidEntityId(team.id)) {
          throw new Error("Invalid team identifier format");
        }
        await tx.$queryRaw`SELECT id FROM "Team" WHERE id = ${team.id} FOR UPDATE`;

        const concurrentWin = await tx.submission.findFirst({
          where: { teamId: team.id, puzzleId: puzzle.id, isCorrect: true },
          select: { id: true },
        });
        if (concurrentWin) {
          throw new Error("ALREADY_SOLVED_BY_TEAM");
        }

        const cleanAttempt = stripDangerousChars(answerText).trim().slice(0, 100);
        await tx.submission.create({
          data: {
            teamId: team.id,
            puzzleId: puzzle.id,
            attemptText: cleanAttempt,
            isCorrect: true,
            pointsAwarded: netPoints, // Net points (base - hint penalties), matching the schema contract
          },
        });

        // If solving Question 1: Permanently freeze team roster!
        const updateData: { isFrozen?: boolean; currentPuzzleId?: string } = {};
        if (puzzle.orderIndex === 1 && !team.isFrozen) {
          updateData.isFrozen = true;
        }

        // Find first remaining unsolved puzzle in ascending ladder order
        const allLadderPuzzles = await tx.puzzle.findMany({
          orderBy: { orderIndex: "asc" },
          select: { id: true },
        });
        const teamSolves = await tx.submission.findMany({
          where: { teamId: team.id, isCorrect: true },
          select: { puzzleId: true },
        });
        const solvedSet = new Set(teamSolves.map((s) => s.puzzleId));
        solvedSet.add(puzzle.id);

        const nextUnsolved = allLadderPuzzles.find((p) => !solvedSet.has(p.id));
        if (nextUnsolved) {
          updateData.currentPuzzleId = nextUnsolved.id;
        }

        await tx.team.update({
          where: { id: team.id },
          data: updateData,
        });

        solveSucceeded = true;
      });
    } catch (txErr) {
      // Two concurrent correct submissions: only one insert wins; the loser is
      // reported as "already solved", not as an error.
      if (txErr instanceof Error && txErr.message === "ALREADY_SOLVED_BY_TEAM") {
        return { success: true, isCorrect: true, message: "Puzzle already solved by your team!" };
      }
      // Reconciliation fallback for races that slip past the in-transaction
      // guard (e.g. a serialization abort after the winner committed).
      if (!solveSucceeded && (await alreadySolvedNow(team.id, puzzle.id))) {
        return { success: true, isCorrect: true, message: "Puzzle already solved by your team!" };
      }
      throw txErr;
    }

    revalidatePath("/hunt");
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");

    return {
      success: true,
      isCorrect: true,
      pointsAwarded: netPoints,
      message: `Correct! You solved "${puzzle.title}" and earned ${netPoints} points!`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to evaluate submission.";
    return { success: false, error: message };
  }
}

async function alreadySolvedNow(teamId: string, puzzleId: string): Promise<boolean> {
  const solved = await prisma.submission.findFirst({
    where: { teamId, puzzleId, isCorrect: true },
    select: { id: true },
  });
  return Boolean(solved);
}

/**
 * Unlocks a timed hint for the entire team.
 * Logs which team member authorized the unlock and deducts penalty points.
 */
export async function unlockHintAction(hintId: string): Promise<{
  success: boolean;
  hintContent?: string;
  penalty?: number;
  unlockedByName?: string;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized." };

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user?.teamId || !user.team) {
      return { success: false, error: "You must be in a team to unlock hints." };
    }

    if (!isValidEntityId(hintId)) {
      return { success: false, error: "Invalid hint identifier." };
    }

    const teamId = user.teamId;

    // Verify competition state allows hint unlocking
    const systemConfig = await prisma.systemConfig.findUnique({
      where: { id: "default" },
      select: { startTime: true, competitionState: true },
    });
    const compState = systemConfig?.competitionState ?? "UPCOMING";
    if (compState !== "LIVE" && compState !== "FROZEN") {
      return {
        success: false,
        error: `Hints cannot be unlocked while competition is ${compState}.`,
      };
    }

    const hint = await prisma.hint.findUnique({
      where: { id: hintId },
      include: {
        puzzle: true,
        teamUnlocks: { where: { teamId } },
      },
    });

    if (!hint) return { success: false, error: "Hint not found." };

    // Check if already unlocked
    if (hint.teamUnlocks.length > 0) {
      return {
        success: true,
        hintContent: hint.content,
        penalty: hint.penaltyPoints,
      };
    }

    // Enforce the timed delay (UI shows "Available after Xm" — the server
    // must agree, otherwise the delay is purely cosmetic and the penalty
    // schedule can be bypassed). Delay is measured from hunt start when known,
    // otherwise from when the puzzle was created.
    if (hint.unlockDelayMinutes > 0) {
      const anchor = systemConfig?.startTime ?? hint.puzzle.createdAt;
      const availableAt = new Date(anchor).getTime() + hint.unlockDelayMinutes * 60 * 1000;
      if (Date.now() < availableAt) {
        const minutesLeft = Math.max(1, Math.ceil((availableAt - Date.now()) / 60000));
        return {
          success: false,
          error: `This hint unlocks in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
        };
      }
    }

    // Check if team has already solved this puzzle
    const alreadySolved = await prisma.submission.findFirst({
      where: { teamId, puzzleId: hint.puzzleId, isCorrect: true },
    });
    if (alreadySolved) {
      return { success: false, error: "This puzzle is already solved by your team! Hints can no longer be unlocked." };
    }

    // Verify team has reached this puzzle (all preceding puzzles solved)
    const precedingUnsolved = await prisma.puzzle.count({
      where: {
        orderIndex: { lt: hint.puzzle.orderIndex },
        submissions: {
          none: { teamId, isCorrect: true },
        },
      },
    });
    if (precedingUnsolved > 0) {
      return { success: false, error: "Cannot unlock hints for locked puzzles." };
    }

    // Create unlock record; a teammate unlocking the same hint concurrently
    // hits the unique constraint — surface a friendly message, not a Prisma error.
    try {
      await prisma.teamHintUnlock.create({
        data: {
          teamId,
          hintId: hint.id,
          unlockedById: userId,
        },
      });
    } catch (unlockErr) {
      if (
        typeof unlockErr === "object" &&
        unlockErr !== null &&
        "code" in unlockErr &&
        (unlockErr as { code?: string }).code === "P2002"
      ) {
        return {
          success: true,
          hintContent: hint.content,
          penalty: hint.penaltyPoints,
        };
      }
      throw unlockErr;
    }

    revalidatePath("/hunt");
    return {
      success: true,
      hintContent: hint.content,
      penalty: hint.penaltyPoints,
      unlockedByName: user.name || "Teammate",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to unlock hint.";
    return { success: false, error: message };
  }
}

/**
 * Creates an in-app support desk ticket.
 */
export async function createSupportTicketAction(
  puzzleId: string,
  category: "AMBIGUITY" | "ASSET_GLITCH" | "REQUEST_DIRECT_CLUE",
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    if (!isValidEntityId(puzzleId)) {
      return { success: false, error: "Invalid puzzle identifier." };
    }

    const VALID_CATEGORIES = ["AMBIGUITY", "ASSET_GLITCH", "REQUEST_DIRECT_CLUE"] as const;
    if (!category || !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
      return { success: false, error: "Invalid ticket category." };
    }

    // Verify support desk is currently enabled in SystemConfig and competition is active
    const config = await prisma.systemConfig.findUnique({ where: { id: "default" } }).catch(() => null);
    if (config && config.supportFeatureEnabled === false) {
      return { success: false, error: "Support desk is currently disabled by organizers." };
    }

    const compState = config?.competitionState ?? "UPCOMING";
    if (compState !== "LIVE" && compState !== "FROZEN") {
      return {
        success: false,
        error: `Support tickets cannot be submitted while competition is ${compState}.`,
      };
    }

    // Resilient lookup by ID or Email. Clauses are built conditionally: an
    // empty `{}` inside a Prisma OR is a match-all disjunct, so a session
    // missing one identifier would otherwise resolve to an arbitrary user row
    // and file the ticket under the wrong team.
    const identityClauses: Array<{ id: string } | { email: string }> = [];
    if (session.user.id) identityClauses.push({ id: session.user.id });
    if (session.user.email) identityClauses.push({ email: session.user.email });

    const user = identityClauses.length
      ? await prisma.user.findFirst({
          where: { OR: identityClauses },
          include: { team: true },
        })
      : null;

    if (!user) return { success: false, error: "User profile not found." };
    if (!user.teamId || !user.team) return { success: false, error: "You must be part of a team to submit a ticket." };

    const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
    if (!puzzle) return { success: false, error: "Puzzle not found." };

    // Prevent filing tickets for puzzles the team hasn't reached yet
    const precedingUnsolved = await prisma.puzzle.count({
      where: {
        orderIndex: { lt: puzzle.orderIndex },
        submissions: {
          none: { teamId: user.teamId, isCorrect: true },
        },
      },
    });
    if (precedingUnsolved > 0) {
      return { success: false, error: "Cannot submit support tickets for locked puzzles." };
    }

    if (typeof message !== "string") {
      return { success: false, error: "Ticket message must be text." };
    }

    const cleanMessage = stripDangerousChars(message).trim();
    if (!cleanMessage || cleanMessage.length < 2) {
      return { success: false, error: "Please provide a message describing your question or issue." };
    }
    if (cleanMessage.length > 2000) {
      return { success: false, error: "Ticket message cannot exceed 2000 characters." };
    }

    await prisma.supportTicket.create({
      data: {
        teamId: user.teamId,
        userId: user.id,
        puzzleId: puzzle.id,
        category,
        message: cleanMessage,
      },
    });

    revalidatePath("/hunt");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit ticket.";
    return { success: false, error: message };
  }
}
