"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatScore, getScoreColor, getScoreBgColor } from "@/lib/utils";

interface AuditResult {
  id: string;
  status: string;
  referenceImageId: string;
  finishScore: number | null;
  colorScore: number | null;
  materialScore: number | null;
  overallPass: boolean | null;
  finishFeedback: string | null;
  colorFeedback: string | null;
  materialFeedback: string | null;
  finishPhotoshopFix: string | null;
  colorPhotoshopFix: string | null;
  colorExposureFix: string | null;
  materialPhotoshopFix: string | null;
  finishRenderFix: string | null;
  colorRenderFix: string | null;
  materialRenderFix: string | null;
  croppedUploadFilename: string | null;
  croppedRefFilename: string | null;
  errorMessage: string | null;
  visitorNote: string | null;
  createdAt: string;
  referenceImage: {
    id: string;
    name: string;
    category: string;
  };
}

type CompareMode = "side-by-side" | "overlay" | "cropped";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compareMode, setCompareMode] = useState<CompareMode>("side-by-side");
  const [sliderPos, setSliderPos] = useState(50);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/audits/${id}`);
        if (!res.ok) throw new Error("Audit not found");
        const data = await res.json();

        if (data.status === "PROCESSING" || data.status === "PENDING") {
          // Redirect back to polling
          window.location.href = `/audit`;
          return;
        }

        setAudit(data);
      } catch {
        setError("Failed to load audit results");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-100 rounded-2xl" />
            <div className="aspect-square bg-gray-100 rounded-2xl" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {error || "Audit not found"}
        </h2>
        <a href="/audit" className="text-brand-600 hover:underline text-sm">
          Start a new audit
        </a>
      </div>
    );
  }

  if (audit.status === "FAILED") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Analysis Failed
        </h2>
        <p className="text-gray-500 mb-6">
          {audit.errorMessage || "An error occurred during analysis."}
        </p>
        <a
          href="/audit"
          className="inline-flex px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          Try Again
        </a>
      </div>
    );
  }

  const overallScore =
    audit.finishScore != null &&
    audit.colorScore != null &&
    audit.materialScore != null
      ? (audit.finishScore + audit.colorScore + audit.materialScore) / 3
      : null;

  const scores = [
    {
      label: "Finish",
      sublabel: "Surface texture & sheen",
      score: audit.finishScore,
      feedback: audit.finishFeedback,
      photoshopFix: audit.finishPhotoshopFix,
      exposureFix: null,
      renderFix: audit.finishRenderFix,
      pass: audit.finishScore != null && audit.finishScore >= 8,
    },
    {
      label: "Color",
      sublabel: "Hue, saturation & value",
      score: audit.colorScore,
      feedback: audit.colorFeedback,
      photoshopFix: audit.colorPhotoshopFix,
      exposureFix: audit.colorExposureFix,
      renderFix: audit.colorRenderFix,
      pass: audit.colorScore != null && audit.colorScore >= 8,
    },
    {
      label: "Material",
      sublabel: "Composition & grain",
      score: audit.materialScore,
      feedback: audit.materialFeedback,
      photoshopFix: audit.materialPhotoshopFix,
      exposureFix: null,
      renderFix: audit.materialRenderFix,
      pass: audit.materialScore != null && audit.materialScore >= 8,
    },
  ];

  const hasCropped = audit.croppedUploadFilename && audit.croppedRefFilename;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Audit Results
            </h1>
            {audit.overallPass != null && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-bold ${
                  audit.overallPass
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {audit.overallPass ? "PASS" : "FAIL"}
              </span>
            )}
          </div>
          <p className="text-gray-500">
            Compared against:{" "}
            <span className="font-medium text-gray-700">
              {audit.referenceImage.name}
            </span>
          </p>
        </div>
        <a
          href="/audit"
          className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
        >
          New Audit
        </a>
      </div>

      {/* Overall Score */}
      {overallScore != null && (
        <div
          className={`rounded-2xl border p-6 mb-8 ${getScoreBgColor(overallScore)}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Overall Score
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-5xl font-bold ${getScoreColor(overallScore)}`}
                >
                  {formatScore(overallScore)}
                </span>
                <span className="text-lg text-gray-400">/ 10.00</span>
              </div>
            </div>
            <div className="text-right">
              <OverallGauge score={overallScore} />
            </div>
          </div>
        </div>
      )}

      {/* Comparison View */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-8">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Comparison View</h2>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(
              [
                { key: "side-by-side", label: "Side by Side" },
                { key: "overlay", label: "Overlay" },
                ...(hasCropped
                  ? [{ key: "cropped", label: "Cropped" }]
                  : []),
              ] as { key: CompareMode; label: string }[]
            ).map((mode) => (
              <button
                key={mode.key}
                onClick={() => setCompareMode(mode.key)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  compareMode === mode.key
                    ? "bg-white text-gray-900 shadow-sm font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {compareMode === "side-by-side" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ComparisonPanel
                label="Reference Source"
                src={`/api/references/${audit.referenceImageId}/image`}
                alt={audit.referenceImage.name}
              />
              <ComparisonPanel
                label="Submitted Sample"
                src={`/api/audits/${audit.id}/images/upload`}
                alt="Uploaded sample"
              />
            </div>
          )}

          {compareMode === "overlay" && (
            <div className="relative max-w-2xl mx-auto">
              <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative select-none">
                {/* Bottom layer: upload */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/audits/${audit.id}/images/upload`}
                  alt="Uploaded sample"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                {/* Top layer: reference with clip */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/references/${audit.referenceImageId}/image`}
                    alt={audit.referenceImage.name}
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{
                      width: `${(100 / sliderPos) * 100}%`,
                      maxWidth: "none",
                    }}
                  />
                </div>
                {/* Slider handle */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-col-resize z-10"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M12.79 14.77a.75.75 0 01.02-1.06L16.748 10 12.81 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                {/* Labels */}
                <div className="absolute top-3 left-3 z-20">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                    Reference
                  </span>
                </div>
                <div className="absolute top-3 right-3 z-20">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                    Sample
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="w-full mt-4"
              />
            </div>
          )}

          {compareMode === "cropped" && hasCropped && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ComparisonPanel
                label="Reference (Cropped)"
                src={`/api/audits/${audit.id}/images/cropped-ref`}
                alt="Cropped reference"
              />
              <ComparisonPanel
                label="Sample (Cropped)"
                src={`/api/audits/${audit.id}/images/cropped-upload`}
                alt="Cropped sample"
              />
            </div>
          )}
        </div>
      </div>

      {/* Score Cards */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">
          Detailed Analysis Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scores.map((item, idx) => (
            <ScoreCard key={item.label} index={idx} {...item} />
          ))}
        </div>
      </div>

      {/* Feedback Details */}
      <div className="space-y-4 mb-8">
        {scores.map(
          (item) =>
            item.feedback && (
              <div
                key={item.label}
                className={`rounded-2xl border p-5 ${getScoreBgColor(item.score ?? 0)}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {item.label} Assessment
                  </h3>
                  <PassFailBadge pass={item.pass} />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {item.feedback}
                </p>

                {/* Photoshop, Exposure & 3D Rendering Fix Instructions */}
                {(item.photoshopFix || item.exposureFix || item.renderFix) && (
                  <div className="mt-4 space-y-3">
                    {item.photoshopFix && (
                      <FixInstructionBlock
                        icon="ps"
                        title="Photoshop Fix"
                        content={item.photoshopFix}
                      />
                    )}
                    {item.exposureFix && (
                      <FixInstructionBlock
                        icon="ex"
                        title="Exposure Correction"
                        content={item.exposureFix}
                      />
                    )}
                    {item.renderFix && (
                      <FixInstructionBlock
                        icon="3d"
                        title="3D Rendering Fix"
                        content={item.renderFix}
                      />
                    )}
                  </div>
                )}
              </div>
            )
        )}
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm text-amber-800">
          <strong>Disclaimer:</strong> This analysis was performed by artificial
          intelligence and is intended as a preliminary assessment only. Results
          should be verified with your Lutron representative before making
          production decisions. Scores may be affected by image quality,
          lighting conditions, and camera settings.
        </p>
      </div>
    </div>
  );
}

