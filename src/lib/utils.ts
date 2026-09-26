import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Evaluates cryptic hunt answers strictly server-side:
 * Performs NFKD Unicode normalization, diacritic stripping,
 * lowercasing, and removal of non-alphanumeric characters.
 * E.g., "Mònkey D. Lùffy!" -> "monkeydluffy", "１２３" -> "123"
 */
export function normalizeAnswer(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .slice(0, 500)
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Strips null bytes, zero-width characters, BiDi control overrides,
 * and dangerous non-printable ASCII control characters.
 */
export function stripDangerousChars(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/\0/g, "")
    .replace(/[\u200B-\u200F\uFEFF\u202A-\u202E\u2060-\u2069\u061C\u180E\u00AD]/g, "")
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, "");
}

const RESERVED_TEAM_NAMES = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "tostring",
  "valueof",
  "admin",
  "administrator",
  "system",
  "root",
  "null",
  "undefined",
  "anonymous",
  "mod",
  "moderator",
]);

const TEAM_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9 _-]{1,28}[a-zA-Z0-9]$/;

/**
 * Validates and sanitizes team names against prototype pollution,
 * zero-width spoofing, layout injection, and illegal characters.
 */
export function sanitizeTeamName(input: unknown): { valid: boolean; error?: string; name: string } {
  if (typeof input !== "string") {
    return { valid: false, error: "Team name must be text.", name: "" };
  }

  const cleaned = stripDangerousChars(input)
    .trim()
    .replace(/\s+/g, " ");

  if (cleaned.length < 3 || cleaned.length > 30) {
    return {
      valid: false,
      error: "Team name must be between 3 and 30 characters.",
      name: "",
    };
  }

  if (RESERVED_TEAM_NAMES.has(cleaned.toLowerCase())) {
    return {
      valid: false,
      error: "This team name is reserved and cannot be chosen.",
      name: "",
    };
  }

  if (!TEAM_NAME_REGEX.test(cleaned)) {
    return {
      valid: false,
      error: "Team name must start and end with letters/digits and contain only letters, numbers, spaces, hyphens, or underscores.",
      name: "",
    };
  }

  return { valid: true, name: cleaned };
}

/**
 * Validates that a URL is safe to render in hrefs, iframes, and media tags.
 * Only allows https: and http: protocols, or root-relative paths.
 * Explicitly rejects javascript:, data:, vbscript:, and protocol-relative (//) URLs.
 */
export function isValidSafeUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Root-relative path (must not be protocol-relative `//` or `/\` or contain backslashes)
  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//") && !trimmed.startsWith("/\\") && !trimmed.includes("\\");
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Validates and normalizes asset URLs for puzzles.
 */
export function validateAssetUrl(url?: unknown): string | null {
  if (url === null || url === undefined || url === "") return null;
  if (typeof url !== "string") {
    throw new Error("Asset URL must be a string.");
  }
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (!isValidSafeUrl(trimmed)) {
    throw new Error("Invalid asset URL. Only http://, https://, or root-relative paths are allowed.");
  }

  return trimmed;
}

/**
 * Validates database/entity IDs to prevent unexpected types and malformed identifiers.
 */
export function isValidEntityId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{5,64}$/.test(id);
}


/**
 * Format date nicely for logs and timestamps
 * Formats deterministically using en-US and uppercase to prevent SSR hydration mismatches
 */
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .toUpperCase();
}

/**
 * Format remaining seconds into MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
