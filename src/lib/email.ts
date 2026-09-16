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

export interface ExtractedStudentMeta {
  branch: string;
  batchYear: number;
  rollNumber: string;
  batchTier: "FIRST_YEAR" | "SENIOR";
  isFirstYear: boolean;
}

export function parseIIITLEmail(email: string): ExtractedStudentMeta | null {
  const match = email.toLowerCase().match(IIITL_EMAIL_REGEX);
  if (!match) return null;

  const branch = match[1];
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

export function isOrganizerEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .toLowerCase()
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase());
}
