import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";

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

  const accessKeyId = (
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY_ID ||
    process.env.S3_ACCESS_KEY_ID ||
    process.env.SUPABASE_ACCESS_KEY_ID ||
    process.env.SUPABASE_S3_ACCESS_KEY ||
    process.env.SUPABASE_S3_ACCESS_KEY_ID ||
    ""
  ).trim();

  const secretAccessKey = (
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.S3_SECRET_ACCESS_KEY ||
    process.env.SUPABASE_SECRET_ACCESS_KEY ||
    process.env.SUPABASE_S3_SECRET_KEY ||
    process.env.SUPABASE_S3_SECRET_ACCESS_KEY ||
    ""
  ).trim();

  if (!accessKeyId || !secretAccessKey) return null;

  const bucket = (
    process.env.AWS_BUCKET_NAME ||
    process.env.R2_BUCKET_NAME ||
    process.env.S3_BUCKET_NAME ||
    process.env.SUPABASE_BUCKET_NAME ||
    process.env.SUPABASE_BUCKET ||
    "findx-assets"
  ).trim();

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const rawEndpoint =
    process.env.S3_ENDPOINT ||
    process.env.SUPABASE_S3_ENDPOINT ||
    process.env.AWS_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  const endpoint = rawEndpoint ? rawEndpoint.trim().replace(/\/+$/, "") : undefined;

  let region = (
    process.env.AWS_REGION ||
    process.env.SUPABASE_REGION ||
    process.env.S3_REGION ||
    "ap-northeast-2"
  ).trim();

  if (!region || region === "auto") {
    region = "ap-northeast-2";
  }

  // Derive public base URL
  let publicBase = (
    process.env.R2_PUBLIC_URL ||
    process.env.SUPABASE_PUBLIC_URL ||
    process.env.S3_PUBLIC_URL ||
    ""
  ).trim().replace(/\/+$/, "");

  // Auto-generate Supabase public URL if publicBase was omitted but endpoint is a Supabase domain
  if (!publicBase && endpoint && endpoint.includes("supabase.co")) {
    const match = endpoint.match(/https:\/\/([a-z0-9_-]+)\.(?:storage\.)?supabase\.co/i);
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
    // Required for Supabase S3 compatibility so bucket is treated as path instead of virtual host
    forcePathStyle: true,
  });

  return { client, bucket, publicBase };
}

let cachedBucketInfo: { bucket: string; publicBase: string } | null = null;

export async function ensureBucketExists(s3: {
  client: S3Client;
  bucket: string;
  publicBase: string;
}): Promise<{ bucket: string; publicBase: string }> {
  if (cachedBucketInfo) {
    return cachedBucketInfo;
  }

  try {
    const listRes = await s3.client.send(new ListBucketsCommand({}));
    const buckets = (listRes.Buckets?.map((b) => b.Name).filter(Boolean) as string[]) || [];

    // 1. If configured bucket exists, use it
    if (buckets.includes(s3.bucket)) {
      cachedBucketInfo = { bucket: s3.bucket, publicBase: s3.publicBase };
      return cachedBucketInfo;
    }

    // 2. Otherwise, attempt to create the configured bucket
    await s3.client.send(new CreateBucketCommand({ Bucket: s3.bucket }));
    cachedBucketInfo = { bucket: s3.bucket, publicBase: s3.publicBase };
    return cachedBucketInfo;
  } catch (err) {
    console.warn("[Storage] Bucket listing/creation check:", err);
    cachedBucketInfo = { bucket: s3.bucket, publicBase: s3.publicBase };
    return cachedBucketInfo;
  }
}

