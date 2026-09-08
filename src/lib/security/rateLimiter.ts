/**
 * Rate limiting simple par fenêtre glissante fixe, en mémoire (process
 * unique sur le VPS — pas de dépendance Redis à ce stade).
 */

interface Bucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, Bucket>();

let opsSinceSweep = 0;

function sweepExpired(now: number) {
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSec: number;
}

export function consumeRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();

    opsSinceSweep += 1;
    if (opsSinceSweep >= 500) {
        opsSinceSweep = 0;
        sweepExpired(now);
    }

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        bucket = { count: 0, resetAt: now + windowMs };
        buckets.set(key, bucket);
    }

    bucket.count += 1;

    const allowed = bucket.count <= limit;
    const remaining = Math.max(0, limit - bucket.count);
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);

    return { allowed, remaining, retryAfterSec };
}
