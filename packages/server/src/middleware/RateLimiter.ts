/**
 * Sliding-window rate limiter per client.
 */
export class RateLimiter {
  private windows: Map<string, number[]> = new Map();
  private maxOps: number;
  private windowMs: number;

  constructor(maxOps: number, windowMs: number) {
    this.maxOps = maxOps;
    this.windowMs = windowMs;
  }

  /** Returns true if the operation is allowed, false if rate-limited */
  check(clientId: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    let ops = this.windows.get(clientId) || [];
    ops = ops.filter((t) => t > cutoff);
    ops.push(now);
    this.windows.set(clientId, ops);

    return ops.length <= this.maxOps;
  }

  /** Get when the rate limit expires for a client */
  getResetTime(clientId: string): number {
    const ops = this.windows.get(clientId);
    if (!ops || ops.length === 0) return Date.now();
    return ops[0] + this.windowMs;
  }

  /** Remove a client (on disconnect) */
  remove(clientId: string): void {
    this.windows.delete(clientId);
  }

  /** Clear all state */
  clear(): void {
    this.windows.clear();
  }
}
