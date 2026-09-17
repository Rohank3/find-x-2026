"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { manualAdminUnlock } from "@/lib/lockout";
import { revalidatePath } from "next/cache";
import { notifyAnnouncementUpdate, purgeExpiredAnnouncements } from "@/lib/announcements";
import {
  stripDangerousChars,
  validateAssetUrl,
  isValidEntityId,
  normalizeAnswer,
} from "@/lib/utils";

async function requireOrganizer() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ORGANIZER") {
    throw new Error("Access Denied: Organizer privileges required.");
  }
  return session.user;
}

/**
 * Server-paginated submissions feed for the admin console.
 *
 * Replaces the old approach of shipping every submission row of every team to
 * the client on each admin visit. Filtering and search happen at the database
 * level (attempt text, team name, puzzle title), 50 rows per page.
 */
const SUBMISSIONS_PAGE_SIZE = 50;

export interface AdminSubmissionRow {
  id: string;
  createdAt: Date;
  attemptText: string;
  isCorrect: boolean;
  pointsAwarded: number;
  team: { id: string; name: string; batchTier: string } | null;
  puzzle: { id: string; orderIndex: number; title: string } | null;
}

export interface SubmissionsPageData {
  rows: AdminSubmissionRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  globalTotal: number;
  globalCorrect: number;
}

