import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getEffectiveSystemConfig } from "@/lib/competition";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const probeDb = searchParams.get("db") === "true";

    // 1. Check Redis first to avoid waking up Neon if Keep-Alive is turned OFF in Admin
    let isKeepAliveEnabled: boolean | null = null;
    try {
      const cachedFlag = await redis.get("system:neon_keep_alive_enabled");
      if (cachedFlag !== null) {
        isKeepAliveEnabled = cachedFlag === "1";
      }
    } catch {
      // Redis unavailable; proceed with fallback
    }

    let competitionState = "UPCOMING";

    // 2. If Redis had no record, read config (or if keepalive/probe is active)
    if (isKeepAliveEnabled === null || isKeepAliveEnabled || probeDb) {
      const config = await getEffectiveSystemConfig().catch(() => null);
      if (isKeepAliveEnabled === null) {
        isKeepAliveEnabled = Boolean(config?.neonKeepAliveEnabled);
        await redis
          .set("system:neon_keep_alive_enabled", isKeepAliveEnabled ? "1" : "0", "EX", 300)
          .catch(() => {});
      }
      competitionState = config?.competitionState ?? "UPCOMING";
    }

    // 3. ONLY query Neon PostgreSQL if explicitly requested (?db=true) or if admin enabled Neon Keep-Alive.
    // When disabled, return healthy status immediately without waking Neon to preserve compute hours & Vercel tokens.
    if (probeDb) {
      // Rate-limit unauthenticated manual db probes to 1 every 10s to prevent connection pool exhaustion
      const isLocked = await redis.get("health:probe_lock").catch(() => null);
      if (!isLocked) {
        await redis.set("health:probe_lock", "1", "EX", 10).catch(() => {});
        await prisma.$queryRaw`SELECT 1`;
      }
    } else if (isKeepAliveEnabled) {
      // Debounce keep-alive pings to at most once every 60 seconds to prevent connection pool exhaustion
      const isPingLocked = await redis.get("health:keepalive_lock").catch(() => null);
      if (!isPingLocked) {
        await redis.set("health:keepalive_lock", "1", "EX", 60).catch(() => {});
        await prisma.$queryRaw`SELECT 1`;
        await redis.ping().catch(() => {});
      }
    }

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        competitionState,
        database: isKeepAliveEnabled || probeDb ? "connected" : "standby_idle",
        neonKeepAliveEnabled: Boolean(isKeepAliveEnabled),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[HEALTH] Database probe failed:", error);
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: "Database connectivity check failed",
      },
      { status: 503 }
    );
  }
}

