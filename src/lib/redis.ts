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
    // Collapse consecutive wildcards, escape regex metacharacters, then convert glob wildcards * and ?
    const normalized = pattern.replace(/\*+/g, "*");
    const escapedPattern = normalized
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, "[^\\s]*")
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

  private sets = new Map<string, Set<string>>();

  async sadd(key: string, ...members: string[]): Promise<number> {
    let set = this.sets.get(key);
    if (!set) {
      set = new Set<string>();
      this.sets.set(key, set);
    }
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = this.sets.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) removed++;
    }
    return removed;
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.sets.get(key);
    return set ? Array.from(set) : [];
  }

  async scan(matchPattern: string): Promise<string[]> {
    // Mirrors the real SCAN contract for the fallback store: non-blocking,
    // cursor-less snapshot filtered by the same glob pattern.
    return this.keys(matchPattern);
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 1200): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Redis command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Resilient Cache Client:
 * Attempts Redis, but gracefully and silently fails over to in-memory store
 * whenever Redis is offline, unreachable, or unresponsive.
 * Enforces a strict 250ms deadline on every command to prevent 15-second socket stalls.
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
          connectTimeout: 3000,
          commandTimeout: 1200,
          enableOfflineQueue: false,
          lazyConnect: false,
          keepAlive: 10000,
          retryStrategy: (times) => Math.min(50 + times * 200, 2000),
        });

        client.on("ready", () => {
          this.isRedisHealthy = true;
        });

        client.on("connect", () => {
          this.isRedisHealthy = true;
        });

        client.on("error", () => {
          this.isRedisHealthy = false;
        });

        client.on("close", () => {
          this.isRedisHealthy = false;
        });

        this.redisClient = client;
      } catch {
        this.isRedisHealthy = false;
      }
    }
  }

  private getActiveClient(): Redis | null {
    if (!this.redisClient) return null;
    if (this.isRedisHealthy || this.redisClient.status === "ready") {
      this.isRedisHealthy = true;
      return this.redisClient;
    }
    return null;
  }

  async get(key: string): Promise<string | null> {
    const client = this.getActiveClient();
    if (client) {
      try {
        return await withTimeout(client.get(key), 250);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.get(key);
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string> {
    const client = this.getActiveClient();
    if (client) {
      try {
        if (mode === "EX" && typeof duration === "number") {
          return await withTimeout(client.set(key, value, "EX", duration), 250);
        }
        return await withTimeout(client.set(key, value), 250);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.set(key, value, mode, duration);
  }

  async del(...keys: string[]): Promise<number> {
    const client = this.getActiveClient();
    if (client) {
      try {
        return await withTimeout(client.del(...keys), 250);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.del(...keys);
  }

  async incr(key: string): Promise<number> {
    const client = this.getActiveClient();
    if (client) {
      try {
        return await withTimeout(client.incr(key), 250);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    const client = this.getActiveClient();
    if (client) {
      try {
        return await withTimeout(client.expire(key, seconds), 250);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    const client = this.getActiveClient();
    if (client) {
      try {
        return await withTimeout(client.ttl(key), 250);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.ttl(key);
  }

  async ttlMany(keys: string[]): Promise<number[]> {
    if (keys.length === 0) return [];
    const client = this.getActiveClient();
    if (client) {
      try {
        const pipeline = client.pipeline();
        for (const k of keys) pipeline.ttl(k);
        const results = await withTimeout(pipeline.exec(), 350);
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
    const client = this.getActiveClient();
    if (client) {
      try {
        return await withTimeout(client.keys(pattern), 350);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.keys(pattern);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    const client = this.getActiveClient();
    if (client) {
      try {
        return await withTimeout(client.sadd(key, ...members), 250);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    const client = this.getActiveClient();
    if (client) {
      try {
        return await withTimeout(client.srem(key, ...members), 250);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    const client = this.getActiveClient();
    if (client) {
      try {
        return await withTimeout(client.smembers(key), 250);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.smembers(key);
  }

  async scan(matchPattern: string): Promise<string[]> {
    const client = this.getActiveClient();
    if (client) {
      try {
        let cursor = "0";
        const collected: string[] = [];
        let rounds = 0;
        do {
          const [next, batch] = await withTimeout(
            client.scan(cursor, "MATCH", matchPattern, "COUNT", 500),
            250
          );
          cursor = next;
          collected.push(...batch);
          rounds++;
          if (rounds >= 5) break;
        } while (cursor !== "0");
        return collected;
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return this.mem.scan(matchPattern);
  }
  async ping(): Promise<string> {
    const client = this.getActiveClient();
    if (client) {
      try {
        return await withTimeout(client.ping(), 1200);
      } catch {
        this.isRedisHealthy = false;
      }
    }
    return "PONG";
  }
}

// Singleton instantiation
const globalForRedis = globalThis as unknown as {
  cacheClient: ResilientCacheClient | undefined;
};

export const redis = globalForRedis.cacheClient ?? new ResilientCacheClient();

globalForRedis.cacheClient = redis;
