import { prisma } from "./db";

export async function getConfig(key: string): Promise<string | null> {
  const config = await prisma.appConfig.findUnique({ where: { key } });
  return config?.value ?? null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  await prisma.appConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getClaudeApiKey(): Promise<string | null> {
  return getConfig("claude_api_key");
}

export async function getPassThreshold(): Promise<number> {
  const val = await getConfig("pass_threshold");
  return val ? parseFloat(val) : 8.0;
}

export async function getClaudeModel(): Promise<string> {
  const val = await getConfig("claude_model");
  return val || "claude-sonnet-4-20250514";
}
