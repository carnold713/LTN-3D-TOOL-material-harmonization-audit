"use client";

import { useEffect, useState } from "react";
import { formatScore } from "@/lib/utils";

interface Stats {
  totalAudits: number;
  completedAudits: number;
  passedAudits: number;
  passRate: number;
  avgFinishScore: number | null;
  avgColorScore: number | null;
  avgMaterialScore: number | null;
}

interface AuditRow {
  id: string;
  status: string;
  overallPass: boolean | null;
  finishScore: number | null;
  colorScore: number | null;
  materialScore: number | null;
  createdAt: string;
  referenceImage: { name: string; category: string };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, auditsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/audits?limit=10"),
        ]);

        if (statsRes.status === 401 || auditsRes.status === 401) {
          window.location.href = "/admin/login";
          return;
        }

        setStats(await statsRes.json());
        const auditsData = await auditsRes.json();
        setRecentAudits(auditsData.audits || []);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Audits" value={stats?.totalAudits ?? 0} />
        <StatCard label="Completed" value={stats?.completedAudits ?? 0} />
        <StatCard
          label="Pass Rate"
          value={`${stats?.passRate ?? 0}%`}
          color={
            (stats?.passRate ?? 0) >= 70
              ? "text-green-600"
              : "text-amber-600"
          }
        />
        <StatCard
          label="Avg Color Score"
          value={
            stats?.avgColorScore != null
              ? formatScore(stats.avgColorScore)
              : "N/A"
          }
        />
      </div>

      {/* Average Scores */}
      {stats?.avgFinishScore != null && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Avg Finish</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatScore(stats.avgFinishScore!)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Avg Color</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatScore(stats.avgColorScore!)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Avg Material</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatScore(stats.avgMaterialScore!)}
            </p>
          </div>
        </div>
      )}

      {/* Recent Audits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Audits
          </h2>
          <a
            href="/admin/audits"
            className="text-sm text-brand-600 hover:text-brand-800"
          >
            View all
          </a>
        </div>
        {recentAudits.length === 0 ? (
          <p className="text-gray-500 text-sm">No audits yet.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Reference
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Finish
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Color
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Material
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Result
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentAudits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <a
                        href={`/results/${audit.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {audit.referenceImage.name}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={audit.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {audit.finishScore != null
                        ? formatScore(audit.finishScore)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {audit.colorScore != null
                        ? formatScore(audit.colorScore)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {audit.materialScore != null
                        ? formatScore(audit.materialScore)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {audit.overallPass != null ? (
                        <span
                          className={
                            audit.overallPass
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {audit.overallPass ? "PASS" : "FAIL"}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color || "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.PENDING}`}
    >
      {status}
    </span>
  );
}
