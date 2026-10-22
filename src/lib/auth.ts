import { cache } from "react";
import { NextAuthOptions, DefaultSession, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { redis } from "./redis";
import {
  IIITL_EMAIL_REGEX,
  parseIIITLEmail,
  isOrganizerEmail,
  formatStudentBranch,
  type ExtractedStudentMeta,
} from "./email";
import { stripDangerousChars } from "./utils";

export { IIITL_EMAIL_REGEX, parseIIITLEmail, isOrganizerEmail, formatStudentBranch };
export type { ExtractedStudentMeta };

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "ORGANIZER";
      branch: string;
      batchYear: number;
      rollNumber: string;
      batchTier: "FIRST_YEAR" | "SENIOR";
      isFirstYear: boolean;
      teamId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "STUDENT" | "ORGANIZER";
    branch: string;
    batchYear: number;
    rollNumber: string;
    batchTier: "FIRST_YEAR" | "SENIOR";
    isFirstYear: boolean;
    teamId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "STUDENT" | "ORGANIZER";
    branch: string;
    batchYear: number;
    rollNumber: string;
    batchTier: "FIRST_YEAR" | "SENIOR";
    isFirstYear: boolean;
    teamId?: string | null;
  }
}

interface CachedUserAuth {
  timestamp: number;
  data: {
    id: string;
    role: "STUDENT" | "ORGANIZER";
    teamId: string | null;
    isFirstYear: boolean;
    batchTier: "FIRST_YEAR" | "SENIOR";
    branch: string;
    batchYear: number;
    rollNumber: string;
  };
}

const userAuthCache = new Map<string, CachedUserAuth>();
const USER_AUTH_TTL_MS = 15000; // 15s local memory TTL

export function invalidateUserAuthCache(email?: string) {
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    userAuthCache.delete(cleanEmail);
    void redis.del(`auth:user:${cleanEmail}`).catch(() => {});
  } else {
    userAuthCache.clear();
    void redis.keys("auth:user:*").then((keys) => {
      if (keys.length > 0) void redis.del(...keys).catch(() => {});
    }).catch(() => {});
  }
}

/**
 * Request-scoped deduplicated session accessor for React Server Components.
 * Eliminates redundant JWT validations across RootLayout and child pages.
 */
export const getCachedSession = cache(async () => {
  return getServerSession(authOptions);
});

