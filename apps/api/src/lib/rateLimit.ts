import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { redis } from './redis'

// Fungsi pembantu untuk membuat instance store baru dengan prefix unik
const createStore = (prefix: string) => 
  process.env.REDIS_HOST 
    ? new RedisStore({ 
        prefix: `rl:${prefix}:`,
        // @ts-expect-error - ioredis type signature mismatch with spread operator
        sendCommand: (...args: string[]) => redis.call(...args) 
      }) 
    : undefined

export const authLimiter = rateLimit({
  store: createStore('auth'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 percobaan per 15 menit per IP
  skipSuccessfulRequests: true, // hanya hitung request yang gagal (4xx/5xx)
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

export const apiLimiter = rateLimit({
  store: createStore('api'),
  windowMs: 60 * 1000,
  max: 1000,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak request. Coba lagi sebentar.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

/** Limit article create bursts per authenticated user (or IP). */
const articleRateLimitKey = (req: { ip?: string; user?: { userId?: string } }) => {
  const user = (req as { user?: { userId?: string } }).user
  return user?.userId ? `user:${user.userId}` : `ip:${req.ip}`
}

export const articleWriteLimiter = rateLimit({
  store: createStore('article-write'),
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: articleRateLimitKey,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak pembuatan artikel. Coba lagi dalam 1 jam.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

export const articleUpdateLimiter = rateLimit({
  store: createStore('article-update'),
  windowMs: 60 * 60 * 1000,
  max: 120,
  keyGenerator: articleRateLimitKey,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak pembaruan artikel. Coba lagi dalam 1 jam.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

export const aiLimiter = rateLimit({
  store: createStore('ai'),
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMITED',
      message: 'Batas penggunaan AI tercapai. Coba lagi dalam 1 jam.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})