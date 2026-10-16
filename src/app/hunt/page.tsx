import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getEffectiveSystemConfig } from "@/lib/competition";
import { buildExpeditionLadder } from "@/lib/hunt/realmsRegistry";
import HuntClient from "./HuntClient";

const getCachedPuzzleCatalog = unstable_cache(
  async () => {
    return prisma.puzzle.findMany({
      orderBy: { orderIndex: "asc" },
      select: {
        id: true,
        orderIndex: true,
        title: true,
        description: true,
        assetUrl: true,
        assetType: true,
        basePoints: true,
        createdAt: true,
        hints: {
          select: {
            id: true,
            orderIndex: true,
            penaltyPoints: true,
            unlockDelayMinutes: true,
            content: true,
          },
          orderBy: { orderIndex: "asc" },
        },
        assets: {
          select: {
            id: true,
            orderIndex: true,
            title: true,
            url: true,
            type: true,
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
  },
  ["hunt-puzzle-catalog"],
  { revalidate: 60, tags: ["puzzles"] }
);

type CatalogPuzzles = Awaited<ReturnType<typeof getCachedPuzzleCatalog>>;

interface CatalogCacheEntry {
  timestamp: number;
  data: CatalogPuzzles;
}
let catalogMemCache: CatalogCacheEntry | null = null;
const CATALOG_MEM_TTL_MS = 60000;

async function getFastPuzzleCatalog() {
  if (catalogMemCache && Date.now() - catalogMemCache.timestamp < CATALOG_MEM_TTL_MS) {
    return catalogMemCache.data;
  }
  const data = await getCachedPuzzleCatalog();
  catalogMemCache = { timestamp: Date.now(), data };
  return data;
}

export default async function HuntPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;
  const sessionTeamId = session.user.teamId;

  // Single-stage parallel dispatch:
  // Instead of 2-stage sequential waterfall over TLS, launch user, config,
  // puzzle catalog, and team queries concurrently in a single Promise.all.
  const userPromise = prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, teamId: true },
  });
  const configPromise = getEffectiveSystemConfig();
  const catalogPromise = getFastPuzzleCatalog();

  type TeamRecordResult = { id: string; name: string; isFrozen: boolean; createdAt: Date } | null;
  type CorrectSubmissionsResult = Array<{ id: string; puzzleId: string; createdAt: Date }>;
  type TeamUnlocksResult = Array<{ id: string; hintId: string; unlockedBy: { name: string | null; email: string } | null }>;
  type WrongSubmissionsResult = Array<{ puzzleId: string }>;

  let teamRecordPromise: Promise<TeamRecordResult> = Promise.resolve(null);
  let correctSubmissionsPromise: Promise<CorrectSubmissionsResult> = Promise.resolve([]);
  let teamUnlocksPromise: Promise<TeamUnlocksResult> = Promise.resolve([]);
  let wrongSubmissionsPromise: Promise<WrongSubmissionsResult> = Promise.resolve([]);

  const targetTeamId = sessionTeamId;
  if (targetTeamId) {
    teamRecordPromise = prisma.team.findUnique({
      where: { id: targetTeamId },
      select: { id: true, name: true, isFrozen: true, createdAt: true },
    });
    correctSubmissionsPromise = prisma.submission.findMany({
      where: { teamId: targetTeamId, isCorrect: true },
      select: { id: true, puzzleId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    teamUnlocksPromise = prisma.teamHintUnlock.findMany({
      where: { teamId: targetTeamId },
      include: { unlockedBy: { select: { name: true, email: true } } },
    });
    wrongSubmissionsPromise = prisma.submission.findMany({
      where: { teamId: targetTeamId, isCorrect: false },
      select: { puzzleId: true },
    });
  }

  const [
    user,
    config,
    catalogPuzzles,
    initialTeamRecord,
    initialCorrectSubmissions,
    initialTeamUnlocks,
    initialWrongSubmissions,
  ] = await Promise.all([
    userPromise,
    configPromise,
    catalogPromise,
    teamRecordPromise,
    correctSubmissionsPromise,
    teamUnlocksPromise,
    wrongSubmissionsPromise,
  ]);

  if (!user) redirect("/auth/signin");
  if (!user.teamId) {
    redirect("/dashboard");
  }

  let teamRecord = initialTeamRecord;
  let correctSubmissions = initialCorrectSubmissions;
  let teamUnlocks = initialTeamUnlocks;
  let wrongSubmissions = initialWrongSubmissions;

  // Rare fallback if user's team changed from sessionTeamId
  if (user.teamId !== targetTeamId || !teamRecord) {
    const [freshTeam, freshCorrect, freshUnlocks, freshWrongs] = await Promise.all([
      prisma.team.findUnique({
        where: { id: user.teamId },
        select: { id: true, name: true, isFrozen: true, createdAt: true },
      }),
      prisma.submission.findMany({
        where: { teamId: user.teamId, isCorrect: true },
        select: { id: true, puzzleId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.teamHintUnlock.findMany({
        where: { teamId: user.teamId },
        include: { unlockedBy: { select: { name: true, email: true } } },
      }),
      prisma.submission.findMany({
        where: { teamId: user.teamId, isCorrect: false },
        select: { puzzleId: true },
      }),
    ]);
    if (!freshTeam) redirect("/dashboard");
    teamRecord = freshTeam;
    correctSubmissions = freshCorrect;
    teamUnlocks = freshUnlocks;
    wrongSubmissions = freshWrongs;
  }

  const team = {
    id: teamRecord.id,
    name: teamRecord.name,
    isFrozen: teamRecord.isFrozen,
    createdAt: teamRecord.createdAt,
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

    // A puzzle is active if it's the first unsolved puzzle in the ladder
    const isActive = firstUnsolvedPuzzle ? p.id === firstUnsolvedPuzzle.id : isSolved;
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