function ComparisonPanel({
  label,
  src,
  alt,
}: {
  label: string;
  src: string;
  alt: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden relative">
      <div className="aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-3 left-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
          {label}
        </span>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  sublabel,
  score,
  pass,
  index,
}: {
  label: string;
  sublabel: string;
  score: number | null;
  pass: boolean;
  feedback: string | null;
  index: number;
}) {
  if (score == null) return null;
  const pct = (score / 10) * 100;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            Metric {String(index + 1).padStart(2, "0")}
          </p>
          <p className="font-semibold text-gray-900 mt-0.5">{label}</p>
        </div>
        <PassFailBadge pass={pass} />
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
          {formatScore(score)}
        </span>
        <span className="text-sm text-gray-400">/ 10</span>
      </div>
      <div className="metric-bar-bg">
        <div
          className="metric-bar-fill transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: pass ? "#10b981" : score >= 6 ? "#eab308" : "#ef4444",
          }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">{sublabel}</p>
    </div>
  );
}

function PassFailBadge({ pass }: { pass: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${
        pass
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

function FixInstructionBlock({
  icon,
  title,
  content,
}: {
  icon: "ps" | "ex" | "3d";
  title: string;
  content: string;
}) {
  const iconStyles = {
    ps: "bg-blue-100 text-blue-700",
    ex: "bg-amber-100 text-amber-700",
    "3d": "bg-purple-100 text-purple-700",
  };
  const iconLabels = { ps: "Ps", ex: "Ex", "3d": "3D" };

  return (
    <details className="group">
      <summary className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${iconStyles[icon]}`}
        >
          {iconLabels[icon]}
        </span>
        {title}
        <svg
          className="w-4 h-4 transition-transform group-open:rotate-90"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </summary>
      <div className="mt-2 ml-8 p-3 bg-white/60 rounded-lg border border-gray-200/60">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>
    </details>
  );
}

function OverallGauge({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    score >= 8 ? "#10b981" : score >= 6 ? "#eab308" : "#ef4444";

  return (
    <div className="relative w-28 h-28">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900">
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}
