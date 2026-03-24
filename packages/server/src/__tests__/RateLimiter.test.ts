import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../middleware/RateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new RateLimiter(3, 1000); // 3 ops per 1 second
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows operations within limit', () => {
    expect(limiter.check('user1')).toBe(true);
    expect(limiter.check('user1')).toBe(true);
    expect(limiter.check('user1')).toBe(true);
  });

  it('blocks operations exceeding limit', () => {
    limiter.check('user1');
    limiter.check('user1');
    limiter.check('user1');
    expect(limiter.check('user1')).toBe(false);
  });

  it('resets after window expires', () => {
    limiter.check('user1');
    limiter.check('user1');
    limiter.check('user1');
    expect(limiter.check('user1')).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(limiter.check('user1')).toBe(true);
  });

  it('tracks users independently', () => {
    limiter.check('user1');
    limiter.check('user1');
    limiter.check('user1');
    expect(limiter.check('user1')).toBe(false);
    expect(limiter.check('user2')).toBe(true);
  });

  it('remove cleans up client state', () => {
    limiter.check('user1');
    limiter.check('user1');
    limiter.check('user1');
    limiter.remove('user1');
    expect(limiter.check('user1')).toBe(true);
  });

  it('clear removes all state', () => {
    limiter.check('user1');
    limiter.check('user2');
    limiter.clear();
    expect(limiter.check('user1')).toBe(true);
    expect(limiter.check('user2')).toBe(true);
  });
});
