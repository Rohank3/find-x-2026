import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { isValidEntityId } from '@/lib/utils';
import { getEffectiveSystemConfig } from '@/lib/competition';

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
    if (!session?.user?.id || !session?.user?.teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = session.user.teamId;
    if (!isValidEntityId(teamId)) {
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

    const avatarUrl = `/uploads/avatars/${fileName}?t=${Date.now()}`;

    await prisma.team.update({
      where: { id: teamId },
      data: { avatarUrl },
    });

    return NextResponse.json({ url: avatarUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
