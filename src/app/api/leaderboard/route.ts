import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeaderboardData } from "@/lib/scoring";

const VALID_TIERS = ["FIRST_YEAR", "SENIOR"] as const;

/**
 * FNV-1a over contest display/freeze state and every entry's id, score, and
 * lastSolveTime so ANY rank change or organizer state toggle immediately
 * invalidates the client ETag.
 */
function computeLeaderboardEtag(
  entries: Array<{ teamId: string; score: number; lastSolveTime: Date | string | null }>,
  state?: { isFrozen: boolean; showQuestionsSolved: boolean; showPointHistory: boolean }
): string {
  let hash = 0x811c9dc5;
  const feed = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      hash ^= s.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
  };
  if (state) {
    feed(state.isFrozen ? "frozen" : "unfrozen");
    feed(":");
    feed(state.showQuestionsSolved ? "qs-on" : "qs-off");
    feed(":");
    feed(state.showPointHistory ? "ph-on" : "ph-off");
    feed("|");
  }
  for (const e of entries) {
    feed(e.teamId);
    feed(":");
    feed(String(e.score));
    feed(":");
    feed(e.lastSolveTime ? new Date(e.lastSolveTime).toISOString() : "-");
    feed("|");
  }
  return hash.toString(16);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tierParam = searchParams.get("tier");

  // Reject unknown tiers instead of passing garbage into Prisma (which would
  // throw and surface as an empty leaderboard with HTTP 200).
  let tier: "FIRST_YEAR" | "SENIOR" | undefined;
  if (tierParam) {
    if (!(VALID_TIERS as readonly string[]).includes(tierParam)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be FIRST_YEAR or SENIOR." },
        { status: 400 }
      );
    }
    tier = tierParam as "FIRST_YEAR" | "SENIOR";
  }

  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "ORGANIZER";
    const data = await getLeaderboardData(tier, isAdmin);

    // ETag covers the full ranked ordering and respects admin vs anonymous view scope.
    const viewerScope = isAdmin ? "admin" : (data.hideTeamNames ? "anon" : "public");
    const cacheKey = `leaderboard:${tier || "all"}:${viewerScope}:${computeLeaderboardEtag(data.entries, {
      isFrozen: data.isFrozen,
      showQuestionsSolved: data.showQuestionsSolved,
      showPointHistory: data.showPointHistory,
    })}`;
    const formattedEtag = `"${cacheKey}"`;
    const clientEtag = request.headers.get("if-none-match")?.replace(/^W\//, "").trim();

    if (clientEtag && (clientEtag === formattedEtag || clientEtag === cacheKey || clientEtag === `"${cacheKey}"`)) {
      const notModified = new NextResponse(null, { status: 304 });
      notModified.headers.set("ETag", formattedEtag);
      notModified.headers.set("Vary", "Cookie");
      if (isAdmin) {
        notModified.headers.set("Cache-Control", "private, no-cache, no-store");
      } else {
        notModified.headers.set("Cache-Control", "public, s-maxage=5, stale-while-revalidate=15");
      }
      return notModified;
    }

    const response = NextResponse.json(data);
    response.headers.set("ETag", formattedEtag);
    response.headers.set("Vary", "Cookie");
    if (isAdmin) {
      response.headers.set("Cache-Control", "private, no-cache, no-store");
    } else {
      response.headers.set("Cache-Control", "public, s-maxage=5, stale-while-revalidate=15");
    }

    return response;
  } catch (err: unknown) {
    console.error("[API Leaderboard] Error fetching leaderboard:", err);
    return NextResponse.json({ error: "Failed to fetch leaderboard." }, { status: 500 });
  }
}
