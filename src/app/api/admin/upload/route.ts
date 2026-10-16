import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { savePuzzleAsset, deleteLocalAsset } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized. Organizers only." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Valid file is required." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Cannot upload empty file." }, { status: 400 });
    }

    const result = await savePuzzleAsset(buffer, file.type);

    return NextResponse.json({
      success: true,
      url: result.url,
      type: result.type,
      fileName: result.fileName,
      size: result.size,
    });
  } catch (error) {
    console.error("[Admin Upload Error]", error);
    const message = error instanceof Error ? error.message : "Failed to upload asset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized. Organizers only." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json({ error: "File name is required." }, { status: 400 });
    }

    const removed = await deleteLocalAsset(fileName);
    return NextResponse.json({ success: removed });
  } catch (error) {
    console.error("[Admin Delete Error]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
