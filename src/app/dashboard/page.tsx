import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveSystemConfig } from "@/lib/competition";
import DashboardClient from "./DashboardClient";
import {
  getTeamDashboardData,
  getAvailableTeams,
  getUserOutgoingJoinRequests,
} from "@/lib/dashboardCache";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [session, config] = await Promise.all([
    getCachedSession(),
    getEffectiveSystemConfig().catch(() => null),
  ]);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const hintsEnabled = config?.hintsEnabled ?? false;
  const userId = session.user.id;
  const initialTeamId = session.user.teamId ?? null;

  // =========================================================================
  // FAST PATH: User session already carries teamId
  // Resolves directly from memory/Redis/single consolidated join query
  // =========================================================================
  if (initialTeamId) {
    const teamData = await getTeamDashboardData(initialTeamId);
    const isMember = teamData?.team.members.some((m) => m.id === userId);

    if (teamData && isMember) {
      const userWithTeam = {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? session.user.email?.split("@")[0] ?? "Pirate",
        branch: session.user.branch,
        batchYear: session.user.batchYear,
        rollNumber: session.user.rollNumber,
        batchTier: session.user.batchTier,
        isFirstYear: session.user.isFirstYear,
        teamId: initialTeamId,
        team: teamData.team,
        joinRequests: [],
      };

      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
          <DashboardClient
            user={userWithTeam}
            availableTeams={[]}
            pointHistory={teamData.pointHistory}
            scoreSummary={teamData.scoreSummary}
            hintsEnabled={hintsEnabled}
          />
        </div>
      );
    }
  }

  // =========================================================================
  // PARALLEL RECRUITMENT PATH: User session had no teamId (or team was disbanded)
  // Concurrently resolve DB user check, cached join requests, and batch-tier open teams
  // in a single round-trip instead of cascading waterfalls.
  // =========================================================================
  const [dbUser, userJoinRequests, openTeams] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    }),
    getUserOutgoingJoinRequests(userId),
    getAvailableTeams(session.user.batchTier || "SENIOR"),
  ]);

  if (dbUser?.teamId) {
    const teamData = await getTeamDashboardData(dbUser.teamId);
    const isMember = teamData?.team.members.some((m) => m.id === userId);
    if (teamData && isMember) {
      const userWithTeam = {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? session.user.email?.split("@")[0] ?? "Pirate",
        branch: session.user.branch,
        batchYear: session.user.batchYear,
        rollNumber: session.user.rollNumber,
        batchTier: session.user.batchTier,
        isFirstYear: session.user.isFirstYear,
        teamId: dbUser.teamId,
        team: teamData.team,
        joinRequests: [],
      };

      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
          <DashboardClient
            user={userWithTeam}
            availableTeams={[]}
            pointHistory={teamData.pointHistory}
            scoreSummary={teamData.scoreSummary}
            hintsEnabled={hintsEnabled}
          />
        </div>
      );
    }
  }

  const requestedMap = new Map(userJoinRequests.map((r) => [r.teamId, r.id]));

  const availableTeams = openTeams
    .filter((t) => t._count.members < 3)
    .map((t) => ({
      id: t.id,
      name: t.name,
      batchTier: t.batchTier,
      isFrozen: t.isFrozen,
      memberCount: t._count.members,
      hasRequested: requestedMap.has(t.id),
      requestId: requestedMap.get(t.id),
    }));

  const userWithTeam = {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? session.user.email?.split("@")[0] ?? "Pirate",
    branch: session.user.branch,
    batchYear: session.user.batchYear,
    rollNumber: session.user.rollNumber,
    batchTier: session.user.batchTier,
    isFirstYear: session.user.isFirstYear,
    teamId: null,
    team: null,
    joinRequests: userJoinRequests,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <DashboardClient
        user={userWithTeam}
        availableTeams={availableTeams}
        pointHistory={[]}
        scoreSummary={{
          score: 0,
          totalGained: 0,
          totalPenalties: 0,
          totalAdjustments: 0,
        }}
        hintsEnabled={hintsEnabled}
      />
    </div>
  );
}