// Dev Mock Auth Provider — strictly for local development and non-production testing ONLY.
// Never expose via NEXT_PUBLIC_ variables and strictly disallow outside development.
const isDevAuthAllowed =
  process.env.NODE_ENV === "development" &&
  process.env.ENABLE_DEV_AUTH === "true";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    ...(isDevAuthAllowed
      ? [
          CredentialsProvider({
      id: "dev-mock-auth",
      name: "IIITL Dev Access",
      credentials: {
        email: { label: "IIITL College Email", type: "email", placeholder: "lcs2026001@iiitl.ac.in" },
        name: { label: "Full Name", type: "text", placeholder: "Rohan Verma" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email.trim().toLowerCase();

        const isOrg = isOrganizerEmail(email);
        const meta = parseIIITLEmail(email);

        if (!isOrg && !meta) {
          throw new Error("Invalid IIITL college email format or unauthorized domain.");
        }

        const role = isOrg ? "ORGANIZER" : "STUDENT";
        const branch = meta?.branch || "org";
        const batchYear = meta?.batchYear || 2023;
        const rollNumber = meta?.rollNumber || "000";
        const batchTier = meta?.batchTier || "SENIOR";
        const isFirstYear = meta?.isFirstYear || false;

        // Upsert into database
        let user;
        const cleanName = credentials.name
          ? stripDangerousChars(credentials.name).trim().slice(0, 50)
          : email.split("@")[0];

        try {
          user = await prisma.user.upsert({
            where: { email },
            update: {
              name: cleanName || email.split("@")[0],
              role,
            },
            create: {
              email,
              name: cleanName || email.split("@")[0],
              role,
              branch,
              batchYear,
              rollNumber,
              batchTier,
              isFirstYear,
            },
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error("[AUTH] Database connection error during upsert:", errMsg);
          throw new Error("Database connection error. Please make sure the database is running.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as "STUDENT" | "ORGANIZER",
          branch: user.branch,
          batchYear: user.batchYear,
          rollNumber: user.rollNumber,
          batchTier: user.batchTier as "FIRST_YEAR" | "SENIOR",
          isFirstYear: user.isFirstYear,
          teamId: user.teamId,
        };
      },
    }),
  ]
: []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase();

      // For Google provider, strictly enforce email_verified === true
      if (account?.provider === "google") {
        const googleProfile = profile as { email_verified?: boolean } | undefined;
        if (!googleProfile || googleProfile.email_verified !== true) {
          console.warn(`[AUTH] Rejected unverified or missing Google profile: ${email}`);
          return false;
        }
      }

      // Check if organizer or valid IIITL student
      const isOrg = isOrganizerEmail(email);
      const meta = parseIIITLEmail(email);

      if (!isOrg && !meta) {
        return false; // Reject unauthorized emails
      }

      if (account?.provider === "google") {
        const role = isOrg ? "ORGANIZER" : "STUDENT";
        const branch = meta?.branch || "org";
        const batchYear = meta?.batchYear || 2023;
        const rollNumber = meta?.rollNumber || "000";
        const batchTier = meta?.batchTier || "SENIOR";
        const isFirstYear = meta?.isFirstYear || false;

        try {
          await prisma.user.upsert({
            where: { email },
            update: {
              name: user.name || email.split("@")[0],
              image: user.image,
              role,
            },
            create: {
              email,
              name: user.name || email.split("@")[0],
              image: user.image,
              role,
              branch,
              batchYear,
              rollNumber,
              batchTier,
              isFirstYear,
            },
          });
          invalidateUserAuthCache(email);
        } catch (err) {
          console.error("[AUTH Google] Database connection error during upsert:", err);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      const email = (user?.email || token.email)?.toLowerCase();

      // If user came from credentials provider and already has full DB model attributes
      if (user && user.role) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.branch = formatStudentBranch(user.branch, user.email);
        token.batchYear = user.batchYear;
        token.rollNumber = user.rollNumber;
        token.batchTier = user.batchTier;
        token.isFirstYear = user.isFirstYear;
        token.teamId = user.teamId;
        return token;
      }

      if (email) {
        // Cache user database refresh for 5m to eliminate redundant DB roundtrips on every page navigation
        const cached = userAuthCache.get(email);
        let dbUser;
        if (!user && token.role && cached && Date.now() - cached.timestamp < USER_AUTH_TTL_MS) {
          dbUser = cached.data;
        } else {
          try {
            dbUser = await prisma.user.findUnique({
              where: { email },
              select: {
                id: true,
                role: true,
                teamId: true,
                isFirstYear: true,
                batchTier: true,
                branch: true,
                batchYear: true,
                rollNumber: true,
              },
            });
            if (dbUser) {
              userAuthCache.set(email, {
                timestamp: Date.now(),
                data: dbUser as CachedUserAuth["data"],
              });
            }
          } catch (err) {
            console.warn("[AUTH] Failed to refresh user from DB, falling back to token claims:", err);
            if (token.id && token.role) {
              dbUser = {
                id: token.id,
                role: token.role,
                teamId: token.teamId ?? null,
                isFirstYear: Boolean(token.isFirstYear),
                batchTier: token.batchTier || "SENIOR",
                branch: token.branch || "org",
                batchYear: token.batchYear || 2023,
                rollNumber: token.rollNumber || "000",
              };
            }
          }
        }
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as "STUDENT" | "ORGANIZER";
          token.teamId = dbUser.teamId;
          token.isFirstYear = dbUser.isFirstYear;
          token.batchTier = dbUser.batchTier as "FIRST_YEAR" | "SENIOR";
          token.branch = formatStudentBranch(dbUser.branch, email);
          token.batchYear = dbUser.batchYear;
          token.rollNumber = dbUser.rollNumber;
        } else if (user) {
          token.id = user.id;
          token.email = user.email;
          token.role = isOrganizerEmail(email) ? "ORGANIZER" : "STUDENT";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email ?? session.user.email;
        session.user.role = token.role;
        session.user.branch = formatStudentBranch(token.branch, session.user.email);
        session.user.batchYear = token.batchYear;
        session.user.rollNumber = token.rollNumber;
        session.user.batchTier = token.batchTier;
        session.user.isFirstYear = token.isFirstYear;
        session.user.teamId = token.teamId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
