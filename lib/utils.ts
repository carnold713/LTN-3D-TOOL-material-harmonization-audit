import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateFilename(originalName: string, prefix: string): string {
  const ext = originalName.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.${ext}`;
}

export function formatScore(score: number): string {
  return score.toFixed(2);
}

export function getScoreColor(score: number, threshold: number = 8): string {
  if (score >= threshold) return "text-green-600";
  if (score >= threshold - 2) return "text-amber-600";
  return "text-red-600";
}

export function getScoreBgColor(score: number, threshold: number = 8): string {
  if (score >= threshold) return "bg-green-50 border-green-200";
  if (score >= threshold - 2) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}
