"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatScore, getScoreColor } from "@/lib/utils";

interface AdminFeedback {
  id: string;
  finishVerdict: string | null;
  finishNote: string | null;
  colorVerdict: string | null;
  colorNote: string | null;
  materialVerdict: string | null;
  materialNote: string | null;
  overallNote: string | null;
}

interface AuditDetail {
  id: string;
  status: string;
  finishScore: number | null;
  colorScore: number | null;
  materialScore: number | null;
  overallPass: boolean | null;
  finishFeedback: string | null;
  colorFeedback: string | null;
  materialFeedback: string | null;
  croppedUploadFilename: string | null;
  croppedRefFilename: string | null;
  visitorNote: string | null;
  createdAt: string;
  referenceImage: { id: string; name: string; category: string };
  adminFeedback: AdminFeedback | null;
}

type Verdict = "approve" | "override";

interface CategoryFeedback {
  verdict: Verdict;
  overrideScore: string;
  note: string;
}

export default function AdminAuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [finish, setFinish] = useState<CategoryFeedback>({
    verdict: "approve",
    overrideScore: "",
    note: "",
  });
  const [color, setColor] = useState<CategoryFeedback>({
    verdict: "approve",
    overrideScore: "",
    note: "",
  });
  const [material, setMaterial] = useState<CategoryFeedback>({
    verdict: "approve",
    overrideScore: "",
    note: "",
  });
  const [overallNote, setOverallNote] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/audits/${id}`);
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        if (!res.ok) throw new Error("Not found");
        const data: AuditDetail = await res.json();
        setAudit(data);

        // Populate form from existing feedback
        if (data.adminFeedback) {
          const fb = data.adminFeedback;
          setFinish(parseFeedback(fb.finishVerdict, fb.finishNote));
          setColor(parseFeedback(fb.colorVerdict, fb.colorNote));
          setMaterial(parseFeedback(fb.materialVerdict, fb.materialNote));
          setOverallNote(fb.overallNote || "");
        }
      } catch {
        setError("Failed to load audit");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function parseFeedback(
    verdict: string | null,
    note: string | null
  ): CategoryFeedback {
    if (!verdict) return { verdict: "approve", overrideScore: "", note: note || "" };
    if (verdict === "approve") return { verdict: "approve", overrideScore: "", note: note || "" };
    return { verdict: "override", overrideScore: verdict, note: note || "" };
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const body = {
        finishVerdict: finish.verdict === "approve" ? "approve" : finish.overrideScore || null,
        finishNote: finish.note || null,
        colorVerdict: color.verdict === "approve" ? "approve" : color.overrideScore || null,
        colorNote: color.note || null,
        materialVerdict: material.verdict === "approve" ? "approve" : material.overrideScore || null,
        materialNote: material.note || null,
        overallNote: overallNote || null,
      };

      const res = await fetch(`/api/admin/audits/${id}/feedback`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save feedback");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse h-96 bg-gray-100 rounded-lg" />;
  }

  if (error || !audit) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error || "Audit not found"}</p>
        <a href="/admin/audits" className="text-brand-600 hover:underline text-sm mt-2 inline-block">
          Back to audits
        </a>
      </div>
    );
  }

  const categories = [
    { key: "finish" as const, label: "Finish", score: audit.finishScore, aiFeedback: audit.finishFeedback, state: finish, setState: setFinish },
    { key: "color" as const, label: "Color", score: audit.colorScore, aiFeedback: audit.colorFeedback, state: color, setState: setColor },
    { key: "material" as const, label: "Material", score: audit.materialScore, aiFeedback: audit.materialFeedback, state: material, setState: setMaterial },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <a href="/admin/audits" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">
            &larr; Back to audits
          </a>
          <h2 className="text-lg font-semibold text-gray-900">
            Audit Review: {audit.referenceImage.name}
          </h2>
          <p className="text-sm text-gray-500">
            {new Date(audit.createdAt).toLocaleString()} &middot;{" "}
            <a href={`/results/${audit.id}`} className="text-brand-600 hover:underline" target="_blank">
              View public results
            </a>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium">Saved!</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Feedback"}
          </button>
        </div>
      </div>

      {/* Image comparison */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-50 rounded-xl overflow-hidden">
          <div className="aspect-square relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/references/${audit.referenceImage.id}/image`}
              alt={audit.referenceImage.name}
              className="w-full h-full object-contain"
            />
            <span className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-lg">
              Reference
            </span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl overflow-hidden">
          <div className="aspect-square relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/audits/${audit.id}/images/upload`}
              alt="Submitted sample"
              className="w-full h-full object-contain"
            />
            <span className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-lg">
              Sample
            </span>
          </div>
        </div>
      </div>

      {/* Visitor note */}
      {audit.visitorNote && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Visitor Note</p>
          <p className="text-sm text-blue-900">{audit.visitorNote}</p>
        </div>
      )}

      {/* Category reviews */}
      <div className="space-y-6 mb-8">
        {categories.map((cat) => (
          <CategoryReviewCard
            key={cat.key}
            label={cat.label}
            aiScore={cat.score}
            aiFeedback={cat.aiFeedback}
            state={cat.state}
            onChange={cat.setState}
          />
        ))}
      </div>

      {/* Overall admin note */}
      <div className="border rounded-xl p-5 mb-8">
        <h3 className="font-semibold text-gray-900 mb-1">Overall Notes for AI Training</h3>
        <p className="text-xs text-gray-500 mb-3">
          General guidance that will help calibrate future audits. E.g., &quot;This reference tends to photograph warmer under LED lighting — account for that.&quot;
        </p>
        <textarea
          value={overallNote}
          onChange={(e) => setOverallNote(e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
          placeholder="Add general notes for AI calibration..."
        />
      </div>

      {/* Save button (bottom) */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-green-600 font-medium">Saved!</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Feedback"}
        </button>
      </div>
    </div>
  );
}

