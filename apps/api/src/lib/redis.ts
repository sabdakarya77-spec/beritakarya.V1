import Redis from 'ioredis'
import { env } from './env'

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT),
  password: env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    // Stop retrying if not configured or after 3 attempts to avoid log spam
    if (!process.env.REDIS_HOST || times > 3) return null
    return Math.min(times * 50, 2000)
  }
})

redis.on('error', (err: Error) => {
  if (process.env.REDIS_HOST) {
    console.error('Redis Error:', err)
  }
})

const KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'app:'

function getFullKey(key: string): string {
  return key.startsWith(KEY_PREFIX) ? key : `${KEY_PREFIX}${key}`
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!process.env.REDIS_HOST) return null
  try {
    const data = await redis.get(getFullKey(key))
    if (!data) return null
    return JSON.parse(data)
  } catch {
    return null
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600) {
  if (!process.env.REDIS_HOST) return
  try {
    await redis.set(getFullKey(key), JSON.stringify(value), 'EX', ttlSeconds)
  } catch {}
}

export async function deleteCache(key: string) {
  if (!process.env.REDIS_HOST) return
  try {
    await redis.del(getFullKey(key))
  } catch {}
}

export async function clearPattern(pattern: string): Promise<void> {
  if (!process.env.REDIS_HOST) return
  try {
    const fullPattern = pattern.startsWith(KEY_PREFIX) ? pattern : `${KEY_PREFIX}${pattern}`
    const keys = await redis.keys(fullPattern)
    if (keys.length === 0) return

    // [H-008] Batch deletion to avoid blocking Redis
    const BATCH_SIZE = 1000
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE)
      if (batch.length > 0) {
        await redis.del(...batch)
      }
    }
  } catch (err) {
    console.error(`[Redis] Failed to clear pattern ${pattern}:`, err)
  }
}
