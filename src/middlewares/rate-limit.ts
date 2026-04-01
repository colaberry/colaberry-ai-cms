/**
 * Rate-limiting middleware for Strapi CMS.
 *
 * Uses a simple in-memory sliding-window counter.
 * For multi-instance Cloud Run deployments, consider replacing
 * the in-memory store with Redis or Cloud Memorystore.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores: Record<string, Map<string, RateLimitEntry>> = {};

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores[name]) {
    stores[name] = new Map();
  }
  return stores[name];
}

function getClientIp(ctx: any): string {
  // Cloud Run sets x-forwarded-for; use the rightmost non-private IP
  const xff = ctx.request.headers['x-forwarded-for'];
  if (xff) {
    const ips = xff.split(',').map((ip: string) => ip.trim());
    // Rightmost IP is set by the load balancer (most trustworthy)
    return ips[ips.length - 1] || ctx.request.ip;
  }
  return ctx.request.ip;
}

interface RateLimitConfig {
  /** Requests allowed per window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Only apply to paths matching this prefix */
  pathPrefix?: string;
  /** Only apply to paths matching this regex */
  pathPattern?: RegExp;
  /** Name for the store (separate counters per config) */
  name: string;
}

export default (config: RateLimitConfig) => {
  const { max, windowMs, pathPrefix, pathPattern, name } = config;
  const store = getStore(name);

  // Periodic cleanup of expired entries (every 60s)
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, 60_000).unref();

  return async (ctx: any, next: () => Promise<void>) => {
    const path: string = ctx.request.path;

    // Check if this request matches the configured path filter
    if (pathPrefix && !path.startsWith(pathPrefix)) {
      return next();
    }
    if (pathPattern && !pathPattern.test(path)) {
      return next();
    }

    const ip = getClientIp(ctx);
    const key = `${name}:${ip}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    ctx.set('X-RateLimit-Limit', String(max));
    ctx.set('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    ctx.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      ctx.status = 429;
      ctx.body = {
        error: {
          status: 429,
          name: 'TooManyRequestsError',
          message: 'Too many requests, please try again later.',
        },
      };
      return;
    }

    await next();
  };
};
