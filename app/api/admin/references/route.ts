import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { saveFile } from "@/lib/storage";
import { normalizeImage } from "@/lib/imageProcessing";
import { generateFilename } from "@/lib/utils";

export async function GET() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const references = await prisma.referenceImage.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { audits: true } } },
  });

  return NextResponse.json(references);
}

export async function POST(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string;

    if (!file || !name || !category) {
      return NextResponse.json(
        { error: "Missing required fields: image, name, category" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { data, info } = await normalizeImage(buffer);

    const filename = generateFilename(file.name, "ref");
    await saveFile(filename, data);

    const reference = await prisma.referenceImage.create({
      data: {
        name,
        description: description || null,
        category,
        filename,
        mimetype: info.mimetype,
        width: info.width,
        height: info.height,
      },
    });

    return NextResponse.json(reference, { status: 201 });
  } catch (error) {
    console.error("Failed to create reference:", error);
    return NextResponse.json(
      { error: "Failed to upload reference image" },
      { status: 500 }
    );
  }
}
