import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify audit exists
  const audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  const body = await request.json();

  const feedback = await prisma.adminFeedback.upsert({
    where: { auditId: id },
    create: {
      auditId: id,
      finishVerdict: body.finishVerdict ?? null,
      finishNote: body.finishNote ?? null,
      colorVerdict: body.colorVerdict ?? null,
      colorNote: body.colorNote ?? null,
      materialVerdict: body.materialVerdict ?? null,
      materialNote: body.materialNote ?? null,
      overallNote: body.overallNote ?? null,
    },
    update: {
      finishVerdict: body.finishVerdict ?? null,
      finishNote: body.finishNote ?? null,
      colorVerdict: body.colorVerdict ?? null,
      colorNote: body.colorNote ?? null,
      materialVerdict: body.materialVerdict ?? null,
      materialNote: body.materialNote ?? null,
      overallNote: body.overallNote ?? null,
    },
  });

  return NextResponse.json(feedback);
}
