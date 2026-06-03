import 'dotenv/config'
import * as Sentry from '@sentry/node'
import { env } from './lib/env'
import './lib/envValidation'
import express from 'express'
import cors, { type CorsOptions } from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { specs } from './swagger'
import { authRouter } from './modules/auth/auth.controller'
import { userRouter } from './modules/user/user.controller'
import { articleRouter } from './modules/article/article.controller'
import { mediaRouter } from './modules/media/media.controller'
import { aiRouter } from './ai/ai.controller'
import { adRouter } from './modules/ad/ad.controller'
import { newsletterRouter } from './modules/newsletter/newsletter.controller'
import { auditRouter } from './modules/audit/audit.controller'
import { analyticsRouter } from './modules/analytics/analytics.controller'
import { notificationRouter } from './modules/notification/notification.controller'
import { commentRouter } from './modules/comment/comment.controller'
import { kycRouter } from './modules/kyc/kyc.controller'
import { invitationRouter } from './modules/invitation/invitation.controller'
import adminRouter from './admin/admin.router'
import cron from 'node-cron'
import timeout from 'connect-timeout'
import { runKYCCleanup } from './cron/kyc-cleanup'
import { runTokenCleanup } from './cron/token-cleanup'
import { checkAllQuotas } from './middleware/quotaNotifications'
import { requestIdMiddleware } from './middleware/requestId.middleware'
import { errorMiddleware } from './middleware/error.middleware'
import { sanitizeMiddleware } from './middleware/sanitize.middleware'
import { securityHeadersMiddleware } from './middleware/security.middleware'
import { performanceMiddleware } from './middleware/performance.middleware'
import { jwtVerify } from './middleware/jwtVerification.middleware'
import { requireAuth, requireRole, requireSuperadmin } from './middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from './middleware/site.middleware'
import { authLimiter, apiLimiter } from './lib/rateLimit'
import { prisma } from './db/client'
import { logger, httpLogger } from './lib/logger'
import { metrics } from './lib/monitoring'
import { asyncHandler } from './utils/asyncHandler'
import cookieParser from 'cookie-parser'
import { getMeilisearchCircuitStatus } from './modules/article/search.service'
import { processDueScheduledArticles } from './modules/article/article.service'

// Import global type augmentation (must be before other imports)
import './types/express'

// Import controller functions
import * as categoryController from './modules/category/category.controller'
import * as siteController from './modules/site/site.controller'

// Initialize Sentry error tracking
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    beforeSend(event, _hint) {
      // Sanitize sensitive data before sending
      if (event.request) {
        if (event.request.headers?.authorization) {
          event.request.headers.authorization = '[REDACTED]'
        }
        if (event.request.headers?.cookie) {
          event.request.headers.cookie = '[REDACTED]'
        }
      }
      return event
    }
  })
}

const app = express()
// Enable trust proxy for Nginx/Load Balancer (PDP & Security)
app.set('trust proxy', env.TRUST_PROXY || 'loopback, linklocal, uniquelocal')
const PORT = env.PORT

// Request timeout middleware (30 seconds)
app.use(timeout('30s'))
app.use((req, res, next) => {
  if (!req.timedout) next()
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}))

const allowedOrigins: (string | RegExp)[] = [
  /^https?:\/\/(.+\.)?beritakarya\.co$/,
  /^https?:\/\/(.+\.)?beritakarya\.com$/,
  /^https?:\/\/(.+\.)?vercel\.app$/,
  'http://localhost:3000',
  'http://localhost:3001',
]

if (env.CORS_ORIGIN) {
  env.CORS_ORIGIN.split(',').forEach(o => allowedOrigins.push(o.trim()))
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    )
    if (allowed) {
      callback(null, true)
    } else {
      callback(new Error(`Origin '${origin}' tidak diizinkan oleh CORS`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-Site-ID',
    'x-site-id',
    'X-API-Key',
    'x-api-key',
  ],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400
}

app.options('*', cors(corsOptions))
app.use(cors(corsOptions))

app.use(securityHeadersMiddleware)
app.use(cookieParser())
app.use(jwtVerify)

app.use(express.json({ limit: '10mb' }))
app.use(sanitizeMiddleware)
app.use(requestIdMiddleware)
app.use(httpLogger)
app.use(performanceMiddleware)

// apiLimiter untuk semua route KECUALI /api/v1/auth (auth punya limiter sendiri)
app.use('/api/v1', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next() // skip, authLimiter yang handle
  return apiLimiter(req, res, next)
})

