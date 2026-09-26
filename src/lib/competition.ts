"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { CompetitionState } from "@prisma/client";

/**
 * Returns the active SystemConfig, automatically transitioning
 * competitionState (UPCOMING -> LIVE -> FROZEN -> ENDED) according to the
 * scheduled startTime, freezeTime, and endTime without requiring manual admin login.
 */
export async function getEffectiveSystemConfig() {
  let config = await prisma.systemConfig.findUnique({
    where: { id: "default" },
  });

  if (!config) {
    config = await prisma.systemConfig.create({
      data: {
        id: "default",
        competitionState: "UPCOMING",
      },
    });
  }

  const now = new Date();
  let targetState: CompetitionState = config.competitionState;

  // Automated transition sequence:
  // 1. ENDED: If endTime configured and now >= endTime
  if (config.endTime && now >= config.endTime) {
    if (config.competitionState !== "ENDED") {
      targetState = "ENDED";
    }
  }
  // 2. FROZEN: If freezeTime configured and now >= freezeTime (and before endTime)
  else if (config.freezeTime && now >= config.freezeTime) {
    if (config.competitionState !== "FROZEN" && config.competitionState !== "ENDED") {
      targetState = "FROZEN";
    }
  }
  // 3. LIVE: If startTime configured and now >= startTime (and before freezeTime / endTime)
  else if (config.startTime && now >= config.startTime) {
    if (config.competitionState === "UPCOMING") {
      targetState = "LIVE";
    }
  }

  // If a transition is warranted, persist atomically to database and revalidate caches
  if (targetState !== config.competitionState) {
    const updated = await prisma.systemConfig.update({
      where: { id: "default" },
      data: {
        competitionState: targetState,
        // If transitioning to FROZEN without an explicit freezeTime, preserve now
        ...(targetState === "FROZEN" && !config.freezeTime ? { freezeTime: now } : {}),
      },
    });

    try {
      revalidatePath("/");
      revalidatePath("/hunt");
      revalidatePath("/leaderboard");
      revalidatePath("/dashboard");
      revalidatePath("/admin");
    } catch {
      // revalidatePath may throw in non-request contexts
    }

    return updated;
  }

  return config;
}

/**
 * Server action callable by client components (e.g. Chronometer on countdown zero)
 * to verify and execute automated state transitions immediately.
 */
export async function syncCompetitionStateAction(): Promise<{
  competitionState: CompetitionState;
  startTime: string | null;
  freezeTime: string | null;
  endTime: string | null;
  transitioned: boolean;
}> {
  const previous = await prisma.systemConfig.findUnique({
    where: { id: "default" },
  });

  const effective = await getEffectiveSystemConfig();

  return {
    competitionState: effective.competitionState,
    startTime: effective.startTime?.toISOString() ?? null,
    freezeTime: effective.freezeTime?.toISOString() ?? null,
    endTime: effective.endTime?.toISOString() ?? null,
    transitioned: previous?.competitionState !== effective.competitionState,
  };
}
