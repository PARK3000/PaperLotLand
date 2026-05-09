/**
 * Simple IP-based rate limiter using Upstash Redis.
 * Uses a sliding window counter per IP per bucket.
 */

import { redis } from '@/lib/redis'

/** Full form submissions: 5 per minute per IP */
const SUBMIT_MAX = 5
const SUBMIT_WINDOW = 60

/** Stream/partial updates: 30 per minute per IP (sends every ~10s) */
const STREAM_MAX = 30
const STREAM_WINDOW = 60

async function checkLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, windowSeconds)
    }
    return count > max
  } catch (err) {
    // If Redis is down, allow the request through (fail open)
    console.error('[RateLimit] Redis error, failing open:', err)
    return false
  }
}

/** Rate limit full form submissions (5/min) */
export async function isRateLimited(ip: string): Promise<boolean> {
  if (!ip) return false
  return checkLimit(`rl:lead:${ip}`, SUBMIT_MAX, SUBMIT_WINDOW)
}

/** Rate limit stream/partial sends (30/min) */
export async function isStreamRateLimited(ip: string): Promise<boolean> {
  if (!ip) return false
  return checkLimit(`rl:stream:${ip}`, STREAM_MAX, STREAM_WINDOW)
}
