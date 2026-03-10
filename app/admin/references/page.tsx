"use client";

import { useEffect, useState } from "react";

interface Reference {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
  _count: { audits: number };
}

export default function AdminReferencesPage() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferences();
  }, []);

  async function loadReferences() {
    try {
      const res = await fetch("/api/admin/references");
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      setReferences(await res.json());
    } catch (err) {
      console.error("Failed to load references:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/references/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    loadReferences();
  }

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-lg" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Reference Materials
        </h2>
        <a
          href="/admin/references/new"
          className="px-4 py-2 bg-brand-800 text-white text-sm rounded-lg hover:bg-brand-700 transition-colors"
        >
          Upload New Reference
        </a>
      </div>

      {references.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No reference materials yet.</p>
          <a
            href="/admin/references/new"
            className="inline-block mt-4 text-sm text-brand-600 hover:underline"
          >
            Upload your first reference image
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {references.map((ref) => (
            <div
              key={ref.id}
              className={`border rounded-lg overflow-hidden ${!ref.isActive ? "opacity-50" : ""}`}
            >
              <div className="aspect-video bg-gray-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/references/${ref.id}/image`}
                  alt={ref.name}
                  className="w-full h-full object-cover"
                />
                {!ref.isActive && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      Inactive
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900">{ref.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {ref.category} &middot; {ref._count.audits} audit
                  {ref._count.audits !== 1 ? "s" : ""}
                </p>
                {ref.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {ref.description}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => toggleActive(ref.id, ref.isActive)}
                    className="text-xs px-3 py-1 border rounded hover:bg-gray-50"
                  >
                    {ref.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
