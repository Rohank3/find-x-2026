import { prisma } from "@/lib/prisma";
import { unstable_cache, revalidateTag } from "next/cache";

const getCachedPuzzleCatalog = unstable_cache(
  async () => {
    return prisma.puzzle.findMany({
      orderBy: { orderIndex: "asc" },
      select: {
        id: true,
        orderIndex: true,
        title: true,
        description: true,
        assetUrl: true,
        assetType: true,
        basePoints: true,
        createdAt: true,
        hints: {
          select: {
            id: true,
            orderIndex: true,
            penaltyPoints: true,
            unlockDelayMinutes: true,
            content: true,
          },
          orderBy: { orderIndex: "asc" },
        },
        assets: {
          select: {
            id: true,
            orderIndex: true,
            title: true,
            url: true,
            type: true,
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
  },
  ["hunt-puzzle-catalog"],
  { revalidate: 600, tags: ["puzzles"] }
);

export type CatalogPuzzles = Awaited<ReturnType<typeof getCachedPuzzleCatalog>>;

interface CatalogCacheEntry {
  timestamp: number;
  data: CatalogPuzzles;
}

let catalogMemCache: CatalogCacheEntry | null = null;
const CATALOG_MEM_TTL_MS = 600000; // 10 minutes

export function purgePuzzleCatalogCache() {
  catalogMemCache = null;
  try {
    revalidateTag("puzzles", "max");
  } catch {
    // Graceful fallback if invoked outside an active request store
  }
}

export async function getFastPuzzleCatalog(): Promise<CatalogPuzzles> {
  if (catalogMemCache && Date.now() - catalogMemCache.timestamp < CATALOG_MEM_TTL_MS) {
    return catalogMemCache.data;
  }
  const data = await getCachedPuzzleCatalog();
  catalogMemCache = { timestamp: Date.now(), data };
  return data;
}
