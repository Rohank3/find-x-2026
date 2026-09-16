import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveLockouts } from "@/lib/lockout";
import { getActiveAnnouncements } from "@/lib/announcements";
import AdminClient from "./AdminClient";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ORGANIZER") {
    redirect("/dashboard");
  }

  // Fetch all admin data concurrently to eliminate sequential network latency
  const [
    config,
    announcements,
    activeLockouts,
    puzzles,
    tickets,
    teams,
    scoreAdjustments,
  ] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { id: "default" } }),
    getActiveAnnouncements(),
    getActiveLockouts(),
    prisma.puzzle.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        hints: { orderBy: { orderIndex: "asc" } },
        _count: { select: { submissions: true } },
      },
    }),
    prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        team: { select: { name: true } },
        user: { select: { name: true, email: true } },
        puzzle: { select: { orderIndex: true, title: true } },
      },
    }),
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        batchTier: true,
        createdAt: true,
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            branch: true,
            batchYear: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.scoreAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        team: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const teamNameMap: Record<string, string> = {};
  teams.forEach((t) => (teamNameMap[t.id] = t.name));
  // Submissions are served to the client through getSubmissionsPageAction
  // (server-side pagination + DB-level search) instead of shipping every row
  // of every team on each admin visit.

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      <AdminClient
        config={config}
        activeLockouts={activeLockouts}
        puzzles={puzzles}
        tickets={tickets}
        teamNameMap={teamNameMap}
        teams={teams}
        scoreAdjustments={scoreAdjustments}
        announcements={announcements.map((a) => ({
          id: a.id,
          message: a.message,
          retentionDays: a.retentionDays,
          createdAt: a.createdAt.toISOString(),
          expiresAt: a.expiresAt.toISOString(),
        }))}
      />
    </div>
  );
}
