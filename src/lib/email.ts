/**
 * IIITL identity helpers.
 *
 * Kept in a standalone module (no Prisma / NextAuth imports) so client
 * components can import them without pulling the database client into
 * the browser bundle.
 */

/**
 * Official IIITL Student Email Regex:
 * Matches: lcs2026042@iiitl.ac.in, lit2024101@iiitl.ac.in, lci2025005@iiitl.ac.in, lcb2023089@iiitl.ac.in
 */
export const IIITL_EMAIL_REGEX = /^l(cs|it|ci|cb)20(23|24|25|26)(0\d{2}|\d{3})@iiitl\.ac\.in$/;

/**
 * Valid IIITL College Email Regex:
 * Enforces valid username characters and exact @iiitl.ac.in domain.
 */
export const IIITL_ANY_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@iiitl\.ac\.in$/;

/**
 * Resolves the student branch code according to IIITL email conventions:
 * - if mail has lci -> AI
 * - if mail has lcb -> B
 * - if mail has lcs -> CS
 * - if mail has lit -> IT
 */
export function getBranchFromEmail(email?: string | null): string | null {
  if (!email) return null;
  const lower = email.trim().toLowerCase();
  if (lower.includes("lci")) return "AI";
  if (lower.includes("lcb")) return "B";
  if (lower.includes("lcs")) return "CS";
  if (lower.includes("lit")) return "IT";
  return null;
}

/**
 * Returns formatted student branch display.
 * Checks email content first (lci->AI, lcb->B, lcs->CS, lit->IT),
 * and falls back to mapping stored branch codes (ci->AI, cb->B, cs->CS, it->IT).
 */
export function formatStudentBranch(
  branchOrEmail?: string | null,
  secondary?: string | null
): string {
  const str1 = branchOrEmail?.trim() || "";
  const str2 = secondary?.trim() || "";

  let email = "";
  let branch = "";

  if (str1.includes("@") || /l(ci|cb|cs|it)/i.test(str1)) {
    email = str1;
    branch = str2;
  } else if (str2.includes("@") || /l(ci|cb|cs|it)/i.test(str2)) {
    email = str2;
    branch = str1;
  } else {
    branch = str1 || str2;
  }

  if (email) {
    const fromEmail = getBranchFromEmail(email);
    if (fromEmail) return fromEmail;
  }

  if (branch) {
    const b = branch.toLowerCase();
    if (b === "other" || b === "none" || b === "n/a" || b === "org") return "";
    if (b === "lci" || b === "ci" || b === "ai") return "AI";
    if (b === "lcb" || b === "cb" || b === "b") return "B";
    if (b === "lcs" || b === "cs") return "CS";
    if (b === "lit" || b === "it") return "IT";
    return branch.toUpperCase();
  }

  return "";
}

export const getStudentBranch = formatStudentBranch;

export interface ExtractedStudentMeta {
  branch: string;
  batchYear: number;
  rollNumber: string;
  batchTier: "FIRST_YEAR" | "SENIOR" | "OTHER";
  isFirstYear: boolean;
}

export function parseIIITLEmail(email?: string | null): ExtractedStudentMeta | null {
  if (typeof email !== "string") return null;
  const clean = email.trim().toLowerCase();
  const match = clean.match(IIITL_EMAIL_REGEX);
  if (match) {
    const branch = formatStudentBranch(match[1], clean);
    const yearStr = "20" + match[2];
    const batchYear = parseInt(yearStr, 10);
    const rollNumber = match[3];
    const isFirstYear = batchYear === 2026;
    const batchTier = isFirstYear ? "FIRST_YEAR" : "SENIOR";

    return {
      branch,
      batchYear,
      rollNumber,
      batchTier,
      isFirstYear,
    };
  }

  // Any other valid @iiitl.ac.in college email (excluding admin/organizer accounts)
  if (IIITL_ANY_EMAIL_REGEX.test(clean) && !isOrganizerEmail(clean)) {
    return {
      branch: "",
      batchYear: 0,
      rollNumber: "",
      batchTier: "OTHER",
      isFirstYear: false,
    };
  }

  return null;
}

export function isOrganizerEmail(email?: string | null): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS || "admin@iiitl.ac.in";

  const adminEmails = raw
    .toLowerCase()
    .split(",")
    .map((e) => e.trim().replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase().trim());
}
