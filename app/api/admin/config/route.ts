import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getConfig, setConfig } from "@/lib/config";

const ALLOWED_KEYS = ["claude_api_key", "pass_threshold", "claude_model"];

export async function GET() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config: Record<string, string | null> = {};
  for (const key of ALLOWED_KEYS) {
    const value = await getConfig(key);
    // Mask the API key for display
    if (key === "claude_api_key" && value) {
      config[key] = value.substring(0, 10) + "..." + value.substring(value.length - 4);
    } else {
      config[key] = value;
    }
  }

  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_KEYS.includes(key) && typeof value === "string" && value.trim()) {
      await setConfig(key, value.trim());
    }
  }

  return NextResponse.json({ success: true });
}
