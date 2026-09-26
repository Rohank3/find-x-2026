import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveSystemConfig } from "@/lib/competition";
import HuntClient from "./HuntClient";

export default async function HuntPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;
  const [user, config] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            submissions: {
              where: { isCorrect: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    }),
    getEffectiveSystemConfig(),
  ]);

  if (!user) redirect("/auth/signin");
  if (!user.teamId || !user.team) {
    redirect("/dashboard");
  }

  const team = user.team;
  const isUpcoming = (config?.competitionState ?? "UPCOMING") === "UPCOMING";

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
        />
      </div>
    );
  }

  // Fetch all puzzles with hints and team hint unlocks
  const allPuzzles = await prisma.puzzle.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      hints: {
        orderBy: { orderIndex: "asc" },
        include: {
          teamUnlocks: {
            where: { teamId: team.id },
            include: { unlockedBy: { select: { name: true, email: true } } },
          },
        },
      },
      submissions: {
        where: { teamId: team.id },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Set of solved puzzle IDs for this team
  const solvedPuzzleIds = new Set(team.submissions.map((s) => s.puzzleId));

  // Find the first unsolved puzzle in ascending orderIndex
  const firstUnsolvedPuzzle = allPuzzles.find((p) => !solvedPuzzleIds.has(p.id));
  const activeOrderIndex = firstUnsolvedPuzzle
    ? firstUnsolvedPuzzle.orderIndex
    : allPuzzles[allPuzzles.length - 1]?.orderIndex ?? 1;

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

    return {
      id: p.id,
      orderIndex: p.orderIndex,
      title: isLocked ? `Locked Puzzle #${p.orderIndex}` : p.title,
      description: isLocked ? "Solve earlier puzzles to unlock this challenge." : p.description,
      assetUrl: isLocked ? null : p.assetUrl,
      assetType: isLocked ? null : p.assetType,
      basePoints: p.basePoints,
      isSolved,
      isActive,
      isLocked,
      hints: isLocked
        ? []
        : p.hints.map((h) => {
            const unlockRecord = h.teamUnlocks[0];
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
      attemptsCount: p.submissions.filter((s) => !s.isCorrect).length,
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
      />
    </div>
  );
}
