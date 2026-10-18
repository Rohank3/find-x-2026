import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { isValidEntityId } from '@/lib/utils';
import { getEffectiveSystemConfig } from '@/lib/competition';
import { invalidateTeamDashboardCache } from '@/lib/dashboardCache';
import sharp from 'sharp';

// Magic byte signatures for JPEG, PNG, WebP
function getVerifiedImageExtension(buffer: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
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
    return 'png';
  }
  // WebP: RIFF .... WEBP
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
    return 'webp';
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let teamId = session.user.teamId;
    if (!teamId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { teamId: true },
      });
      teamId = dbUser?.teamId ?? undefined;
    }

    if (!teamId || !isValidEntityId(teamId)) {
      return NextResponse.json({ error: 'Invalid team identifier format' }, { status: 400 });
    }

    const config = await getEffectiveSystemConfig().catch(() => null);
    if (config?.competitionState === 'ENDED') {
      return NextResponse.json(
        { error: 'Avatar modifications are closed. The competition has concluded.' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const entry = formData.get('file');

    if (!entry || typeof entry === 'string' || !(entry instanceof Blob)) {
      return NextResponse.json({ error: 'Valid image file required' }, { status: 400 });
    }

    if (entry.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 2MB allowed.' }, { status: 400 });
    }

    const buffer = Buffer.from(await entry.arrayBuffer());
    const ext = getVerifiedImageExtension(buffer);

    if (!ext) {
      return NextResponse.json(
        { error: 'Invalid image format. Verified JPEG, PNG, and WebP only.' },
        { status: 400 }
      );
    }

    // Attempt optional local filesystem cache, but NEVER let filesystem failure block DB persist
    try {
      const uploadDir = path.join(process.cwd(), 'public/uploads/avatars');
      await mkdir(uploadDir, { recursive: true });

      // Clean up any existing avatar files for this team
      for (const altExt of ['jpg', 'jpeg', 'png', 'webp']) {
        const oldPath = path.join(uploadDir, `${teamId}.${altExt}`);
        await unlink(oldPath).catch(() => undefined);
      }

      const fileName = `${teamId}.${ext}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
    } catch (fsError) {
      console.warn('[Avatar Upload] Local filesystem write skipped (using direct database storage):', (fsError as Error).message);
    }

    // Resize & compress avatar to 96x96 WebP (< 10KB) to prevent database bloat,
    // leaderboard memory exhaustion (OOM), and network saturation.
    let processedBuffer: Buffer;
    let mimeType = 'image/webp';
    try {
      processedBuffer = await sharp(buffer)
        .resize(96, 96, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (sharpError) {
      console.warn('[Avatar Upload] Sharp compression error, using original buffer:', sharpError);
      processedBuffer = buffer;
      mimeType = ext === 'jpg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'image/webp';
    }

    const avatarUrl = `data:${mimeType};base64,${processedBuffer.toString('base64')}`;

    await prisma.team.update({
      where: { id: teamId },
      data: { avatarUrl },
    });

    await invalidateTeamDashboardCache(teamId);

    return NextResponse.json({ url: avatarUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let teamId = session.user.teamId;
    if (!teamId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { teamId: true },
      });
      teamId = dbUser?.teamId ?? undefined;
    }

    if (!teamId || !isValidEntityId(teamId)) {
      return NextResponse.json({ error: 'Invalid team identifier format' }, { status: 400 });
    }

    const config = await getEffectiveSystemConfig().catch(() => null);
    if (config?.competitionState === 'ENDED') {
      return NextResponse.json(
        { error: 'Avatar modifications are closed. The competition has concluded.' },
        { status: 400 }
      );
    }

    try {
      const uploadDir = path.join(process.cwd(), 'public/uploads/avatars');
      for (const altExt of ['jpg', 'jpeg', 'png', 'webp']) {
        const oldPath = path.join(uploadDir, `${teamId}.${altExt}`);
        await unlink(oldPath).catch(() => undefined);
      }
    } catch {
      // Ignored
    }

    await prisma.team.update({
      where: { id: teamId },
      data: { avatarUrl: null },
    });

    await invalidateTeamDashboardCache(teamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