// Magic byte verification for high security and MIME-spoofing prevention
export function detectAssetTypeAndExt(buffer: Buffer): {
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
  buffer: Buffer
): Promise<StoredAsset> {
  const verified = detectAssetTypeAndExt(buffer);
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
      const { bucket: targetBucket, publicBase: targetBase } = await ensureBucketExists(s3);

      const command = new PutObjectCommand({
        Bucket: targetBucket,
        Key: fileName,
        Body: buffer,
        ContentType: verified.mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      });

      await s3.client.send(command);

      const publicUrl = targetBase
        ? `${targetBase}/${fileName}`
        : `https://${targetBucket}.s3.amazonaws.com/${fileName}`;

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
    const uploadDir = path.join(process.cwd(), "storage/uploads/puzzles");
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
  // Prevent path traversal and restrict to valid evidence filenames
  const VALID_EVIDENCE_FILENAME = /^evidence-[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif|pdf|mp3|wav|ogg|m4a|mp4|webm)$/i;
  if (!fileName || !VALID_EVIDENCE_FILENAME.test(fileName) || fileName.includes("..")) {
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
    const uploadDir = path.join(process.cwd(), "storage/uploads/puzzles");
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

  const { bucket: targetBucket, publicBase: targetBase } = await ensureBucketExists(s3);
  const mediaFiles = await prisma.mediaFile.findMany();
  let migratedCount = 0;
  let totalFreedBytes = 0;
  const errors: string[] = [];

  for (const media of mediaFiles) {
    try {
      const buffer = Buffer.from(media.data);
      const command = new PutObjectCommand({
        Bucket: targetBucket,
        Key: media.fileName,
        Body: buffer,
        ContentType: media.mimeType || "application/octet-stream",
        CacheControl: "public, max-age=31536000, immutable",
      });

      await s3.client.send(command);

      const publicUrl = targetBase
        ? `${targetBase}/${media.fileName}`
        : `https://${targetBucket}.s3.amazonaws.com/${media.fileName}`;

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

/**
 * Saves a team avatar (PFP) to Supabase Storage (or S3/R2), falling back to Base64 in PostgreSQL.
 * Built to strictly protect free-tier quotas:
 * 1. Resizes & compresses image to 96x96 WebP (< 5KB), taking < 0.5% of the 1GB storage limit even with 1000 teams.
 * 2. Uses a deterministic key (`avatars/${teamId}.webp`) so every update overwrites the previous file without storage leaks.
 * 3. Applies a 7-day Cache-Control header to keep egress bandwidth (< 2GB free limit) near zero.
 * 4. Appends a cache-busting timestamp query parameter (`?v=...`) to ensure immediate UI updates.
 */
export async function saveTeamAvatar(
  teamId: string,
  buffer: Buffer
): Promise<string> {
  let processedBuffer: Buffer;
  let mimeType = "image/webp";

  try {
    processedBuffer = await sharp(buffer)
      .resize(96, 96, { fit: "cover" })
      .webp({ quality: 80, effort: 6 })
      .toBuffer();
  } catch (err) {
    console.warn("[Avatar Storage] Sharp compression failed, using original:", err);
    processedBuffer = buffer;
    mimeType = "image/jpeg";
  }

  const s3 = getS3Config();
  if (s3) {
    try {
      const { bucket: targetBucket, publicBase: targetBase } = await ensureBucketExists(s3);
      const key = `avatars/${teamId}.webp`;

      await s3.client.send(
        new PutObjectCommand({
          Bucket: targetBucket,
          Key: key,
          Body: processedBuffer,
          ContentType: mimeType,
          CacheControl: "public, max-age=604800, stale-while-revalidate=86400",
        })
      );

      const base = targetBase || `https://${targetBucket}.s3.amazonaws.com`;
      return `${base}/${key}?v=${Date.now()}`;
    } catch (s3Error) {
      console.warn("[Avatar Storage] S3 upload failed, falling back to base64 Data URI:", s3Error);
    }
  }

  return `data:${mimeType};base64,${processedBuffer.toString("base64")}`;
}

/**
 * Deletes a team avatar from Supabase Storage / S3 to reclaim storage space.
 */
export async function deleteTeamAvatar(teamId: string): Promise<boolean> {
  const s3 = getS3Config();
  if (s3) {
    try {
      const key = `avatars/${teamId}.webp`;
      await s3.client.send(
        new DeleteObjectCommand({
          Bucket: s3.bucket,
          Key: key,
        })
      );
      return true;
    } catch (err) {
      console.warn("[Avatar Storage] Failed to delete avatar from S3:", err);
      return false;
    }
  }
  return false;
}

/**
 * Migrates any legacy in-database Base64 avatars to Supabase Storage, freeing database memory.
 */
export async function migrateAvatarsToS3(): Promise<{
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
      errors: ["Cloud storage (S3/Supabase) is not configured."],
    };
  }

  const { bucket: targetBucket, publicBase: targetBase } = await ensureBucketExists(s3);
  const teamsWithBase64 = await prisma.team.findMany({
    where: {
      avatarUrl: {
        startsWith: "data:image/",
      },
    },
    select: { id: true, avatarUrl: true },
  });

  let migratedCount = 0;
  let totalFreedBytes = 0;
  const errors: string[] = [];

  for (const team of teamsWithBase64) {
    if (!team.avatarUrl) continue;
    try {
      const commaIdx = team.avatarUrl.indexOf(",");
      if (commaIdx === -1) continue;
      const base64Data = team.avatarUrl.substring(commaIdx + 1);
      const rawBuffer = Buffer.from(base64Data, "base64");

      const processedBuffer = await sharp(rawBuffer)
        .resize(96, 96, { fit: "cover" })
        .webp({ quality: 80, effort: 6 })
        .toBuffer();

      const key = `avatars/${team.id}.webp`;

      await s3.client.send(
        new PutObjectCommand({
          Bucket: targetBucket,
          Key: key,
          Body: processedBuffer,
          ContentType: "image/webp",
          CacheControl: "public, max-age=604800, stale-while-revalidate=86400",
        })
      );

      const base = targetBase || `https://${targetBucket}.s3.amazonaws.com`;
      const publicUrl = `${base}/${key}?v=${Date.now()}`;

      await prisma.team.update({
        where: { id: team.id },
        data: { avatarUrl: publicUrl },
      });

      migratedCount++;
      totalFreedBytes += team.avatarUrl.length;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to migrate avatar for team ${team.id}: ${msg}`);
    }
  }

  return {
    success: errors.length === 0,
    migratedCount,
    totalFreedBytes,
    errors,
  };
}

