// In-memory rate limiter (single-instance)
// For multi-instance deployments, use Redis or similar

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number;
  history: number[];
}

const records = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
  lockoutMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds until unlock
  lockedUntil?: number;
}

/**
 * Check rate limit for a key (typically IP + action)
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const { maxAttempts = 5, windowMs = 15 * 60 * 1000, lockoutMs = 15 * 60 * 1000 } = options;
  const now = Date.now();
  const record = records.get(key);

  // First attempt
  if (!record) {
    records.set(key, {
      count: 1,
      firstAttempt: now,
      lockedUntil: 0,
      history: [now],
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  // Currently locked
  if (record.lockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((record.lockedUntil - now) / 1000),
      lockedUntil: record.lockedUntil,
    };
  }

  // Reset window if expired
  if (now - record.firstAttempt > windowMs) {
    records.set(key, {
      count: 1,
      firstAttempt: now,
      lockedUntil: 0,
      history: [now],
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  record.count++;
  record.history.push(now);

  if (record.count > maxAttempts) {
    record.lockedUntil = now + lockoutMs;
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil(lockoutMs / 1000),
      lockedUntil: record.lockedUntil,
    };
  }

  return { allowed: true, remaining: maxAttempts - record.count };
}

/**
 * Reset rate limit for a key (on successful login)
 */
export function resetRateLimit(key: string): void {
  records.delete(key);
}

/**
 * Cleanup old records (call periodically)
 */
export function cleanupRateLimits(maxAgeMs = 24 * 60 * 60 * 1000): void {
  const now = Date.now();
  for (const [key, record] of records.entries()) {
    if (now - record.firstAttempt > maxAgeMs) {
      records.delete(key);
    }
  }
}

// Auto-cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => cleanupRateLimits(), 60 * 60 * 1000);
}
