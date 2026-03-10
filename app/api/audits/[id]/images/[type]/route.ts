import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readFile } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;

  const audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let filename: string | null = null;

  switch (type) {
    case "upload":
      filename = audit.uploadFilename;
      break;
    case "cropped-upload":
      filename = audit.croppedUploadFilename;
      break;
    case "cropped-ref":
      filename = audit.croppedRefFilename;
      break;
    default:
      return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
  }

  if (!filename) {
    return NextResponse.json(
      { error: "Image not available" },
      { status: 404 }
    );
  }

  try {
    const data = await readFile(filename);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Image file not found" },
      { status: 404 }
    );
  }
}
