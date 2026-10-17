import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveSystemConfig } from "@/lib/competition";
import { buildExpeditionLadder } from "@/lib/hunt/realmsRegistry";
import { getFastPuzzleCatalog } from "@/lib/hunt/catalog";
import HuntClient from "./HuntClient";

export default async function HuntPage() {
  const session = await getCachedSession();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;
  let sessionTeamId = session.user.teamId;

  // If user session does not have a teamId yet, do a quick single-field lookup
  if (!sessionTeamId) {
    const freshUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });
    sessionTeamId = freshUser?.teamId ?? null;
  }

  if (!sessionTeamId) {
    redirect("/dashboard");
  }

  // Fast 3-way parallel fetch: System config (in-memory TTL 15s),
  // puzzle catalog (in-memory TTL 60s), and a SINGLE consolidated team query
  // that fetches team metadata, all submissions, and hint unlocks in one round trip.
  const [config, catalogPuzzles, teamData] = await Promise.all([
    getEffectiveSystemConfig(),
    getFastPuzzleCatalog(),
    prisma.team.findUnique({
      where: { id: sessionTeamId },
      select: {
        id: true,
        name: true,
        isFrozen: true,
        createdAt: true,
        submissions: {
          select: { id: true, puzzleId: true, isCorrect: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
        hintUnlocks: {
          select: {
            id: true,
            hintId: true,
            unlockedBy: { select: { name: true, email: true } },
          },
        },
      },
    }),
  ]);

  if (!teamData) {
    redirect("/dashboard");
  }

  // Split submissions into correct and wrong in-memory (0ms cost, 0 extra DB roundtrips)
  const correctSubmissions = teamData.submissions.filter((s) => s.isCorrect);
  const wrongSubmissions = teamData.submissions.filter((s) => !s.isCorrect);
  const teamUnlocks = teamData.hintUnlocks;

  const team = {
    id: teamData.id,
    name: teamData.name,
    isFrozen: teamData.isFrozen,
    createdAt: teamData.createdAt,
    submissions: correctSubmissions,
  };

  const isUpcoming = (config?.competitionState ?? "UPCOMING") === "UPCOMING";
  const hintsEnabled = config?.hintsEnabled ?? false;

  if (isUpcoming) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <HuntClient
          team={team}
          puzzles={[]}
          activeOrderIndex={1}
          competitionState="UPCOMING"
          startTime={config?.startTime ? config.startTime.toISOString() : null}
          supportFeatureEnabled={config?.supportFeatureEnabled ?? true}
          hintsEnabled={hintsEnabled}
        />
      </div>
    );
  }

  const teamUnlocksByHintId = new Map(teamUnlocks.map((u) => [u.hintId, u]));
  const wrongAttemptsCountByPuzzleId = new Map<string, number>();
  for (const s of wrongSubmissions) {
    wrongAttemptsCountByPuzzleId.set(s.puzzleId, (wrongAttemptsCountByPuzzleId.get(s.puzzleId) || 0) + 1);
  }

  const allPuzzles = catalogPuzzles;

  // Set of solved puzzle IDs for this team
  const solvedPuzzleIds = new Set(team.submissions.map((s) => s.puzzleId));

  // Find the first unsolved puzzle in ascending orderIndex
  const firstUnsolvedPuzzle = allPuzzles.find((p) => !solvedPuzzleIds.has(p.id));
  const activeOrderIndex = firstUnsolvedPuzzle
    ? firstUnsolvedPuzzle.orderIndex
    : allPuzzles[allPuzzles.length - 1]?.orderIndex ?? 1;

  // Build active expedition ladder mapping based on curated system config
  const expeditionLadder = buildExpeditionLadder(config?.activeWaypointKeys);

  // Sanitize puzzle data sent to client: NEVER leak accepted answers or locked puzzles!
  const sanitizedPuzzles = allPuzzles.map((p) => {
    const isSolved = solvedPuzzleIds.has(p.id);

    // A puzzle is unlocked if all preceding puzzles (lower orderIndex) are solved
    const allPrecedingSolved = allPuzzles
      .filter((other) => other.orderIndex < p.orderIndex)
      .every((other) => solvedPuzzleIds.has(other.id));

    // A puzzle is active if it's the first unsolved puzzle in the ladder.
    // When all puzzles are solved, no puzzle is actively unsolved.
    const isActive = firstUnsolvedPuzzle ? p.id === firstUnsolvedPuzzle.id : false;
    // A puzzle is locked if it's neither solved nor are all preceding puzzles solved
    const isLocked = !isSolved && !allPrecedingSolved;

    // Calculate team puzzle access time on the server for timed hints
    let puzzleAccessTime: Date;
    if (p.orderIndex > 1) {
      const prevPuzzle = allPuzzles.find((x) => x.orderIndex === p.orderIndex - 1);
      const prevSolve = team.submissions.find((s) => s.puzzleId === prevPuzzle?.id);
      puzzleAccessTime = prevSolve?.createdAt ?? config?.startTime ?? p.createdAt;
    } else {
      const compStart = config?.startTime;
      puzzleAccessTime = compStart && compStart > team.createdAt ? compStart : team.createdAt;
    }

    const ladderItem = expeditionLadder.find((item) => item.orderIndex === p.orderIndex);

    // Normalize multiple evidence assets (fallback gracefully to legacy assetUrl)
    const normalizedAssets = isLocked
      ? []
      : (p.assets && p.assets.length > 0
          ? p.assets.map((a) => ({
              id: a.id,
              title: a.title,
              url: a.url,
              type: a.type,
            }))
          : (p.assetUrl
              ? [{ id: `legacy-${p.id}`, title: "Primary Evidence", url: p.assetUrl, type: p.assetType || "image" }]
              : []));

    return {
      id: p.id,
      orderIndex: p.orderIndex,
      realmId: ladderItem?.realmId ?? 1,
      realmOrderIndex: ladderItem?.realmOrderIndex ?? p.orderIndex,
      waypointKey: ladderItem?.waypointKey,
      landmarkName: ladderItem?.landmarkName ?? `Checkpoint #${p.orderIndex}`,
      title: isLocked ? `Locked Puzzle #${p.orderIndex}` : p.title,
      description: isLocked ? "Solve earlier puzzles to unlock this challenge." : p.description,
      assetUrl: isLocked ? null : p.assetUrl,
      assetType: isLocked ? null : p.assetType,
      assets: normalizedAssets,
      basePoints: p.basePoints,
      isSolved,
      isActive,
      isLocked,
      hints: isLocked || !hintsEnabled
        ? []
        : p.hints.map((h) => {
            const unlockRecord = teamUnlocksByHintId.get(h.id);
            const isUnlocked = Boolean(unlockRecord);
            const availableAt = h.unlockDelayMinutes > 0
              ? new Date(puzzleAccessTime).getTime() + h.unlockDelayMinutes * 60 * 1000
              : undefined;

            return {
              id: h.id,
              orderIndex: h.orderIndex,
              penaltyPoints: h.penaltyPoints,
              unlockDelayMinutes: h.unlockDelayMinutes,
              isUnlocked,
              availableAt,
              content: isUnlocked ? h.content : undefined, // Never send locked hint content!
              unlockedByName: isUnlocked
                ? (unlockRecord?.unlockedBy?.name || unlockRecord?.unlockedBy?.email?.split("@")[0] || "Crew Member")
                : null,
            };
          }),
      attemptsCount: wrongAttemptsCountByPuzzleId.get(p.id) || 0,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      <HuntClient
        team={team}
        puzzles={sanitizedPuzzles}
        activeOrderIndex={activeOrderIndex}
        competitionState={config?.competitionState || "LIVE"}
        supportFeatureEnabled={config?.supportFeatureEnabled ?? true}
        hintsEnabled={hintsEnabled}
      />
    </div>
  );
}
