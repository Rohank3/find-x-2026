"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeTeamName, isValidEntityId } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getEffectiveSystemConfig } from "@/lib/competition";

export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Creates a new team.
 * The creator's batchTier becomes the team's batchTier, strictly prohibiting cross-batch mixing.
 */
export async function createTeamAction(teamName: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const teamCheck = sanitizeTeamName(teamName);
    if (!teamCheck.valid) {
      return { success: false, error: teamCheck.error || "Invalid team name." };
    }
    const trimmedName = teamCheck.name;

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user) return { success: false, error: "User not found." };
    if (user.teamId) return { success: false, error: "You are already a member of a team." };

    const config = await getEffectiveSystemConfig().catch(() => null);
    if (config?.competitionState === "ENDED") {
      return { success: false, error: "Roster modifications are closed. The competition has concluded." };
    }

    // Create team and assign user in an atomic transaction.
    // Serializable isolation (same as join acceptance) makes concurrent
    // creations with the same name safe; the unique constraint is the final
    // backstop and is translated to a friendly message below.
    const newTeam = await prisma.$transaction(
      async (tx) => {
        // Check if team name is taken
        const existing = await tx.team.findUnique({ where: { name: trimmedName } });
        if (existing) throw new Error("A team with this name already exists.");

      // Create team
      const team = await tx.team.create({
        data: {
          name: trimmedName,
          batchTier: user.batchTier,
          isFrozen: false,
        },
      });

      // Assign user to team
      await tx.user.update({
        where: { id: userId },
        data: { teamId: team.id },
      });

        // Purge any pending join requests this user had sent out
        await tx.joinRequest.deleteMany({
          where: { userId },
        });

        return team;
      },
      {
        isolationLevel: "Serializable",
      }
    );

    revalidatePath("/dashboard");
    return { success: true, data: newTeam };
  } catch (err: unknown) {
    // Translate the unique-constraint violation from a concurrent creation
    // into the same friendly message the pre-check produces.
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return { success: false, error: "A team with this name already exists." };
    }
    const message = err instanceof Error ? err.message : "Failed to create team.";
    return { success: false, error: message };
  }
}

/**
 * Broadcasts a join request to a team.
 * Users can broadcast requests to multiple teams simultaneously.
 * Strictly enforces zero cross-batch mixing (Freshers cannot join Senior teams, and vice versa).
 */