app.use('/api/v1/auth', authLimiter, authRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/articles', articleRouter)
app.use('/api/v1/media', mediaRouter)
app.use('/api/v1/ai', aiRouter)

// Category routes - using functions directly (not routers)
// GET: public (anyone can read categories)
app.get('/api/v1/categories/tree', siteMiddleware, asyncHandler(categoryController.getCategoryTree))
app.get('/api/v1/categories', siteMiddleware, asyncHandler(categoryController.getCategories))
app.post('/api/v1/categories/seed-global',
  requireAuth,
  requireRole(['superadmin']),
  asyncHandler(categoryController.seedGlobalCategories))
// POST/PUT/DELETE: requires auth + site scope + role wapimred/superadmin
app.post('/api/v1/categories',
  requireAuth, siteMiddleware, requireSiteAccess,
  requireRole(['superadmin', 'wapimred']),
  asyncHandler(categoryController.createCategory))
app.put('/api/v1/categories/:id',
  requireAuth, siteMiddleware, requireSiteAccess,
  requireRole(['superadmin', 'wapimred']),
  asyncHandler(categoryController.updateCategory))
app.delete('/api/v1/categories/:id',
  requireAuth, siteMiddleware, requireSiteAccess,
  requireRole(['superadmin', 'wapimred']),
  asyncHandler(categoryController.deleteCategory))

// Site routes - using functions directly
// GET: public (anyone can read site info)
app.get('/api/v1/sites', asyncHandler(siteController.getSites))
app.get('/api/v1/sites/settings', asyncHandler(siteController.getSiteSettings))
app.get('/api/v1/sites/:siteId/category-assignments',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(siteController.getSiteCategoryAssignments))
app.put('/api/v1/sites/:siteId/category-assignments',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(siteController.updateSiteCategoryAssignments))
app.get('/api/v1/sites/:id', asyncHandler(siteController.getSiteById))
// PATCH settings: requires auth + site scope + role wapimred/superadmin
app.patch('/api/v1/sites/settings',
  requireAuth, siteMiddleware, requireSiteAccess,
  requireRole(['superadmin', 'wapimred']),
  asyncHandler(siteController.updateSiteSettings))
// POST/PUT/DELETE/assignWapimred: superadmin only
app.post('/api/v1/sites',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(siteController.createSite))
app.put('/api/v1/sites/:id',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(siteController.updateSite))
app.delete('/api/v1/sites/:id',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(siteController.deleteSite))
app.post('/api/v1/sites/:id/wapimred',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(siteController.assignWapimred))

app.use('/api/v1/ads', adRouter)
app.use('/api/v1/newsletter', newsletterRouter)
app.use('/api/v1/audit', auditRouter)
app.use('/api/v1/analytics', analyticsRouter)
app.use('/api/v1/notifications', notificationRouter)
app.use('/api/v1/comments', commentRouter)
app.use('/api/v1/kyc', kycRouter)
app.use('/api/v1/invitations', invitationRouter)
app.use('/api/v1/admin', adminRouter)

app.get('/health', asyncHandler(async (_, res) => {
  let databaseHealth = false
  try {
    await prisma.$queryRaw`SELECT 1`
    databaseHealth = true
  } catch (e) {
    logger.error('Database health check failed:', e)
  }

  const meilisearchCircuit = getMeilisearchCircuitStatus()
  const meilisearchDegraded = Object.values(meilisearchCircuit).some(
    (s) => s.enabled && s.state === 'open'
  )

  const status = databaseHealth ? (meilisearchDegraded ? 'degraded' : 'healthy') : 'unhealthy'
  res.status(databaseHealth ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: databaseHealth ? 'healthy' : 'unhealthy',
      meilisearch: {
        status: meilisearchDegraded ? 'degraded' : 'healthy',
        circuitBreakers: meilisearchCircuit,
      },
    },
  })
}))

app.get('/metrics', requireSuperadmin, (_, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics: metrics.getSummary(),
    timestamp: new Date().toISOString()
  })
})

app.use(errorMiddleware)

// Capture unhandled errors globally if Sentry is enabled
if (env.SENTRY_DSN) {
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error)
    Sentry.close()
    process.exit(1)
  })

  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason)
    Sentry.close()
    process.exit(1)
  })
}

const server = app.listen(PORT, () => {
  logger.info(`API berjalan di http://localhost:${PORT}`)
})

// ── CRON JOBS ────────────────────────────────────────────────────────────
// Hourly AI quota check: warn users approaching limits, disable if exceeded
cron.schedule('0 * * * *', async () => {
  logger.info('Running hourly AI quota check...')
  try {
    await checkAllQuotas()
  } catch (err) {
    logger.error('Hourly quota check failed:', err)
  }
})

// Daily at midnight: KYC cleanup
cron.schedule('0 0 * * *', async () => {
  try {
    await runKYCCleanup()
  } catch (err) {
    logger.error('KYC cleanup failed:', err)
  }
})

// Daily at 1 AM: Expired token cleanup
cron.schedule('0 1 * * *', async () => {
  try {
    await runTokenCleanup()
  } catch (err) {
    logger.error('Token cleanup failed:', err)
  }
})

// Every 5 minutes: auto-publish scheduled articles that are due
cron.schedule('*/5 * * * *', async () => {
  try {
    const result = await processDueScheduledArticles()
    if (result.published > 0 || result.failed > 0) {
      logger.info(
        `Scheduled publish: ${result.published} published, ${result.failed} failed`
      )
    }
  } catch (err) {
    logger.error('Scheduled article publish failed:', err)
  }
})

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  try {
    await prisma.$disconnect()
    server.close(() => {
      logger.info('Server closed')
      process.exit(0)
    })
  } catch (error) {
    logger.error('Error during graceful shutdown:', error)
    process.exit(1)
  }
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  try {
    await prisma.$disconnect()
    server.close(() => {
      logger.info('Server closed')
      process.exit(0)
    })
  } catch (error) {
    logger.error('Error during graceful shutdown:', error)
    process.exit(1)
  }
})