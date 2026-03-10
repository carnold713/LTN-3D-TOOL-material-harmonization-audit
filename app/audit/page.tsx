"use client";

import { useEffect, useState, useRef } from "react";

interface Reference {
  id: string;
  name: string;
  description: string | null;
  category: string;
  width: number;
  height: number;
}

type Step = "select" | "upload" | "processing";

const CATEGORY_LABELS: Record<string, string> = {
  faceplate: "Faceplate",
  switch_cover: "Switch Cover",
  dimmer: "Dimmer",
  outlet: "Outlet",
  wallplate: "Wallplate",
  other: "Other",
};

export default function AuditPage() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("select");
  const [selectedRef, setSelectedRef] = useState<Reference | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [processingStatus, setProcessingStatus] = useState("Submitting...");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/references")
      .then((res) => res.json())
      .then(setReferences)
      .catch(() => setError("Failed to load reference materials"))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    "all",
    ...Array.from(new Set(references.map((r) => r.category))),
  ];
  const filtered =
    categoryFilter === "all"
      ? references
      : references.filter((r) => r.category === categoryFilter);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB");
      return;
    }
    setFile(f);
    setError("");
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function handleSubmit() {
    if (!file || !selectedRef) return;
    setUploading(true);
    setError("");
    setStep("processing");
    setProcessingStatus("Uploading image...");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("referenceId", selectedRef.id);

      const res = await fetch("/api/audits", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      const { id } = await res.json();
      setProcessingStatus("AI is analyzing your material...");

      // Poll for results
      let attempts = 0;
      const maxAttempts = 60; // 3 minutes at 3s intervals
      const poll = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch(`/api/audits/${id}`);
          const audit = await statusRes.json();

          if (audit.status === "COMPLETED") {
            clearInterval(poll);
            window.location.href = `/results/${id}`;
          } else if (audit.status === "FAILED") {
            clearInterval(poll);
            setError(audit.errorMessage || "Analysis failed. Please try again.");
            setStep("upload");
            setUploading(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(poll);
            setError("Analysis timed out. Please try again.");
            setStep("upload");
            setUploading(false);
          } else {
            // Update status messages
            if (attempts > 5) setProcessingStatus("Comparing finish quality...");
            if (attempts > 10) setProcessingStatus("Evaluating color match...");
            if (attempts > 15) setProcessingStatus("Assessing material properties...");
            if (attempts > 20) setProcessingStatus("Generating detailed feedback...");
          }
        } catch {
          // Continue polling on network errors
        }
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setStep("upload");
      setUploading(false);
    }
  }

  function selectReference(ref: Reference) {
    setSelectedRef(ref);
    setStep("upload");
    setFile(null);
    setPreview(null);
    setError("");
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Processing
  if (step === "processing") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6">
          <svg
            className="animate-spin w-12 h-12 text-brand-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Analyzing Material
        </h2>
        <p className="text-gray-500 mb-8">{processingStatus}</p>
        <div className="w-full max-w-xs mx-auto">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-600 rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          This typically takes 10-30 seconds
        </p>
      </div>
    );
  }

  // Step 2: Upload
  if (step === "upload" && selectedRef) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <button
          onClick={() => {
            setStep("select");
            setSelectedRef(null);
          }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to reference selection
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload Sample Image
        </h1>
        <p className="text-gray-500 mb-8">
          Upload a photo of your material sample to compare against the
          reference.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reference Preview */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Reference Standard
            </h3>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-square bg-gray-50 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/references/${selectedRef.id}/image`}
                  alt={selectedRef.name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                    Reference Source
                  </span>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100">
                <p className="font-medium text-gray-900">{selectedRef.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {CATEGORY_LABELS[selectedRef.category] || selectedRef.category}
                </p>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Your Sample
            </h3>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div
                onClick={() => fileInput.current?.click()}
                className="aspect-square bg-gray-50 relative cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                {preview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Your sample"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                        Submitted Sample
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white/80 text-gray-600 backdrop-blur-sm border border-gray-200">
                        Click to change
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload your sample
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPEG, PNG, or WebP up to 10MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-4 border-t border-gray-100">
                {file ? (
                  <p className="text-sm text-gray-600">{file.name}</p>
                ) : (
                  <p className="text-sm text-gray-400">No file selected</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={!file || uploading}
            className="px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Run Comparison Audit
          </button>
          <p className="text-xs text-gray-400 max-w-sm">
            Your image will be analyzed by AI. Results are preliminary and should
            be verified with your Lutron representative.
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Select Reference
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Select Reference Material
        </h1>
        <p className="text-gray-500">
          Choose the reference standard you want to compare your sample against.
        </p>
      </div>

      {/* Category Filter */}
      {categories.length > 2 && (
        <div className="flex gap-2 mb-8 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                categoryFilter === cat
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <p className="text-gray-500">No reference materials available.</p>
          <p className="text-sm text-gray-400 mt-1">
            Ask your administrator to upload reference images.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((ref) => (
            <button
              key={ref.id}
              onClick={() => selectReference(ref)}
              className="group text-left bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/references/${ref.id}/image`}
                  alt={ref.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {ref.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {CATEGORY_LABELS[ref.category] || ref.category}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
