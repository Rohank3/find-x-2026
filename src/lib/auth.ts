import { cache } from "react";
import { NextAuthOptions, DefaultSession, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { redis } from "./redis";
import {
  IIITL_EMAIL_REGEX,
  IIITL_ANY_EMAIL_REGEX,
  parseIIITLEmail,
  isOrganizerEmail,
  formatStudentBranch,
  type ExtractedStudentMeta,
} from "./email";
import { stripDangerousChars, isValidEntityId, isValidSafeUrl } from "./utils";

export { IIITL_EMAIL_REGEX, IIITL_ANY_EMAIL_REGEX, parseIIITLEmail, isOrganizerEmail, formatStudentBranch };
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
      batchTier: "FIRST_YEAR" | "SENIOR" | "OTHER";
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
    batchTier: "FIRST_YEAR" | "SENIOR" | "OTHER";
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
    batchTier: "FIRST_YEAR" | "SENIOR" | "OTHER";
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
    batchTier: "FIRST_YEAR" | "SENIOR" | "OTHER";
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
        const branch = isOrg ? "org" : (meta?.branch ?? "");
        const batchYear = isOrg ? 2023 : (meta?.batchYear ?? 0);
        const rollNumber = isOrg ? "000" : (meta?.rollNumber ?? "");
        const batchTier = isOrg ? "SENIOR" : (meta?.batchTier ?? "OTHER");
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
          batchTier: user.batchTier as "FIRST_YEAR" | "SENIOR" | "OTHER",
          isFirstYear: user.isFirstYear,
          teamId: user.teamId,
        };
      },
    }),
  ]
: []),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("//") || url.startsWith("/\\")) {
        return baseUrl;
      }
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) return url;
      } catch {
        return baseUrl;
      }
      return baseUrl;
    },
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
        const branch = isOrg ? "org" : (meta?.branch ?? "");
        const batchYear = isOrg ? 2023 : (meta?.batchYear ?? 0);
        const rollNumber = isOrg ? "000" : (meta?.rollNumber ?? "");
        const batchTier = isOrg ? "SENIOR" : (meta?.batchTier ?? "OTHER");
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
                batchTier: token.batchTier || "OTHER",
                branch: token.branch || "org",
                batchYear: token.batchYear || 2023,
                rollNumber: token.rollNumber || "000",
              };
            }
          }
        }

        // Self-heal: If user has a valid IIITL/organizer email but was purged or missing from DB,
        // recreate their record automatically to prevent broken ghost sessions.
        if (!dbUser && email) {
          const isOrg = isOrganizerEmail(email);
          const meta = parseIIITLEmail(email);

          if (isOrg || meta) {
            try {
              const role = isOrg ? "ORGANIZER" : "STUDENT";
              const branch = isOrg ? "org" : (meta?.branch ?? "org");
              const batchYear = isOrg ? 2023 : (meta?.batchYear ?? 2023);
              const rollNumber = isOrg ? "000" : (meta?.rollNumber ?? "000");
              const batchTier = isOrg ? "SENIOR" : (meta?.batchTier ?? "OTHER");
              const isFirstYear = meta?.isFirstYear || false;
              const rawName = (user?.name || token.name || email.split("@")[0]) as string;
              const nameFallback = stripDangerousChars(rawName).trim().slice(0, 50) || email.split("@")[0];
              const rawImage = user?.image || (token.picture as string) || null;
              const cleanImage = typeof rawImage === "string" && isValidSafeUrl(rawImage) ? rawImage : null;

              dbUser = await prisma.user.upsert({
                where: { email },
                update: {
                  name: nameFallback,
                  role,
                },
                create: {
                  email,
                  name: nameFallback,
                  image: cleanImage,
                  role,
                  branch,
                  batchYear,
                  rollNumber,
                  batchTier,
                  isFirstYear,
                },
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

              userAuthCache.set(email, {
                timestamp: Date.now(),
                data: dbUser as CachedUserAuth["data"],
              });
            } catch (healErr) {
              console.error("[AUTH] Self-heal user creation error in jwt callback:", healErr);
            }
          }
        }

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as "STUDENT" | "ORGANIZER";
          token.teamId = dbUser.teamId;
          token.isFirstYear = dbUser.isFirstYear;
          token.batchTier = dbUser.batchTier as "FIRST_YEAR" | "SENIOR" | "OTHER";
          token.branch = formatStudentBranch(dbUser.branch, email);
          token.batchYear = dbUser.batchYear;
          token.rollNumber = dbUser.rollNumber;
        } else if (user) {
          // Never assign Google OAuth's numeric sub ID to token.id as it breaks Prisma CUID lookups
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

/**
 * Resolves the authenticated user from PostgreSQL authoritatively.
 * 1. Checks by `session.user.id`.
 * 2. Falls back to `session.user.email` if ID lookup misses (resolves desynced JWTs or stale cookies).
 * 3. Self-heals the user record via upsert if absent from DB but has a valid IIITL / organizer email.
 */
export async function getAuthoritativeUser(
  session: { user?: { id?: string; email?: string | null; name?: string | null; image?: string | null } } | null
) {
  if (!session?.user) return null;

  const rawUserId = session.user.id;
  const rawEmail = session.user.email;

  const userId = typeof rawUserId === "string" && isValidEntityId(rawUserId) ? rawUserId.trim() : null;
  const email = typeof rawEmail === "string" ? rawEmail.toLowerCase().trim() : null;

  let user = null;

  // 1. Try by validated entity ID if present
  if (userId) {
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { team: true },
      });
    } catch {
      // Ignore and fallback to email lookup
    }
  }

  // 2. Fallback by email (handles desynced JWT token id vs DB CUID)
  if (!user && email) {
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: { team: true },
      });
    } catch {
      // Ignore and fallback to self-heal
    }
  }

  // 3. Self-heal if user is authorized but absent from DB (e.g. post-purge or DB reset)
  if (!user && email) {
    const isOrg = isOrganizerEmail(email);
    const meta = parseIIITLEmail(email);

    if (isOrg || meta) {
      try {
        const role = isOrg ? "ORGANIZER" : "STUDENT";
        const branch = isOrg ? "org" : (meta?.branch ?? "org");
        const batchYear = isOrg ? 2023 : (meta?.batchYear ?? 2023);
        const rollNumber = isOrg ? "000" : (meta?.rollNumber ?? "000");
        const batchTier = isOrg ? "SENIOR" : (meta?.batchTier ?? "OTHER");
        const isFirstYear = meta?.isFirstYear || false;

        const rawName = session.user.name || email.split("@")[0];
        const cleanName = stripDangerousChars(rawName).trim().slice(0, 50) || email.split("@")[0];
        const rawImage = session.user.image || null;
        const cleanImage = typeof rawImage === "string" && isValidSafeUrl(rawImage) ? rawImage : null;

        user = await prisma.user.upsert({
          where: { email },
          update: {
            name: cleanName,
            role,
          },
          create: {
            email,
            name: cleanName,
            image: cleanImage,
            role,
            branch,
            batchYear,
            rollNumber,
            batchTier,
            isFirstYear,
          },
          include: { team: true },
        });

        invalidateUserAuthCache(email);
      } catch (err) {
        console.error("[AUTH] Failed to self-heal user in getAuthoritativeUser:", err);
      }
    }
  }

  return user;
}

