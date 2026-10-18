import { NextRequest, NextResponse } from "next/server";
import { stat, readFile } from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";

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

    // Strict path traversal defense
    if (!filename || !/^[a-zA-Z0-9_\-\.]+$/.test(filename) || filename.includes("..")) {
      return new NextResponse("Invalid file identifier", { status: 400 });
    }

    const ext = filename.split(".").pop()?.toLowerCase() || "";
    let contentType = MIME_MAP[ext] || "application/octet-stream";
    let fileSize: number;
    let fileBuffer: Buffer | null = null;
    let useDiskStream = false;

    const filePath = path.join(process.cwd(), "public/uploads/puzzles", filename);

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

    // Common streaming & security headers with Vercel Edge caching (s-maxage=31536000)
    const baseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
      "Accept-Ranges": "bytes",
    };

    // Range Request handling (HTTP 206) for Audio/Video scrubbing and fast playback
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || isNaN(end) || start > end || start >= fileSize) {
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
