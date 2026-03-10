import fs from "fs/promises";
import path from "path";

const STORAGE_PATH = process.env.STORAGE_PATH || "./uploads";

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function saveFile(
  filename: string,
  data: Buffer
): Promise<string> {
  const dir = path.join(STORAGE_PATH, "images");
  await ensureDir(dir);
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, data);
  return filePath;
}

export async function readFile(filename: string): Promise<Buffer> {
  const filePath = path.join(STORAGE_PATH, "images", filename);
  return fs.readFile(filePath);
}

export async function deleteFile(filename: string): Promise<void> {
  const filePath = path.join(STORAGE_PATH, "images", filename);
  try {
    await fs.unlink(filePath);
  } catch {
    // File may not exist, that's ok
  }
}

export function getStoragePath(): string {
  return STORAGE_PATH;
}
