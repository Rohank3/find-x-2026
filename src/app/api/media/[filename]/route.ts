import { NextRequest, NextResponse } from "next/server";
import { stat, readFile } from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEffectiveSystemConfig } from "@/lib/competition";

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  webm: "video/webm",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Strict path traversal defense and canonical evidence filename format
    const VALID_FILENAME_REGEX = /^evidence-[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif|pdf|mp3|wav|ogg|m4a|mp4|webm)$/i;
    if (!filename || !VALID_FILENAME_REGEX.test(filename) || filename.includes("..") || filename.startsWith(".")) {
      return new NextResponse("Invalid file identifier", { status: 400 });
    }

    // 1. Enforce authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized. Sign in required.", { status: 401 });
    }

    const isOrganizer = session.user.role === "ORGANIZER";

    // 2. Progression & competition gate for participants
    if (!isOrganizer) {
      const config = await getEffectiveSystemConfig().catch(() => null);
      const state = config?.competitionState ?? "UPCOMING";
      if (state === "UPCOMING") {
        return new NextResponse("Access forbidden. Competition has not started.", { status: 403 });
      }

      const teamId = session.user.teamId;
      if (!teamId) {
        return new NextResponse("Forbidden. Team membership required to inspect clues.", { status: 403 });
      }

      // Check which puzzle this asset belongs to
      const fileUrl = `/api/media/${filename}`;
      const puzzleAsset = await prisma.puzzleAsset.findFirst({
        where: {
          OR: [{ url: fileUrl }, { url: { contains: filename } }],
        },
        select: {
          puzzle: {
            select: { id: true, orderIndex: true },
          },
        },
      });

      const legacyPuzzle = !puzzleAsset
        ? await prisma.puzzle.findFirst({
            where: {
              OR: [{ assetUrl: fileUrl }, { assetUrl: { contains: filename } }],
            },
            select: { id: true, orderIndex: true },
          })
        : null;

      const targetPuzzle = puzzleAsset?.puzzle || legacyPuzzle;

      if (!targetPuzzle) {
        return new NextResponse("Forbidden. Asset is not associated with an accessible puzzle.", { status: 403 });
      }

      // If tied to a puzzle > 1, verify team solved all preceding puzzles
      if (targetPuzzle.orderIndex > 1) {
        const precedingUnsolved = await prisma.puzzle.count({
          where: {
            orderIndex: { lt: targetPuzzle.orderIndex },
            submissions: {
              none: { teamId, isCorrect: true },
            },
          },
        });

        if (precedingUnsolved > 0) {
          return new NextResponse("Forbidden. Solve preceding puzzles first.", { status: 403 });
        }
      }
    }

    const ext = filename.split(".").pop()?.toLowerCase() || "";
    let contentType = MIME_MAP[ext] || "application/octet-stream";
    let fileSize: number;
    let fileBuffer: Buffer | null = null;
    let useDiskStream = false;

    // Use private storage directory instead of public static folder
    const filePath = path.join(process.cwd(), "storage/uploads/puzzles", filename);

    // 1. Try local disk first (faster in local dev)
    try {
      const fileStat = await stat(filePath);
      fileSize = fileStat.size;
      useDiskStream = true;
    } catch {
      // 2. Fallback to PostgreSQL MediaFile table (100% persistent on Vercel without ephemeral disk loss)
      const dbMedia = await prisma.mediaFile.findUnique({
        where: { fileName: filename },
      });

      if (!dbMedia) {
        return new NextResponse("Media not found", { status: 404 });
      }

      fileBuffer = Buffer.from(dbMedia.data);
      fileSize = dbMedia.size;
      if (dbMedia.mimeType) {
        contentType = dbMedia.mimeType;
      }
    }

    const range = req.headers.get("range");

    const isSvg = ext === "svg" || contentType === "image/svg+xml";

    // Strictly session-partitioned private headers
    const baseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": isSvg
        ? `attachment; filename="${encodeURIComponent(filename)}"`
        : `inline; filename="${encodeURIComponent(filename)}"`,
      "X-Content-Type-Options": "nosniff",
      ...(isSvg ? { "Content-Security-Policy": "default-src 'none'; sandbox" } : {}),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "Vary": "Cookie",
      "Accept-Ranges": "bytes",
    };

    // Range Request handling (HTTP 206) for Audio/Video scrubbing and fast playback
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (
        isNaN(start) ||
        isNaN(end) ||
        start < 0 ||
        end < 0 ||
        start > end ||
        start >= fileSize
      ) {
        return new NextResponse("Requested range not satisfiable", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;

      if (useDiskStream) {
        const fileStream = createReadStream(filePath, { start, end });
        const webStream = Readable.toWeb(fileStream);

        return new NextResponse(webStream as unknown as BodyInit, {
          status: 206,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Content-Length": chunkSize.toString(),
          },
        });
      } else if (fileBuffer) {
        const chunk = fileBuffer.subarray(start, end + 1);
        return new NextResponse(new Uint8Array(chunk), {
          status: 206,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Content-Length": chunkSize.toString(),
          },
        });
      }
    }

    // Complete file response
    if (useDiskStream) {
      fileBuffer = await readFile(filePath);
    }

    return new NextResponse(new Uint8Array(fileBuffer!), {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("[Media Route Error]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
