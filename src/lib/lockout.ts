import { redis } from "./redis";

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
}

export interface LockoutConfig {
  maxAttempts: number;      // Default 5
  windowMinutes: number;    // Default 2 mins (120s)
  lockoutMinutes: number;   // Default 5 mins (300s)
}

const DEFAULT_CONFIG: LockoutConfig = {
  maxAttempts: 5,
  windowMinutes: 2,
  lockoutMinutes: 5,
};

/**
 * Checks if a team is currently locked out on a specific puzzle.
 */
export async function checkLockout(teamId: string, puzzleId: string): Promise<LockoutStatus> {
  const lockoutKey = `lockout:${teamId}:${puzzleId}`;
  const ttl = await redis.ttl(lockoutKey);

  if (ttl > 0) {
    return { isLocked: true, remainingSeconds: ttl };
  }

  return { isLocked: false, remainingSeconds: 0 };
}

/**
 * Serializes the check → increment → threshold → lock sequence per
 * (team, puzzle). Without it, a burst of concurrent wrong submissions all pass
 * the lockout pre-check and all increment before any threshold handler deletes
 * the counter, overshooting maxAttempts — a brute-force limiter overrun.
 */
const lockoutSlots = new Map<string, Promise<unknown>>();

function withLockoutSlot<T>(slotKey: string, fn: () => Promise<T>): Promise<T> {
  const previous = lockoutSlots.get(slotKey) ?? Promise.resolve();
  const run = previous.then(fn, fn);
  const settled = run.then(
    () => undefined,
    () => undefined
  );
  lockoutSlots.set(slotKey, settled);
  void settled.then(() => {
    if (lockoutSlots.get(slotKey) === settled) {
      lockoutSlots.delete(slotKey);
    }
  });
  return run;
}

/**
 * Records a failed attempt for a (team, puzzle) pair.
 * Triggers a lockout if the attempt threshold is breached within the time window.
 */
export async function recordWrongAttempt(
  teamId: string,
  puzzleId: string,
  config: LockoutConfig = DEFAULT_CONFIG
): Promise<{ lockedOutNow: boolean; remainingSeconds: number; attemptsCount: number }> {
  const lockoutKey = `lockout:${teamId}:${puzzleId}`;
  const attemptsKey = `attempts:${teamId}:${puzzleId}`;

  return withLockoutSlot(attemptsKey, async () => {
  // Check if already locked out
  const currentTtl = await redis.ttl(lockoutKey);
  if (currentTtl > 0) {
    return { lockedOutNow: true, remainingSeconds: currentTtl, attemptsCount: config.maxAttempts };
  }

  // Increment wrong attempt counter with an atomic window TTL.
  // incr + separate expire races a dropped/failing expire and leaves a key
  // with no TTL — 5 wrong answers ever would then mean a PERMANENT lockout.
  const attempts = await redis.incr(attemptsKey);
  if (attempts === 1) {
    await redis.expire(attemptsKey, config.windowMinutes * 60);
  } else {
    // Re-assert the window TTL as a safety net: if the original expire was
    // lost, this keeps the counter from living forever.
    const windowTtl = await redis.ttl(attemptsKey);
    if (windowTtl === -1) {
      await redis.expire(attemptsKey, config.windowMinutes * 60);
    }
  }

  // Check if threshold breached
  if (attempts >= config.maxAttempts) {
    const lockoutDurationSec = config.lockoutMinutes * 60;
    await redis.set(lockoutKey, "LOCKED", "EX", lockoutDurationSec);
    await redis.del(attemptsKey);

    return {
      lockedOutNow: true,
      remainingSeconds: lockoutDurationSec,
      attemptsCount: attempts,
    };
  }

  return {
    lockedOutNow: false,
    remainingSeconds: 0,
    attemptsCount: attempts,
  };
  });
}

/**
 * Clears the failed attempts counter when a correct answer is submitted.
 */
export async function clearAttemptsOnSuccess(teamId: string, puzzleId: string): Promise<void> {
  const attemptsKey = `attempts:${teamId}:${puzzleId}`;
  await redis.del(attemptsKey);
}

/**
 * Admin override: Manually unlocks a team on a puzzle.
 */
export async function manualAdminUnlock(teamId: string, puzzleId: string): Promise<void> {
  const lockoutKey = `lockout:${teamId}:${puzzleId}`;
  const attemptsKey = `attempts:${teamId}:${puzzleId}`;
  await redis.del(lockoutKey, attemptsKey);
}

/**
 * Retrieves all currently active lockouts for the Admin Ops console.
 */
export async function getActiveLockouts(): Promise<Array<{ teamId: string; puzzleId: string; remainingSeconds: number }>> {
  // scan() (cursor-based on real Redis) instead of keys(): KEYS is O(N) over
  // the whole keyspace and blocks the Redis event loop while the admin page
  // loads, stalling every other client — including live answer submissions.
  const keys = await redis.scan("lockout:*");

  // Collect well-formed lockout keys first, then resolve all TTLs in ONE
  // pipelined round trip (ttlMany) instead of 1+N sequential awaits.
  const validKeys: Array<{ key: string; teamId: string; puzzleId: string }> = [];
  for (const k of keys) {
    const parts = k.split(":");
    if (parts.length === 3) {
      validKeys.push({ key: k, teamId: parts[1], puzzleId: parts[2] });
    }
  }

  const ttls = await redis.ttlMany(validKeys.map((v) => v.key));
  const lockouts: Array<{ teamId: string; puzzleId: string; remainingSeconds: number }> = [];
  for (let i = 0; i < validKeys.length; i++) {
    const ttl = ttls[i];
    if (ttl > 0) {
      lockouts.push({ teamId: validKeys[i].teamId, puzzleId: validKeys[i].puzzleId, remainingSeconds: ttl });
    }
  }

  return lockouts;
}
