import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

export type SupportedAssetType = "image" | "audio" | "pdf" | "video";

export interface StoredAsset {
  url: string;
  type: SupportedAssetType;
  fileName: string;
  size: number;
  mimeType: string;
  storageProvider?: "s3" | "database" | "local";
}

export function getS3Config(): { client: S3Client; bucket: string; publicBase: string } | null {
  const provider = (process.env.STORAGE_PROVIDER || "").toLowerCase().trim();

  // If user explicitly forced local disk/DB
  if (provider === "local") return null;

  const accessKeyId =
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY_ID ||
    process.env.S3_ACCESS_KEY_ID ||
    process.env.SUPABASE_ACCESS_KEY_ID ||
    process.env.SUPABASE_S3_ACCESS_KEY ||
    process.env.SUPABASE_S3_ACCESS_KEY_ID;

  const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.S3_SECRET_ACCESS_KEY ||
    process.env.SUPABASE_SECRET_ACCESS_KEY ||
    process.env.SUPABASE_S3_SECRET_KEY ||
    process.env.SUPABASE_S3_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) return null;

  const bucket =
    process.env.AWS_BUCKET_NAME ||
    process.env.R2_BUCKET_NAME ||
    process.env.S3_BUCKET_NAME ||
    process.env.SUPABASE_BUCKET_NAME ||
    process.env.SUPABASE_BUCKET ||
    "findx-assets";

  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint =
    process.env.S3_ENDPOINT ||
    process.env.SUPABASE_S3_ENDPOINT ||
    process.env.AWS_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  const region =
    process.env.AWS_REGION ||
    process.env.SUPABASE_REGION ||
    process.env.S3_REGION ||
    "ap-southeast-1";

  // Derive public base URL
  let publicBase = (
    process.env.R2_PUBLIC_URL ||
    process.env.SUPABASE_PUBLIC_URL ||
    process.env.S3_PUBLIC_URL ||
    ""
  ).replace(/\/$/, "");

  // Auto-generate Supabase public URL if publicBase was omitted but endpoint is a Supabase domain
  if (!publicBase && endpoint && endpoint.includes(".supabase.co")) {
    const match = endpoint.match(/https:\/\/([a-z0-9_-]+)\.supabase\.co/i);
    if (match && match[1]) {
      publicBase = `https://${match[1]}.supabase.co/storage/v1/object/public/${bucket}`;
    }
  }

  const client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: false,
  });

  return { client, bucket, publicBase };
}

// Magic byte verification for high security and MIME-spoofing prevention
export function detectAssetTypeAndExt(buffer: Buffer, originalMime?: string): {
  type: SupportedAssetType;
  ext: string;
  mimeType: string;
} | null {
  if (buffer.length < 12) return null;

  // 1. PDF: %PDF-
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { type: "pdf", ext: "pdf", mimeType: "application/pdf" };
  }

  // 2. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { type: "image", ext: "jpg", mimeType: "image/jpeg" };
  }

  // 3. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { type: "image", ext: "png", mimeType: "image/png" };
  }

  // 4. WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { type: "image", ext: "webp", mimeType: "image/webp" };
  }

  // 5. GIF: GIF87a or GIF89a (47 49 46 38)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { type: "image", ext: "gif", mimeType: "image/gif" };
  }

  // 6. Audio: Ogg (4F 67 67 53)
  if (
    buffer[0] === 0x4f &&
    buffer[1] === 0x67 &&
    buffer[2] === 0x67 &&
    buffer[3] === 0x53
  ) {
    return { type: "audio", ext: "ogg", mimeType: "audio/ogg" };
  }

  // 7. Audio: WAV (RIFF .... WAVE)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x41 &&
    buffer[10] === 0x56 &&
    buffer[11] === 0x45
  ) {
    return { type: "audio", ext: "wav", mimeType: "audio/wav" };
  }

  // 8. Audio: MP3 (ID3 header or MPEG sync)
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
    (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  ) {
    return { type: "audio", ext: "mp3", mimeType: "audio/mpeg" };
  }

  // 9. Video/Audio: MP4 / M4A (ftyp box)
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (brand.startsWith("m4a")) {
      return { type: "audio", ext: "m4a", mimeType: "audio/mp4" };
    }
    return { type: "video", ext: "mp4", mimeType: "video/mp4" };
  }

  // 10. Video: WebM (1A 45 DF A3)
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { type: "video", ext: "webm", mimeType: "video/webm" };
  }

  // Fallback for SVG if specified and starts with XML/SVG tag
  if (originalMime === "image/svg+xml") {
    const head = buffer.subarray(0, 200).toString("utf8").trim().toLowerCase();
    if (head.includes("<svg") || head.includes("<?xml")) {
      return { type: "image", ext: "svg", mimeType: "image/svg+xml" };
    }
  }

  return null;
}

const MAX_FILE_SIZES: Record<SupportedAssetType, number> = {
  image: 15 * 1024 * 1024, // 15MB
  audio: 35 * 1024 * 1024, // 35MB
  pdf: 35 * 1024 * 1024,   // 35MB
  video: 60 * 1024 * 1024, // 60MB
};

/**
 * Persists an uploaded asset safely. Strips original filename to eliminate spoilers.
 */
