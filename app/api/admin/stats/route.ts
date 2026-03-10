import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalAudits, completedAudits, passedAudits, avgScores] =
    await Promise.all([
      prisma.audit.count(),
      prisma.audit.count({ where: { status: "COMPLETED" } }),
      prisma.audit.count({
        where: { status: "COMPLETED", overallPass: true },
      }),
      prisma.audit.aggregate({
        where: { status: "COMPLETED" },
        _avg: {
          finishScore: true,
          colorScore: true,
          materialScore: true,
        },
      }),
    ]);

  const passRate =
    completedAudits > 0
      ? Math.round((passedAudits / completedAudits) * 100)
      : 0;

  return NextResponse.json({
    totalAudits,
    completedAudits,
    passedAudits,
    passRate,
    avgFinishScore: avgScores._avg.finishScore
      ? Math.round(avgScores._avg.finishScore * 100) / 100
      : null,
    avgColorScore: avgScores._avg.colorScore
      ? Math.round(avgScores._avg.colorScore * 100) / 100
      : null,
    avgMaterialScore: avgScores._avg.materialScore
      ? Math.round(avgScores._avg.materialScore * 100) / 100
      : null,
  });
}