export async function sendJoinRequestAction(teamId: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized." };

    if (!isValidEntityId(teamId)) {
      return { success: false, error: "Invalid team identifier." };
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "User not found." };
    if (user.teamId) return { success: false, error: "You are already in a team." };

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) return { success: false, error: "Team not found." };

    const config = await getEffectiveSystemConfig().catch(() => null);
    if (config?.competitionState === "ENDED") {
      return { success: false, error: "Team recruitment is closed. The competition has concluded." };
    }

    if (team.isFrozen) return { success: false, error: "Team is permanently frozen (solved Q1)." };
    if (team.members.length >= 3) return { success: false, error: "Team is already full (max 3 members)." };

    // Zero cross-batch mixing enforcement
    if (user.batchTier !== team.batchTier) {
      const targetBatch = team.batchTier === "FIRST_YEAR" ? "1st-Year (2026)" : "Senior (2023-2025)";
      return {
        success: false,
        error: `Cross-batch mixing is prohibited. This team is reserved for ${targetBatch} students.`,
      };
    }

    // Check for existing pending request
    const existingReq = await prisma.joinRequest.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (existingReq) return { success: false, error: "You already have a pending request to this team." };

    await prisma.joinRequest.create({
      data: {
        teamId,
        userId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send join request.";
    return { success: false, error: message };
  }
}

/**
 * Atomic Acceptance of an incoming join request.
 * Any member of the team can accept.
 * Atomically confirms the candidate, purges all candidate's requests to other teams,
 * and aborts gracefully if the team reached 3 members or is frozen.
 */
export async function acceptJoinRequestAction(requestId: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized." };

    if (!isValidEntityId(requestId)) {
      return { success: false, error: "Invalid request identifier." };
    }

    const approverId = session.user.id;
    const approver = await prisma.user.findUnique({ where: { id: approverId } });
    if (!approver || !approver.teamId) {
      return { success: false, error: "You must be part of the team to accept requests." };
    }

    const teamId = approver.teamId;

    const config = await getEffectiveSystemConfig().catch(() => null);
    if (config?.competitionState === "ENDED") {
      return { success: false, error: "Roster modifications are closed. The competition has concluded." };
    }

    await prisma.$transaction(
      async (tx) => {
        // 1. Fetch and lock team
        const team = await tx.team.findUnique({
          where: { id: teamId },
          include: { members: true },
        });
        if (!team) throw new Error("Team not found.");
        if (team.isFrozen) throw new Error("Team is permanently frozen (solved Q1).");
        if (team.members.length >= 3) throw new Error("Team is already at maximum capacity (3 members).");

        // 2. Fetch request
        const request = await tx.joinRequest.findUnique({
          where: { id: requestId },
          include: { user: true },
        });
        if (!request || request.teamId !== teamId) {
          throw new Error("Join request no longer exists or belongs to another team.");
        }

        const candidate = request.user;
        if (candidate.teamId) {
          // Candidate already joined another team in the meantime
          await tx.joinRequest.delete({ where: { id: requestId } });
          throw new Error(`${candidate.name || "Candidate"} has already joined another team.`);
        }

        // Strict batch tier check
        if (candidate.batchTier !== team.batchTier) {
          throw new Error("Cross-batch mixing is prohibited.");
        }

        // 3. Assign candidate to team
        await tx.user.update({
          where: { id: candidate.id },
          data: { teamId: team.id },
        });

        // 4. Atomically purge ALL pending requests sent by this candidate to ANY team
        await tx.joinRequest.deleteMany({
          where: { userId: candidate.id },
        });
      },
      {
        // Serializable isolation ensures race-free concurrent approvals
        isolationLevel: "Serializable",
      }
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to accept request.";
    return { success: false, error: message };
  }
}

/**
 * Rejects an incoming join request.
 * Any team member can reject.
 */
export async function rejectJoinRequestAction(requestId: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized." };

    if (!isValidEntityId(requestId)) {
      return { success: false, error: "Invalid request identifier." };
    }

    const approver = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!approver || !approver.teamId) {
      return { success: false, error: "Unauthorized." };
    }

    const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
    if (!request || request.teamId !== approver.teamId) {
      return { success: false, error: "Request not found." };
    }

    await prisma.joinRequest.delete({ where: { id: requestId } });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reject request.";
    return { success: false, error: message };
  }
}

/**
 * Cancels a pending join request sent by the current user.
 */
export async function cancelJoinRequestAction(requestId: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized." };

    if (!isValidEntityId(requestId)) {
      return { success: false, error: "Invalid request identifier." };
    }

    const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
    if (!request || request.userId !== session.user.id) {
      return { success: false, error: "Request not found or unauthorized." };
    }

    await prisma.joinRequest.delete({ where: { id: requestId } });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel request.";
    return { success: false, error: message };
  }
}

/**
 * Voluntary Leave Feature (Strictly NO kick option).
 * Any member can voluntarily leave provided the team has not solved Question 1 (isFrozen === false).
 * If the team member count reaches 0, the team is disbanded/deleted.
 */
export async function voluntaryLeaveTeamAction(): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized." };

    const userId = session.user.id;

    const config = await getEffectiveSystemConfig().catch(() => null);
    if (config?.competitionState === "ENDED") {
      return { success: false, error: "Roster modifications are closed. The competition has concluded." };
    }

    // Serializable transaction: the roster-freeze check and the member detach
    // must be atomic. Previously the isFrozen read happened outside the tx, so
    // a teammate solving Q1 concurrently could freeze the roster while this
    // member detached — violating the "roster permanently locks post-Q1"
    // invariant (same race class as acceptJoinRequestAction below).
    await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { teamId: true, team: { select: { isFrozen: true } } },
        });

        if (!user || !user.teamId || !user.team) {
          throw new Error("You are not currently in any team.");
        }

        // Invariant: Cannot leave once team has solved Q1
        if (user.team.isFrozen) {
          throw new Error(
            "Roster is permanently frozen! You cannot leave after Question 1 has been solved."
          );
        }

        // Detach user from team
        await tx.user.update({
          where: { id: userId },
          data: { teamId: null },
        });

        // If no members remain, disband team
        const remainingCount = await tx.user.count({
          where: { teamId: user.teamId },
        });

        if (remainingCount === 0) {
          await tx.team.delete({
            where: { id: user.teamId },
          });
        }

      },
      {
        isolationLevel: "Serializable",
      }
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to leave team.";
    return { success: false, error: message };
  }
}
