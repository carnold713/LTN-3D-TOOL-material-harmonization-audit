"use client";

import { useEffect, useState } from "react";

interface Config {
  claude_api_key: string | null;
  pass_threshold: string | null;
  claude_model: string | null;
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form state
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [threshold, setThreshold] = useState("8.0");
  const [model, setModel] = useState("claude-sonnet-4-20250514");

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await fetch("/api/admin/config");
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data: Config = await res.json();
      setConfig(data);
      if (data.pass_threshold) setThreshold(data.pass_threshold);
      if (data.claude_model) setModel(data.claude_model);
    } catch {
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const body: Record<string, string> = {};
      if (apiKey.trim()) body.claude_api_key = apiKey.trim();
      if (threshold.trim()) body.pass_threshold = threshold.trim();
      if (model.trim()) body.claude_model = model.trim();

      if (Object.keys(body).length === 0) {
        setMessage({ type: "error", text: "No changes to save" });
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!res.ok) throw new Error("Failed to save");

      setApiKey("");
      setMessage({ type: "success", text: "Settings saved successfully" });
      await loadConfig();
    } catch {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Settings</h2>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Claude API Key */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Claude API Key
          </label>
          <p className="text-xs text-gray-500 mb-3">
            {config?.claude_api_key
              ? `Current: ${config.claude_api_key}`
              : "Not configured — audits will not work until this is set."}
          </p>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 pr-20"
              placeholder="sk-ant-..."
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Leave blank to keep the current key unchanged.
          </p>
        </div>

        {/* Pass Threshold */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <label
            htmlFor="threshold"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Pass Threshold
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Scores below this value will be marked as FAIL. Default is 8.0.
          </p>
          <input
            id="threshold"
            type="number"
            step="0.1"
            min="1"
            max="10"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Claude Model */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <label
            htmlFor="model"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Claude Model
          </label>
          <p className="text-xs text-gray-500 mb-3">
            The Claude model to use for analysis. Sonnet is recommended for
            cost/speed balance.
          </p>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="claude-sonnet-4-20250514">
              Claude Sonnet 4 (Recommended)
            </option>
            <option value="claude-haiku-4-5-20251001">
              Claude Haiku 4.5 (Faster, lower cost)
            </option>
            <option value="claude-opus-4-6">
              Claude Opus 4.6 (Highest quality)
            </option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-brand-800 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
