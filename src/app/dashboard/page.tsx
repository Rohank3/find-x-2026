import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveSystemConfig } from "@/lib/competition";
import { formatStudentBranch } from "@/lib/email";
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

  const userId = session.user.id;
  const hintsEnabled = config?.hintsEnabled ?? false;

  // Resolve user's actual database teamId to eliminate stale session/JWT desync
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { teamId: true },
  });

  const currentTeamId = dbUser?.teamId ?? null;

  if (currentTeamId) {
    const teamData = await getTeamDashboardData(currentTeamId);
    const isMember = teamData?.team.members.some((m) => m.id === userId);

    if (teamData && isMember) {
      const userWithTeam = {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? session.user.email?.split("@")[0] ?? "Pirate",
        branch: formatStudentBranch(session.user.branch, session.user.email),
        batchYear: session.user.batchYear,
        rollNumber: session.user.rollNumber,
        batchTier: session.user.batchTier,
        isFirstYear: session.user.isFirstYear,
        teamId: currentTeamId,
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

  // User is not in any active team: fetch join requests and open recruitment teams concurrently
  const [userJoinRequests, openTeams] = await Promise.all([
    getUserOutgoingJoinRequests(userId),
    getAvailableTeams(session.user.batchTier || "SENIOR"),
  ]);

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
    branch: formatStudentBranch(session.user.branch, session.user.email),
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
