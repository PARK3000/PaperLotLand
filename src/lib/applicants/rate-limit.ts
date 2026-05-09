import { redis } from '@/lib/redis'

/** 3 submissions per hour per IP */
const MAX = 3
const WINDOW = 3600

export async function isApplicantRateLimited(ip: string): Promise<boolean> {
  if (!ip) return false
  try {
    const key = `rl:applicant:${ip}`
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, WINDOW)
    }
    return count > MAX
  } catch (err) {
    console.error('[applicants/rate-limit] Redis error, failing open:', err)
    return false
  }
}
