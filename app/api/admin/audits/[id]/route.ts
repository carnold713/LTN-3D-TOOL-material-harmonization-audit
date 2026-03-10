import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { deleteFile } from "@/lib/storage";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Clean up files
  await deleteFile(audit.uploadFilename);
  if (audit.croppedRefFilename) await deleteFile(audit.croppedRefFilename);
  if (audit.croppedUploadFilename) await deleteFile(audit.croppedUploadFilename);

  await prisma.audit.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
