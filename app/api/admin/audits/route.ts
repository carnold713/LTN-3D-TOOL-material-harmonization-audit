import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const passFilter = searchParams.get("pass");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (passFilter === "true") where.overallPass = true;
  if (passFilter === "false") where.overallPass = false;

  const [audits, total] = await Promise.all([
    prisma.audit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        referenceImage: { select: { name: true, category: true } },
        adminFeedback: { select: { id: true } },
      },
    }),
    prisma.audit.count({ where }),
  ]);

  return NextResponse.json({
    audits,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
