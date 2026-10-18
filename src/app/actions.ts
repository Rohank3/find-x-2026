"use server";

import { getEffectiveSystemConfig } from "@/lib/competition";
import type { CompetitionState } from "@prisma/client";

let lastKnownState: CompetitionState | null = null;

/**
 * Server Action for client components (e.g. Chronometer) to synchronize
 * competition state transitions without bundling server modules into the client.
 * Leverages in-memory cached configuration from getEffectiveSystemConfig().
 */
export async function syncCompetitionStateAction(): Promise<{
  competitionState: CompetitionState;
  startTime: string | null;
  freezeTime: string | null;
  endTime: string | null;
  transitioned: boolean;
}> {
  const effective = await getEffectiveSystemConfig();
  const transitioned = lastKnownState !== null && lastKnownState !== effective.competitionState;
  lastKnownState = effective.competitionState;

  return {
    competitionState: effective.competitionState,
    startTime: effective.startTime?.toISOString() ?? null,
    freezeTime: effective.freezeTime?.toISOString() ?? null,
    endTime: effective.endTime?.toISOString() ?? null,
    transitioned,
  };
}
