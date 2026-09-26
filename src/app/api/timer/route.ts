import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCompetitionScheduleAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

/**
 * GET /api/timer
 * Returns the current competition timer status, configured launch & end times,
 * active countdown target, countdown label, and server timestamp.
 */
export async function GET() {
  try {
    const config = await prisma.systemConfig.findFirst();
    const competitionState = config?.competitionState || "UPCOMING";
    const startTime = config?.startTime ? config.startTime.toISOString() : null;
    const endTime = config?.endTime ? config.endTime.toISOString() : null;

    let countdownTarget: string | null = null;
    let countdownLabel = "The Hunt Begins In";
    let isEnded = false;

    if (competitionState === "UPCOMING") {
      countdownTarget = startTime;
      countdownLabel = "The Hunt Begins In";
    } else if (competitionState === "LIVE" || competitionState === "FROZEN") {
      countdownTarget = endTime;
      countdownLabel = "The Hunt Ends In";
    } else if (competitionState === "ENDED") {
      countdownTarget = endTime || startTime;
      countdownLabel = "The Hunt Has Concluded";
      isEnded = true;
    }

    return NextResponse.json({
      success: true,
      competitionState,
      startTime,
      endTime,
      countdownTarget,
      countdownLabel,
      isEnded,
      serverTime: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Failed to fetch timer config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch timer config." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/timer
 * Allows authorized organizers to update the timer schedule via API.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ORGANIZER") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Organizer privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body. Expected an object." },
        { status: 400 }
      );
    }

    const validateDateInput = (val: unknown, fieldName: string): string | null | undefined => {
      if (val === undefined) return undefined;
      if (val === null || val === "") return null;
      if (typeof val !== "string") {
        throw new Error(`Field '${fieldName}' must be an ISO date string or null.`);
      }
      const trimmed = val.trim();
      if (!trimmed) return null;
      const d = new Date(trimmed);
      if (isNaN(d.getTime())) {
        throw new Error(`Field '${fieldName}' contains an invalid date format.`);
      }
      return trimmed;
    };

    let startTime: string | null | undefined;
    let freezeTime: string | null | undefined;
    let endTime: string | null | undefined;

    try {
      startTime = validateDateInput((body as Record<string, unknown>).startTime, "startTime");
      freezeTime = validateDateInput((body as Record<string, unknown>).freezeTime, "freezeTime");
      endTime = validateDateInput((body as Record<string, unknown>).endTime, "endTime");
    } catch (valErr) {
      return NextResponse.json(
        { success: false, error: valErr instanceof Error ? valErr.message : "Validation error." },
        { status: 400 }
      );
    }

    const result = await updateCompetitionScheduleAction({
      startTime,
      freezeTime,
      endTime,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      startTime: result.startTime,
      endTime: result.endTime,
      message: "Timer schedule updated successfully.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update timer.";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export const PUT = POST;
