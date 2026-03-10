import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readFile } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reference = await prisma.referenceImage.findUnique({ where: { id } });

  if (!reference) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await readFile(reference.filename);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": reference.mimetype,
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
