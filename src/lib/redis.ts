import Redis from "ioredis";

// In-memory fallback map for zero-dependency local dev / offline testing
interface MemoryEntry {
  value: string;
  expiresAt: number | null; // epoch ms
}

class InMemoryRedisClient {
  private store = new Map<string, MemoryEntry>();

  private isExpired(entry: MemoryEntry): boolean {
    if (!entry.expiresAt) return false;
    return Date.now() > entry.expiresAt;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string> {
    let expiresAt: number | null = null;
    if (mode === "EX" && typeof duration === "number") {
      expiresAt = Date.now() + duration * 1000;
    } else if (mode === "PX" && typeof duration === "number") {
      expiresAt = Date.now() + duration;
    }
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const k of keys) {
      if (this.store.delete(k)) deleted++;
    }
    return deleted;
  }

  async incr(key: string): Promise<number> {
    // Synchronous read-modify-write (no await between get and set): the old
    // version yielded to the event loop mid-update, so N concurrent calls all
    // read the same base value and the counter collapsed — silently disabling
    // brute-force lockout on the in-memory fallback backend.
    const entry = this.store.get(key);
    const valid = entry && !this.isExpired(entry) ? entry : undefined;
    if (entry && !valid) {
      this.store.delete(key);
    }
    const val = valid ? parseInt(valid.value, 10) : 0;
    const next = isNaN(val) ? 1 : val + 1;
    this.store.set(key, {
      value: next.toString(),
      expiresAt: valid?.expiresAt ?? null,
    });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, entry);
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) return -2;
    if (!entry.expiresAt) return -1;
    const remaining = Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
    return remaining;
  }

  async ttlMany(keys: string[]): Promise<number[]> {
    const results: number[] = [];
    for (const k of keys) {
      results.push(await this.ttl(k));
    }
    return results;
  }

  async keys(pattern: string): Promise<string[]> {
    const now = Date.now();
    const result: string[] = [];
    // Safely escape regex metacharacters, then convert glob wildcards * and ?
    const escapedPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    const regex = new RegExp("^" + escapedPattern + "$");
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) {
        result.push(key);
      }
    }
    return result;
  }

  async scan(matchPattern: string): Promise<string[]> {
    // Mirrors the real SCAN contract for the fallback store: non-blocking,
    // cursor-less snapshot filtered by the same glob pattern.
    return this.keys(matchPattern);
  }
}

/**
 * Resilient Cache Client:
 * Attempts Redis, but gracefully and silently fails over to in-memory store
 * whenever Redis is offline or unreachable.
 */
class ResilientCacheClient {
  private mem = new InMemoryRedisClient();
  private redisClient: Redis | null = null;
  private isRedisHealthy = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && redisUrl !== "memory") {
      try {
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: 0,
          connectTimeout: 800,
          enableOfflineQueue: false,
          // Exponential backoff up to 30s so a transient network blip does not
          // permanently kill Redis for this process (which would silently
          // downgrade brute-force lockout to a per-instance in-memory store).
          retryStrategy: (times) => Math.min(50 + times * 500, 30000),
        });

        client.on("connect", () => {
          this.isRedisHealthy = true;
        });

        client.on("error", () => {
          this.isRedisHealthy = false;
        });

        this.redisClient = client;
      } catch {
        this.isRedisHealthy = false;
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isRedisHealthy && this.redisClient) {
      try {
        return await this.redisClient.get(key);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.get(key);
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string> {
    if (this.isRedisHealthy && this.redisClient) {
      try {
        if (mode === "EX" && typeof duration === "number") {
          return await this.redisClient.set(key, value, "EX", duration);
        }
        return await this.redisClient.set(key, value);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.set(key, value, mode, duration);
  }

  async del(...keys: string[]): Promise<number> {
    if (this.isRedisHealthy && this.redisClient) {
      try {
        return await this.redisClient.del(...keys);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.del(...keys);
  }

  async incr(key: string): Promise<number> {
    if (this.isRedisHealthy && this.redisClient) {
      try {
        return await this.redisClient.incr(key);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.isRedisHealthy && this.redisClient) {
      try {
        return await this.redisClient.expire(key, seconds);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    if (this.isRedisHealthy && this.redisClient) {
      try {
        return await this.redisClient.ttl(key);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.ttl(key);
  }

  async ttlMany(keys: string[]): Promise<number[]> {
    if (keys.length === 0) return [];
    if (this.isRedisHealthy && this.redisClient) {
      try {
        // One pipelined round trip instead of N sequential TTL awaits: the
        // admin ops page lists every active lockout, and 1+N RTTs serialize
        // the whole page render behind per-key latency.
        const pipeline = this.redisClient.pipeline();
        for (const k of keys) pipeline.ttl(k);
        const results = await pipeline.exec();
        return (results ?? []).map(([err, value]) =>
          err || typeof value !== "number" ? -2 : value
        );
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.ttlMany(keys);
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.isRedisHealthy && this.redisClient) {
      try {
        return await this.redisClient.keys(pattern);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.keys(pattern);
  }

  async scan(matchPattern: string): Promise<string[]> {
    if (this.isRedisHealthy && this.redisClient) {
      try {
        // Cursor-based SCAN: O(bucket) amortized and cooperative, unlike KEYS
        // which blocks the Redis event loop over the entire keyspace and
        // stalls every other client (including live answer submissions).
        let cursor = "0";
        const collected: string[] = [];
        do {
          const [next, batch] = await this.redisClient.scan(
            cursor,
            "MATCH",
            matchPattern,
            "COUNT",
            100
          );
          cursor = next;
          collected.push(...batch);
        } while (cursor !== "0");
        return collected;
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.scan(matchPattern);
  }
}

// Singleton instantiation
const globalForRedis = globalThis as unknown as {
  cacheClient: ResilientCacheClient | undefined;
};

export const redis = globalForRedis.cacheClient ?? new ResilientCacheClient();

globalForRedis.cacheClient = redis;
