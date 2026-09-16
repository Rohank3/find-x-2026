import { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import {
  IIITL_EMAIL_REGEX,
  parseIIITLEmail,
  isOrganizerEmail,
  type ExtractedStudentMeta,
} from "./email";

export { IIITL_EMAIL_REGEX, parseIIITLEmail, isOrganizerEmail };
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

const isProduction = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // Dev Mock Auth Provider — local development, demoing & automated penetration suites ONLY.
    // Never registered in production: it would allow signing in as any IIITL email (incl. organizers).
    ...(isProduction
      ? []
      : [
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
        try {
          user = await prisma.user.upsert({
            where: { email },
            update: {
              name: credentials.name || email.split("@")[0],
              role,
            },
            create: {
              email,
              name: credentials.name || email.split("@")[0],
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
        ]),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase();

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
        } catch (err) {
          console.error("[AUTH Google] Database connection error during upsert:", err);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branch = user.branch;
        token.batchYear = user.batchYear;
        token.rollNumber = user.rollNumber;
        token.batchTier = user.batchTier;
        token.isFirstYear = user.isFirstYear;
        token.teamId = user.teamId;
      } else if (token.email) {
        // Refresh latest team state from database
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, teamId: true, isFirstYear: true, batchTier: true, branch: true, batchYear: true, rollNumber: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as "STUDENT" | "ORGANIZER";
          token.teamId = dbUser.teamId;
          token.isFirstYear = dbUser.isFirstYear;
          token.batchTier = dbUser.batchTier as "FIRST_YEAR" | "SENIOR";
          token.branch = dbUser.branch;
          token.batchYear = dbUser.batchYear;
          token.rollNumber = dbUser.rollNumber;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.branch = token.branch;
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
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
