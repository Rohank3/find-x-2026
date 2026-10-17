import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  neonKeepAliveStarted?: boolean;
};

/**
 * Ensures database URL has essential pooling parameters for Neon PgBouncer.
 * Disables prepared statements (pgbouncer=true) to prevent collisions and retries,
 * and configures connection & pool timeouts to eliminate 15-second socket stalls.
 */
function getOptimizedDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  // Neon's PgBouncer supports prepared statements. Explicitly stripped if present
  // because pgbouncer=true instructs Prisma to execute BEGIN, DEALLOCATE ALL, query, COMMIT
  // which quadruples latency across cloud network hops.
  let url = rawUrl
    .replace(/([?&])pgbouncer=true(&|$)/g, (_m, p1, p2) => (p1 === "?" && p2 ? "?" : ""))
    .replace(/[?&]$/, "");

  if (url.includes("-pooler.") || url.includes("neon.tech")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}connect_timeout=15&pool_timeout=15&connection_limit=10`;
  }

  return url;
}

const optimizedUrl = getOptimizedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(optimizedUrl ? { datasourceUrl: optimizedUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;

// Auto-start active background keep-alive to keep Neon compute & connection pools awake
if (!globalForPrisma.neonKeepAliveStarted && typeof setInterval === "function") {
  globalForPrisma.neonKeepAliveStarted = true;

  const ping = async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      // Background warm-up ping failure is non-fatal
    }
  };

  // Immediate warm-up ping in background on cold boot
  void ping();

  // Ping every 3.5 minutes to prevent Neon's 5-minute compute auto-suspend window
  const timer = setInterval(ping, 3.5 * 60 * 1000);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
}
