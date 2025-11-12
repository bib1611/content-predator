/**
 * In-Memory Rate Limiter
 * Provides simple rate limiting without external dependencies
 * Note: This is reset on server restart. For production with multiple instances,
 * consider using Redis-based rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if a request should be rate limited
   * @param key - Unique identifier for the rate limit (e.g., IP address or user ID)
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with success status and remaining requests
   */
  check(key: string, limit: number, windowMs: number): {
    success: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.requests.get(key);

    // No previous requests or window expired
    if (!entry || now > entry.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });

      return {
        success: true,
        remaining: limit - 1,
        resetTime: now + windowMs,
      };
    }

    // Within the time window
    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.requests.set(key, entry);

    return {
      success: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Clear all rate limit data (useful for testing)
   */
  clear() {
    this.requests.clear();
  }

  /**
   * Stop the cleanup interval
   */
  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Expensive AI operations
  critique: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  generate: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  generateMarketing: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  scan: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour (in addition to daily limit)

  // Data operations
  opportunities: { limit: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
};

/**
 * Check rate limit for a given key and endpoint
 */
export function checkRateLimit(
  key: string,
  endpoint: keyof typeof RATE_LIMITS
): {
  success: boolean;
  remaining: number;
  resetTime: number;
} {
  const config = RATE_LIMITS[endpoint];
  return rateLimiter.check(`${endpoint}:${key}`, config.limit, config.windowMs);
}

/**
 * Get identifier for rate limiting (IP or user ID)
 */
export function getRateLimitKey(request: Request, userId?: string): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip:${ip}`;
}

/**
 * Create error response for rate limit exceeded
 */
export function rateLimitExceeded(resetTime: number): {
  error: string;
  retryAfter: number;
} {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return {
    error: `Rate limit exceeded. Hunt harder. Try again in ${retryAfter} seconds.`,
    retryAfter,
  };
}

export default rateLimiter;