export async function getSubmissionsPageAction(params: {
  page?: number;
  search?: string;
  status?: "ALL" | "CORRECT" | "INCORRECT";
  teamId?: string;
  puzzleId?: string;
}): Promise<{ success: boolean; error?: string; data?: SubmissionsPageData }> {
  try {
    await requireOrganizer();

    const q = params.search?.trim();

    const where: Prisma.SubmissionWhereInput = {};
    if (params.status === "CORRECT") where.isCorrect = true;
    else if (params.status === "INCORRECT") where.isCorrect = false;
    if (params.teamId) where.teamId = params.teamId;
    if (params.puzzleId) where.puzzleId = params.puzzleId;
    if (q) {
      where.OR = [
        { attemptText: { contains: q, mode: "insensitive" } },
        { team: { name: { contains: q, mode: "insensitive" } } },
        { puzzle: { title: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, globalTotal, globalCorrect] = await Promise.all([
      prisma.submission.count({ where }),
      prisma.submission.count(),
      prisma.submission.count({ where: { isCorrect: true } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / SUBMISSIONS_PAGE_SIZE));

    // Clamp BEFORE the query, not just in the response: rows and page must
    // agree, otherwise a concurrent delete that shrinks the dataset mid-request
    // makes `skip` overshoot row count and returns 0 rows for a page the
    // client believes exists (blank feed instead of the nearest valid page).
    const requestedPage = Math.min(
      Math.max(1, Math.floor(params.page ?? 1)),
      totalPages
    );

    const rows = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        team: { select: { id: true, name: true, batchTier: true } },
        puzzle: { select: { id: true, orderIndex: true, title: true } },
      },
      skip: (requestedPage - 1) * SUBMISSIONS_PAGE_SIZE,
      take: SUBMISSIONS_PAGE_SIZE,
    });

    return {
      success: true,
      data: {
        rows,
        page: requestedPage,
        pageSize: SUBMISSIONS_PAGE_SIZE,
        total,
        totalPages,
        globalTotal,
        globalCorrect,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load submissions.";
    return { success: false, error: msg };
  }
}

/**
 * Updates the global competition state machine.
 */
export async function updateCompetitionStateAction(
  newState: "UPCOMING" | "LIVE" | "FROZEN" | "ENDED"
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrganizer();

    const VALID_STATES = ["UPCOMING", "LIVE", "FROZEN", "ENDED"] as const;
    if (!newState || !VALID_STATES.includes(newState)) {
      return { success: false, error: "Invalid competition state." };
    }

    const currentConfig = await prisma.systemConfig.findUnique({
      where: { id: "default" },
    });

    const updateData: {
      competitionState: "UPCOMING" | "LIVE" | "FROZEN" | "ENDED";
      startTime?: Date | null;
      freezeTime?: Date | null;
    } = {
      competitionState: newState,
    };

    if (newState === "LIVE") {
      if (!currentConfig?.startTime || currentConfig.competitionState === "UPCOMING") {
        updateData.startTime = new Date();
      }
    } else if (newState === "FROZEN") {
      updateData.freezeTime = new Date();
    } else if (newState === "UPCOMING") {
      updateData.startTime = null;
      updateData.freezeTime = null;
    }

    await prisma.systemConfig.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        competitionState: newState,
        startTime: newState === "LIVE" ? new Date() : null,
        freezeTime: newState === "FROZEN" ? new Date() : null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/hunt");
    revalidatePath("/leaderboard");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update state.";
    return { success: false, error: msg };
  }
}

/**
 * Updates the global organizer broadcast alert banner.
 */
export async function updateBroadcastMessageAction(
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrganizer();

    if (message.trim()) {
      return await createAnnouncementAction({ message: message.trim() });
    }

    await prisma.systemConfig.upsert({
      where: { id: "default" },
      update: { broadcastMessage: null },
      create: { id: "default", broadcastMessage: null },
    });

    notifyAnnouncementUpdate();
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/hunt");
    revalidatePath("/leaderboard");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to broadcast.";
    return { success: false, error: msg };
  }
}

/**
 * Creates a new stacked announcement.
 * The retention period is chosen at publish time; the last-used value is
 * persisted to SystemConfig and becomes the default for future announcements.
 */
export async function createAnnouncementAction(data: {
  message: string;
  retentionDays?: number;
}): Promise<{
  success: boolean;
  error?: string;
  announcement?: {
    id: string;
    message: string;
    retentionDays: number;
    createdAt: string;
    expiresAt: string;
  };
}> {
  try {
    const user = await requireOrganizer();
    if (!data || typeof data.message !== "string") {
      return { success: false, error: "Announcement message must be text." };
    }
    const cleanMessage = stripDangerousChars(data.message).trim();
    if (!cleanMessage) {
      return { success: false, error: "Announcement message cannot be empty." };
    }
    if (cleanMessage.length > 1000) {
      return { success: false, error: "Announcement message cannot exceed 1,000 characters." };
    }

    // Honor the requested retention; fall back to the last-used default.
    const config = await prisma.systemConfig.findUnique({
      where: { id: "default" },
      select: { announcementRetentionDays: true },
    });
    const lastUsedDays = config?.announcementRetentionDays ?? 3;
    const retentionDays =
      typeof data.retentionDays === "number" && data.retentionDays > 0
        ? Math.max(1, Math.min(365, Math.floor(data.retentionDays)))
        : lastUsedDays;

    const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);

    // Housekeeping moved here from the read path (see lib/announcements.ts):
    // expired rows are pruned when organizers publish, not on every page view.
    await purgeExpiredAnnouncements().catch(() => undefined);

    const created = await prisma.announcement.create({
      data: {
        message: cleanMessage,
        retentionDays,
        expiresAt,
        createdById: user.id,
      },
    });

    // Update broadcastMessage for legacy compatibility and persist the
    // last-used retention value as the new default.
    await prisma.systemConfig.upsert({
      where: { id: "default" },
      update: { broadcastMessage: cleanMessage, announcementRetentionDays: retentionDays },
      create: {
        id: "default",
        broadcastMessage: cleanMessage,
        announcementRetentionDays: retentionDays,
      },
    });

    // Trigger instant fetch sequence across all connected clients
    notifyAnnouncementUpdate();

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/hunt");
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    return {
      success: true,
      announcement: {
        id: created.id,
        message: created.message,
        retentionDays: created.retentionDays,
        createdAt: created.createdAt.toISOString(),
        expiresAt: created.expiresAt.toISOString(),
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create announcement.";
    return { success: false, error: msg };
  }
}

/**
 * Deletes an older or unwanted announcement by ID.
 */
export async function deleteAnnouncementAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrganizer();

    if (typeof id !== "string" || (!id.startsWith("temp-") && !isValidEntityId(id))) {
      return { success: false, error: "Invalid announcement identifier." };
    }

    // Expired-row pruning on the write path (mirrors createAnnouncementAction).
    await purgeExpiredAnnouncements().catch(() => undefined);

    if (id && !id.startsWith("temp-")) {
      await prisma.announcement.deleteMany({
        where: { id },
      });
    }

    // Check remaining latest active announcement for legacy broadcastMessage
    const latest = await prisma.announcement.findFirst({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    await prisma.systemConfig.upsert({
      where: { id: "default" },
      update: { broadcastMessage: latest?.message || null },
      create: { id: "default", broadcastMessage: latest?.message || null },
    });

    // Trigger instant fetch sequence across all connected clients
    notifyAnnouncementUpdate();

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/hunt");
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete announcement.";
    return { success: false, error: msg };
  }
}

/**
 * Manually unlocks a team on a puzzle (Admin override).
 */
export async function unlockTeamLockoutAction(
  teamId: string,
  puzzleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrganizer();

    if (!isValidEntityId(teamId) || !isValidEntityId(puzzleId)) {
      return { success: false, error: "Invalid team or puzzle identifier." };
    }
    await manualAdminUnlock(teamId, puzzleId);

    revalidatePath("/admin/lockouts");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to unlock team.";
    return { success: false, error: msg };
  }
}

/**
 * Updates the anti-brute-force lockout configuration (max attempts, window, duration).
 */
export async function updateLockoutSettingsAction(settings: {
  lockoutMaxAttempts: number;
  lockoutWindowMinutes: number;
  lockoutDurationMinutes: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrganizer();
    if (!settings || typeof settings !== "object") {
      return { success: false, error: "Invalid lockout settings payload." };
    }

    const maxAttempts = Math.floor(Number(settings.lockoutMaxAttempts));
    const windowMinutes = Math.floor(Number(settings.lockoutWindowMinutes));
    const durationMinutes = Math.floor(Number(settings.lockoutDurationMinutes));

    if (
      !Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100 ||
      !Number.isSafeInteger(windowMinutes) || windowMinutes < 1 || windowMinutes > 1440 ||
      !Number.isSafeInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440
    ) {
      return {
        success: false,
        error: "All values must be valid integers within allowed ranges (attempts: 1-100, window: 1-1440m, lockout: 1-1440m).",
      };
    }
    await prisma.systemConfig.upsert({
      where: { id: "default" },
      update: {
        lockoutMaxAttempts: maxAttempts,
        lockoutWindowMinutes: windowMinutes,
        lockoutDurationMinutes: durationMinutes,
      },
      create: {
        id: "default",
        lockoutMaxAttempts: maxAttempts,
        lockoutWindowMinutes: windowMinutes,
        lockoutDurationMinutes: durationMinutes,
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update lockout settings.";
    return { success: false, error: msg };
  }
}

/**
 * Creates or updates a puzzle.
 */
/**
 * Creates or updates a puzzle.
 * - If adding a new puzzle at an existing ladder order, automatically shifts all existing
 *   puzzles from that order onwards down by +1.
 * - If updating an existing puzzle with a new ladder order, shifts intervening puzzles smoothly.
 */
export async function upsertPuzzleAction(data: {
  id?: string;
  orderIndex: number;
  title: string;
  description: string;
  assetUrl?: string;
  assetType?: string;
  basePoints: number;
  acceptedAnswers: string[];
  initialHints?: Array<{ content: string; penaltyPoints: number; unlockDelayMinutes: number }>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrganizer();

    if (data.id && !isValidEntityId(data.id)) {
      return { success: false, error: "Invalid puzzle identifier." };
    }

    const cleanTitle = stripDangerousChars(data.title || "").trim();
    if (!cleanTitle || cleanTitle.length > 100) {
      return { success: false, error: "Puzzle title must be between 1 and 100 characters." };
    }

    const cleanDescription = (data.description || "").replace(/\0/g, "").trim();
    if (!cleanDescription || cleanDescription.length > 10000) {
      return { success: false, error: "Puzzle description must be between 1 and 10,000 characters." };
    }

    let validatedAssetUrl: string | null = null;
    try {
      validatedAssetUrl = validateAssetUrl(data.assetUrl);
    } catch (urlErr) {
      return { success: false, error: urlErr instanceof Error ? urlErr.message : "Invalid asset URL." };
    }

    const VALID_ASSET_TYPES = ["image", "audio", "pdf", "video"] as const;
    const cleanAssetType = data.assetType && (VALID_ASSET_TYPES as readonly string[]).includes(data.assetType)
      ? data.assetType
      : null;

    const basePoints = Math.floor(Number(data.basePoints));
    if (!Number.isSafeInteger(basePoints) || basePoints < 1 || basePoints > 10000) {
      return { success: false, error: "Base points must be an integer between 1 and 10,000." };
    }

    if (!Array.isArray(data.acceptedAnswers) || data.acceptedAnswers.length === 0) {
      return { success: false, error: "At least one accepted answer is required." };
    }
    if (data.acceptedAnswers.length > 50) {
      return { success: false, error: "Maximum 50 accepted answers allowed." };
    }

    const validatedAnswers: string[] = [];
    for (const ans of data.acceptedAnswers) {
      if (typeof ans !== "string" || !ans.trim()) {
        return { success: false, error: "All accepted answers must be non-empty text." };
      }
      const cleanAns = stripDangerousChars(ans).trim().slice(0, 200);
      if (!normalizeAnswer(cleanAns)) {
        return { success: false, error: `Accepted answer "${ans}" contains no matchable alphanumeric characters.` };
      }
      validatedAnswers.push(cleanAns);
    }

    const validatedInitialHints: Array<{ content: string; penaltyPoints: number; unlockDelayMinutes: number }> = [];
    if (Array.isArray(data.initialHints)) {
      if (data.initialHints.length > 20) {
        return { success: false, error: "Maximum 20 initial hints allowed." };
      }
      for (const h of data.initialHints) {
        if (!h || typeof h.content !== "string") continue;
        const cleanContent = stripDangerousChars(h.content).trim();
        if (cleanContent.length < 2 || cleanContent.length > 2000) continue;

        const penalty = Math.floor(Number(h.penaltyPoints) || 20);
        const delay = Math.floor(Number(h.unlockDelayMinutes) || 15);

        validatedInitialHints.push({
          content: cleanContent,
          penaltyPoints: Number.isSafeInteger(penalty) && penalty >= 0 && penalty <= 5000 ? penalty : 20,
          unlockDelayMinutes: Number.isSafeInteger(delay) && delay >= 0 && delay <= 1440 ? delay : 15,
        });
      }
    }

    const targetOrder = Math.max(1, Math.floor(Number(data.orderIndex) || 1));

    if (data.id) {
      // Updating an existing puzzle
      const current = await prisma.puzzle.findUnique({
        where: { id: data.id },
      });
      if (!current) {
        return { success: false, error: "Puzzle not found." };
      }

      await prisma.$transaction(async (tx) => {
        if (current.orderIndex !== targetOrder) {
          const oldIndex = current.orderIndex;

          // Temporarily set current puzzle order to a negative number to free up its unique slot
          await tx.puzzle.update({
            where: { id: data.id },
            data: { orderIndex: -oldIndex - 1000 },
          });

          if (targetOrder < oldIndex) {
            // Moving UP: Shift puzzles in [targetOrder, oldIndex - 1] DOWN (+1)
            // Process descending to avoid unique constraint collisions
            const toShift = await tx.puzzle.findMany({
              where: {
                orderIndex: { gte: targetOrder, lt: oldIndex },
                id: { not: data.id },
              },
              orderBy: { orderIndex: "desc" },
            });
            for (const p of toShift) {
              await tx.puzzle.update({
                where: { id: p.id },
                data: { orderIndex: p.orderIndex + 1 },
              });
            }
          } else {
            // Moving DOWN: Shift puzzles in [oldIndex + 1, targetOrder] UP (-1)
            // Process ascending to avoid unique constraint collisions
            const toShift = await tx.puzzle.findMany({
              where: {
                orderIndex: { gt: oldIndex, lte: targetOrder },
                id: { not: data.id },
              },
              orderBy: { orderIndex: "asc" },
            });
            for (const p of toShift) {
              await tx.puzzle.update({
                where: { id: p.id },
                data: { orderIndex: p.orderIndex - 1 },
              });
            }
          }
        }

        // Save updated fields
        await tx.puzzle.update({
          where: { id: data.id },
          data: {
            orderIndex: targetOrder,
            title: cleanTitle,
            description: cleanDescription,
            assetUrl: validatedAssetUrl,
            assetType: cleanAssetType,
            basePoints,
            acceptedAnswers: validatedAnswers,
          },
        });
      });
    } else {
      // Adding a new puzzle
      await prisma.$transaction(async (tx) => {
        // Find if any puzzles exist at or above targetOrder
        const existingAtOrAbove = await tx.puzzle.findMany({
          where: { orderIndex: { gte: targetOrder } },
          orderBy: { orderIndex: "desc" },
        });

        if (existingAtOrAbove.length > 0) {
          // Shift existing puzzles down by 1 in descending order to avoid unique collisions
          for (const p of existingAtOrAbove) {
            await tx.puzzle.update({
              where: { id: p.id },
              data: { orderIndex: p.orderIndex + 1 },
            });
          }
        }

        // Create new puzzle at targetOrder
        const createdPuzzle = await tx.puzzle.create({
          data: {
            orderIndex: targetOrder,
            title: cleanTitle,
            description: cleanDescription,
            assetUrl: validatedAssetUrl,
            assetType: cleanAssetType,
            basePoints,
            acceptedAnswers: validatedAnswers,
          },
        });

        // If hints were configured in the separate column/section, create them safely
        if (validatedInitialHints.length > 0) {
          for (let i = 0; i < validatedInitialHints.length; i++) {
            const h = validatedInitialHints[i];
            await tx.hint.create({
              data: {
                puzzleId: createdPuzzle.id,
                orderIndex: i + 1,
                content: h.content,
                penaltyPoints: h.penaltyPoints,
                unlockDelayMinutes: h.unlockDelayMinutes,
              },
            });
          }
        }
      });
    }

    revalidatePath("/admin");
    revalidatePath("/hunt");
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save puzzle.";
    return { success: false, error: msg };
  }
}

/**
 * Swaps the order of a puzzle with its immediate neighbor (UP or DOWN).
 */
export async function swapPuzzleOrderAction(
  puzzleId: string,
  direction: "UP" | "DOWN"
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrganizer();

    const allPuzzles = await prisma.puzzle.findMany({
      orderBy: { orderIndex: "asc" },
    });

    const currentIndex = allPuzzles.findIndex((p) => p.id === puzzleId);
    if (currentIndex === -1) {
      return { success: false, error: "Puzzle not found." };
    }

    const targetIndex = direction === "UP" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= allPuzzles.length) {
      return { success: false, error: "Cannot move puzzle further in this direction." };
    }

    const currentPuzzle = allPuzzles[currentIndex];
    const targetPuzzle = allPuzzles[targetIndex];

    await prisma.$transaction(async (tx) => {
      // Use temporary negative orderIndex to safely swap unique values
      await tx.puzzle.update({
        where: { id: currentPuzzle.id },
        data: { orderIndex: -9999 },
      });

      await tx.puzzle.update({
        where: { id: targetPuzzle.id },
        data: { orderIndex: currentPuzzle.orderIndex },
      });

      await tx.puzzle.update({
        where: { id: currentPuzzle.id },
        data: { orderIndex: targetPuzzle.orderIndex },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/hunt");
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reorder puzzle.";
    return { success: false, error: msg };
  }
}

/**
 * Directly change a puzzle's ladder position to a new index.
 */
export async function changePuzzleOrderAction(
  puzzleId: string,
  newOrderIndex: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrganizer();

    const target = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
    if (!target) return { success: false, error: "Puzzle not found." };

    return await upsertPuzzleAction({
      id: target.id,
      orderIndex: newOrderIndex,
      title: target.title,
      description: target.description,
      assetUrl: target.assetUrl ?? undefined,
      assetType: target.assetType ?? undefined,
      basePoints: target.basePoints,
      acceptedAnswers: target.acceptedAnswers,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to change puzzle order.";
    return { success: false, error: msg };
  }
}

export interface HintActionResult {
  id: string;
  orderIndex: number;
  content: string;
  penaltyPoints: number;
  unlockDelayMinutes: number;
}

/**
 * Creates or updates a hint with custom penalty and unlock delay.
 * Computes orderIndex atomically on creation and returns real DB entity data.
 */
export async function upsertHintAction(data: {
  id?: string;
  puzzleId: string;
  orderIndex?: number;
  content: string;
  penaltyPoints: number;
  unlockDelayMinutes: number;
}): Promise<{
  success: boolean;
  error?: string;
  hint?: HintActionResult;
  hints?: HintActionResult[];
}> {
  try {
    await requireOrganizer();

    if (data.id && !isValidEntityId(data.id)) {
      return { success: false, error: "Invalid hint identifier." };
    }
    if (!isValidEntityId(data.puzzleId)) {
      return { success: false, error: "Invalid puzzle identifier." };
    }

    const trimmedContent = stripDangerousChars(data.content || "").trim();
    if (!trimmedContent || trimmedContent.length < 2 || trimmedContent.length > 2000) {
      return { success: false, error: "Hint content must be between 2 and 2,000 characters." };
    }

    const penaltyPoints = Math.floor(Number(data.penaltyPoints));
    if (!Number.isSafeInteger(penaltyPoints) || penaltyPoints < 0 || penaltyPoints > 5000) {
      return { success: false, error: "Penalty points must be an integer between 0 and 5,000." };
    }

    const unlockDelayMinutes = Math.floor(Number(data.unlockDelayMinutes));
    if (!Number.isSafeInteger(unlockDelayMinutes) || unlockDelayMinutes < 0 || unlockDelayMinutes > 1440) {
      return { success: false, error: "Unlock delay must be an integer between 0 and 1,440 minutes." };
    }

    const puzzle = await prisma.puzzle.findUnique({
      where: { id: data.puzzleId },
      select: { id: true },
    });
    if (!puzzle) {
      return { success: false, error: "Target puzzle not found." };
    }

    let savedHint: HintActionResult;

    if (data.id) {
      // Update existing hint
      savedHint = await prisma.hint.update({
        where: { id: data.id },
        data: {
          ...(data.orderIndex ? { orderIndex: Math.max(1, Math.floor(data.orderIndex)) } : {}),
          content: trimmedContent,
          penaltyPoints,
          unlockDelayMinutes,
        },
        select: {
          id: true,
          orderIndex: true,
          content: true,
          penaltyPoints: true,
          unlockDelayMinutes: true,
        },
      });
    } else {
      // Create new hint with atomic orderIndex calculation inside transaction
      savedHint = await prisma.$transaction(async (tx) => {
        const lastHint = await tx.hint.findFirst({
          where: { puzzleId: data.puzzleId },
          orderBy: { orderIndex: "desc" },
          select: { orderIndex: true },
        });
        const nextOrder = (lastHint?.orderIndex ?? 0) + 1;

        return await tx.hint.create({
          data: {
            puzzleId: data.puzzleId,
            orderIndex: nextOrder,
            content: trimmedContent,
            penaltyPoints,
            unlockDelayMinutes,
          },
          select: {
            id: true,
            orderIndex: true,
            content: true,
            penaltyPoints: true,
            unlockDelayMinutes: true,
          },
        });
      });
    }

    // Fetch the complete ordered hints for the puzzle to ensure client is in 100% sync
    const allHints = await prisma.hint.findMany({
      where: { puzzleId: data.puzzleId },
      orderBy: { orderIndex: "asc" },
      select: {
        id: true,
        orderIndex: true,
        content: true,
        penaltyPoints: true,
        unlockDelayMinutes: true,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/hunt");
    revalidatePath("/dashboard");
    revalidatePath("/leaderboard");

    return {
      success: true,
      hint: savedHint,
      hints: allHints,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save hint.";
    return { success: false, error: msg };
  }
}

/**
 * Deletes a hint and renumbers remaining hints for the puzzle safely.
 * Safeguards against accidental point refunds if teams already unlocked it.
 */
export async function deleteHintAction(
  hintId: string,
  options?: { force?: boolean }
): Promise<{
  success: boolean;
  error?: string;
  hints?: HintActionResult[];
}> {
  try {
    await requireOrganizer();

    if (!isValidEntityId(hintId)) {
      return { success: false, error: "Invalid hint identifier." };
    }

    const hint = await prisma.hint.findUnique({
      where: { id: hintId },
      include: {
        _count: { select: { teamUnlocks: true } },
      },
    });
    if (!hint) {
      return { success: false, error: "Hint not found." };
    }

    // Safety guard: if teams already paid points to unlock this hint during live competition
    if (hint._count.teamUnlocks > 0 && !options?.force) {
      return {
        success: false,
        error: `Cannot delete: ${hint._count.teamUnlocks} team(s) have unlocked this hint. Deleting it will retroactively clear their point deductions! Confirm force delete if intentional.`,
      };
    }

    const remainingHints = await prisma.$transaction(async (tx) => {
      // 1. Delete the target hint (cascading unlocks if forced)
      await tx.hint.delete({
        where: { id: hintId },
      });

      // 2. Fetch remaining hints ordered by current orderIndex
      const remaining = await tx.hint.findMany({
        where: { puzzleId: hint.puzzleId },
        orderBy: { orderIndex: "asc" },
      });

      // 3. Renumber safely using a 2-pass update to avoid @@unique([puzzleId, orderIndex]) collisions
      // Pass 1: Shift to negative temporary indices
      for (let i = 0; i < remaining.length; i++) {
        await tx.hint.update({
          where: { id: remaining[i].id },
          data: { orderIndex: -(i + 1) },
        });
      }

      // Pass 2: Set clean continuous 1..N order
      for (let i = 0; i < remaining.length; i++) {
        await tx.hint.update({
          where: { id: remaining[i].id },
          data: { orderIndex: i + 1 },
        });
      }

      return await tx.hint.findMany({
        where: { puzzleId: hint.puzzleId },
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          orderIndex: true,
          content: true,
          penaltyPoints: true,
          unlockDelayMinutes: true,
        },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/hunt");
    revalidatePath("/dashboard");
    revalidatePath("/leaderboard");

    return { success: true, hints: remainingHints };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete hint.";
    return { success: false, error: msg };
  }
}

/**
 * Organizers respond to a support desk ticket.
 */
export async function replyToSupportTicketAction(
  ticketId: string,
  adminReply: string,
  status: "RESOLVED" | "DISMISSED" = "RESOLVED"
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrganizer();

    if (!isValidEntityId(ticketId)) {
      return { success: false, error: "Invalid ticket identifier." };
    }

    const cleanReply = stripDangerousChars(adminReply || "").trim();
    if (!cleanReply) {
      return { success: false, error: "Admin reply cannot be empty." };
    }
    if (cleanReply.length > 2000) {
      return { success: false, error: "Admin reply cannot exceed 2000 characters." };
    }

    const VALID_STATUSES = ["RESOLVED", "DISMISSED"] as const;
    const cleanStatus = VALID_STATUSES.includes(status) ? status : "RESOLVED";

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        adminReply: cleanReply,
        status: cleanStatus,
      },
    });

    revalidatePath("/admin/tickets");
    revalidatePath("/hunt");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reply to ticket.";
    return { success: false, error: msg };
  }
}

/**
 * Organizers manually award bonus points or impose penalties on a team with a mandatory reason.
 */
export async function adjustTeamScoreAction(data: {
  teamId: string;
  amount: number;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireOrganizer();

    if (!data || typeof data !== "object") {
      return { success: false, error: "Invalid adjustment payload." };
    }

    if (!isValidEntityId(data.teamId)) {
      return { success: false, error: "Please select a valid team." };
    }

    const amount = Math.trunc(Number(data.amount));
    if (!Number.isSafeInteger(amount) || amount === 0) {
      return { success: false, error: "Amount must be a non-zero integer." };
    }
    if (Math.abs(amount) > 100000) {
      return { success: false, error: "Amount must be between -100,000 and 100,000 points." };
    }

    const reason = stripDangerousChars(data.reason || "").trim();
    if (reason.length < 3) {
      return { success: false, error: "A mandatory reason (at least 3 characters) is required for all adjustments." };
    }
    if (reason.length > 500) {
      return { success: false, error: "Reason cannot exceed 500 characters." };
    }

    const team = await prisma.team.findUnique({ where: { id: data.teamId } });
    if (!team) {
      return { success: false, error: "Selected team was not found." };
    }

    await prisma.scoreAdjustment.create({
      data: {
        teamId: data.teamId,
        amount,
        reason,
        createdById: user.id,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    revalidatePath("/hunt");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to adjust team score.";
    return { success: false, error: msg };
  }
}

/**
 * Revokes / deletes a previously applied score adjustment.
 */
export async function deleteScoreAdjustmentAction(
  adjustmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrganizer();

    if (!isValidEntityId(adjustmentId)) {
      return { success: false, error: "Invalid adjustment identifier." };
    }

    await prisma.scoreAdjustment.delete({
      where: { id: adjustmentId },
    });

    revalidatePath("/admin");
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    revalidatePath("/hunt");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete score adjustment.";
    return { success: false, error: msg };
  }
}

/**
 * Updates admin visibility toggles for the leaderboard and hunt platform:
 * showQuestionsSolved, showPointHistory, hideTeamNames, and supportFeatureEnabled.
 */
export async function updateLeaderboardDisplaySettingsAction(data: {
  showQuestionsSolved?: boolean;
  showPointHistory?: boolean;
  hideTeamNames?: boolean;
  supportFeatureEnabled?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrganizer();

    if (!data || typeof data !== "object") {
      return { success: false, error: "Invalid settings payload." };
    }

    const updateData: {
      showQuestionsSolved?: boolean;
      showPointHistory?: boolean;
      hideTeamNames?: boolean;
      supportFeatureEnabled?: boolean;
    } = {};

    if (typeof data.showQuestionsSolved === "boolean") {
      updateData.showQuestionsSolved = data.showQuestionsSolved;
    }
    if (typeof data.showPointHistory === "boolean") {
      updateData.showPointHistory = data.showPointHistory;
    }
    if (typeof data.hideTeamNames === "boolean") {
      updateData.hideTeamNames = data.hideTeamNames;
    }
    if (typeof data.supportFeatureEnabled === "boolean") {
      updateData.supportFeatureEnabled = data.supportFeatureEnabled;
    }

    await prisma.systemConfig.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        ...updateData,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/leaderboard");
    revalidatePath("/hunt");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update display settings.";
    return { success: false, error: msg };
  }
}

export const updateDisplaySettingsAction = updateLeaderboardDisplaySettingsAction;

