"use server";

import { prisma } from "@/lib/prisma";
import { getEffectiveSystemConfig } from "@/lib/competition";
import type { CompetitionState } from "@prisma/client";

/**
 * Server Action for client components (e.g. Chronometer) to synchronize
 * competition state transitions without bundling server modules into the client.
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