function CategoryReviewCard({
  label,
  aiScore,
  aiFeedback,
  state,
  onChange,
}: {
  label: string;
  aiScore: number | null;
  aiFeedback: string | null;
  state: CategoryFeedback;
  onChange: (val: CategoryFeedback) => void;
}) {
  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Header with AI score */}
      <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">{label}</h3>
          {aiScore != null && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">AI Score:</span>
              <span className={`font-bold ${getScoreColor(aiScore)}`}>
                {formatScore(aiScore)}
              </span>
              <span className="text-xs text-gray-400">/ 10</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* AI feedback */}
        {aiFeedback && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-1">AI Assessment</p>
            <p className="text-sm text-gray-700">{aiFeedback}</p>
          </div>
        )}

        {/* Admin verdict */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Your Verdict</p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                onChange({ ...state, verdict: "approve" })
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                state.verdict === "approve"
                  ? "bg-green-50 border-green-300 text-green-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m7.723 2.5H8.25a2.25 2.25 0 0 1-2.25-2.25v-8.5" />
              </svg>
              Approve AI Grade
            </button>
            <button
              onClick={() =>
                onChange({ ...state, verdict: "override" })
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                state.verdict === "override"
                  ? "bg-amber-50 border-amber-300 text-amber-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
              Override Score
            </button>
          </div>
        </div>

        {/* Override score input */}
        {state.verdict === "override" && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Your Score (0.00 - 10.00)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={state.overrideScore}
              onChange={(e) =>
                onChange({ ...state, overrideScore: e.target.value })
              }
              className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="e.g. 6.50"
            />
          </div>
        )}

        {/* Note */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Note {state.verdict === "override" ? "(explain why you disagree)" : "(optional)"}
          </label>
          <textarea
            value={state.note}
            onChange={(e) => onChange({ ...state, note: e.target.value })}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
            placeholder={
              state.verdict === "override"
                ? "Why is this score different? E.g., 'The AI missed that the brushing direction is rotated 90 degrees.'"
                : "Any additional context for future AI calibration..."
            }
          />
        </div>
      </div>
    </div>
  );
}
