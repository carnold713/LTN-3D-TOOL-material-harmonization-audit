"use client";

import { useEffect, useState } from "react";
import { formatScore } from "@/lib/utils";

interface AuditRow {
  id: string;
  status: string;
  overallPass: boolean | null;
  finishScore: number | null;
  colorScore: number | null;
  materialScore: number | null;
  createdAt: string;
  referenceImage: { name: string; category: string };
  adminFeedback: { id: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminAuditsPage() {
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadAudits();
  }, [filter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAudits() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter === "pass") params.set("pass", "true");
      if (filter === "fail") params.set("pass", "false");

      const res = await fetch(`/api/admin/audits?${params}`);
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const data = await res.json();
      setAudits(data.audits || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to load audits:", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAudit(id: string) {
    if (!confirm("Delete this audit? This cannot be undone.")) return;
    await fetch(`/api/admin/audits/${id}`, { method: "DELETE" });
    loadAudits();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">All Audits</h2>
        <div className="flex gap-2">
          {["all", "pass", "fail"].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`px-3 py-1 text-sm rounded-lg border ${
                filter === f
                  ? "bg-brand-100 border-brand-300 text-brand-800"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "All" : f === "pass" ? "Passed" : "Failed"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse h-64 bg-gray-100 rounded-lg" />
      ) : audits.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No audits found.</p>
      ) : (
        <>
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
                  <th className="text-center px-4 py-3 font-medium text-gray-500">
                    Reviewed
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <a
                        href={`/admin/audits/${audit.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {audit.referenceImage.name}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          audit.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : audit.status === "FAILED"
                              ? "bg-red-100 text-red-700"
                              : audit.status === "PROCESSING"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {audit.status}
                      </span>
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
                    <td className="px-4 py-3 text-center">
                      {audit.adminFeedback ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          Reviewed
                        </span>
                      ) : (
                        <a
                          href={`/admin/audits/${audit.id}`}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          Review
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteAudit(audit.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 20 + 1}-
                {Math.min(page * 20, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