export async function savePuzzleAsset(
  buffer: Buffer,
  originalMime?: string
): Promise<StoredAsset> {
  const verified = detectAssetTypeAndExt(buffer, originalMime);
  if (!verified) {
    throw new Error(
      "Unsupported file format. Verified formats: JPEG, PNG, WebP, GIF, PDF, MP3, WAV, OGG, M4A, MP4, WebM."
    );
  }

  const maxSize = MAX_FILE_SIZES[verified.type];
  if (buffer.length > maxSize) {
    const mbLimit = Math.round(maxSize / (1024 * 1024));
    throw new Error(`File is too large. Maximum size for ${verified.type} is ${mbLimit}MB.`);
  }

  // Generate safe random hex filename to prevent spoiler leakage
  const safeHash = crypto.randomBytes(16).toString("hex");
  const fileName = `evidence-${safeHash}.${verified.ext}`;

  // Check if Cloudflare R2 / S3 is configured
  const s3 = getS3Config();
  if (s3) {
    try {
      const command = new PutObjectCommand({
        Bucket: s3.bucket,
        Key: fileName,
        Body: buffer,
        ContentType: verified.mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      });

      await s3.client.send(command);

      const publicUrl = s3.publicBase
        ? `${s3.publicBase}/${fileName}`
        : `https://${s3.bucket}.r2.cloudflarestorage.com/${fileName}`;

      return {
        url: publicUrl,
        type: verified.type,
        fileName,
        size: buffer.length,
        mimeType: verified.mimeType,
        storageProvider: "s3",
      };
    } catch (r2Error) {
      console.error("[Storage] Cloudflare R2 / S3 upload failed:", r2Error);
      if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
        throw new Error(`Cloud storage upload failed: ${(r2Error as Error).message}`);
      }
    }
  }

  // Persist directly into PostgreSQL MediaFile table so assets NEVER get lost on Vercel or restarts
  try {
    await prisma.mediaFile.upsert({
      where: { fileName },
      update: {
        data: buffer,
        size: buffer.length,
        mimeType: verified.mimeType,
      },
      create: {
        fileName,
        mimeType: verified.mimeType,
        size: buffer.length,
        data: buffer,
      },
    });
  } catch (dbErr) {
    console.error("[Storage] Database media persist error:", dbErr);
  }

  // Attempt local filesystem cache (for fast local dev reads)
  try {
    const uploadDir = path.join(process.cwd(), "public/uploads/puzzles");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
  } catch {
    // Read-only filesystem in serverless environments (Vercel) safely skipped
  }

  // Serve via /api/media/ for resilient HTTP 206 audio ranges and cross-origin headers
  const url = `/api/media/${fileName}`;

  return {
    url,
    type: verified.type,
    fileName,
    size: buffer.length,
    mimeType: verified.mimeType,
    storageProvider: "database",
  };
}

/**
 * Safely deletes a stored asset (from Cloudflare R2, database, or local disk)
 */
export async function deleteAsset(fileName: string): Promise<boolean> {
  // Prevent path traversal
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(fileName) || fileName.includes("..")) {
    return false;
  }

  // Delete from PostgreSQL
  await prisma.mediaFile.delete({ where: { fileName } }).catch(() => undefined);

  const s3 = getS3Config();
  if (s3) {
    try {
      await s3.client.send(
        new DeleteObjectCommand({
          Bucket: s3.bucket,
          Key: fileName,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  try {
    const uploadDir = path.join(process.cwd(), "public/uploads/puzzles");
    const filePath = path.join(uploadDir, fileName);
    await unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

export const deleteLocalAsset = deleteAsset;

/**
 * Migrates media files currently sitting in PostgreSQL (MediaFile table) to S3/Supabase,
 * updates all puzzle references to point directly to the Supabase CDN, and cleans up the DB.
 */
export async function migrateDbMediaToS3(): Promise<{
  success: boolean;
  migratedCount: number;
  totalFreedBytes: number;
  errors: string[];
}> {
  const s3 = getS3Config();
  if (!s3) {
    return {
      success: false,
      migratedCount: 0,
      totalFreedBytes: 0,
      errors: [
        "Cloud storage (S3/Supabase) is not configured. Please ensure AWS_ACCESS_KEY_ID / S3_ENDPOINT are set.",
      ],
    };
  }

  const mediaFiles = await prisma.mediaFile.findMany();
  let migratedCount = 0;
  let totalFreedBytes = 0;
  const errors: string[] = [];

  for (const media of mediaFiles) {
    try {
      const buffer = Buffer.from(media.data);
      const command = new PutObjectCommand({
        Bucket: s3.bucket,
        Key: media.fileName,
        Body: buffer,
        ContentType: media.mimeType || "application/octet-stream",
        CacheControl: "public, max-age=31536000, immutable",
      });

      await s3.client.send(command);

      const publicUrl = s3.publicBase
        ? `${s3.publicBase}/${media.fileName}`
        : `https://${s3.bucket}.s3.amazonaws.com/${media.fileName}`;

      const localUrl = `/api/media/${media.fileName}`;

      // Update PuzzleAsset records
      await prisma.puzzleAsset.updateMany({
        where: { url: localUrl },
        data: { url: publicUrl },
      });

      // Update legacy Puzzle records
      await prisma.puzzle.updateMany({
        where: { assetUrl: localUrl },
        data: { assetUrl: publicUrl },
      });

      // Delete from PostgreSQL to reclaim database space
      await prisma.mediaFile.delete({
        where: { id: media.id },
      });

      migratedCount++;
      totalFreedBytes += media.size;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to migrate ${media.fileName}: ${msg}`);
    }
  }

  return {
    success: errors.length === 0,
    migratedCount,
    totalFreedBytes,
    errors,
  };
}

